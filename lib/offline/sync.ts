/**
 * OFFLINE-01 — the sync engine.
 *
 * Drains the outbox to POST /sales. Design constraints:
 *
 * - **Serial, never parallel.** Each sale writes stock movements; draining
 *   concurrently would interleave them and make the ledger order meaningless.
 * - **Exactly-once relies on the server.** The client resends the same
 *   `clientSaleId`; migration 0018's unique index plus the route's replay path
 *   guarantee one row. The client never tries to decide whether a sale "already
 *   went through" — it cannot know.
 * - **A timeout is not a failure.** The request may have committed. Such an
 *   entry stays queued and is retried; the server recognises the replay and
 *   returns the original sale.
 */
'use client'

import { authHeaders } from '@/lib/api/auth-headers'
import { notifyRegisterLocked } from '@/lib/api/client'
import { probeReachable } from './connectivity'
import { claimNext, markDead, releaseForRetry, resolveSynced, type QueuedSale } from './queue'

const MAX_ATTEMPTS = 8
const BASE_BACKOFF_MS = 2_000
const MAX_BACKOFF_MS = 5 * 60_000
const REQUEST_TIMEOUT_MS = 20_000

export interface SyncOutcome {
  synced: number
  failed: number
  dead: number
  stoppedBecauseOffline: boolean
}

let draining = false

function backoffFor(attempts: number) {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS)
}

/**
 * Same variable lib/api/client.ts uses for POST /sales — deliberately not a
 * second env var. NEXT_PUBLIC_API_BASE_URL never existed anywhere else in this
 * codebase; a queued sale would previously have POSTed to the frontend's own
 * origin (relative URL, no host) and silently 404ed.
 */
function apiUrl() {
  return process.env.NODE_ENV === 'production'
    ? '/_backend'
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
}

async function postSale(entry: QueuedSale): Promise<Response> {
  const auth = await authHeaders()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(`${apiUrl()}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ?? {}),
      },
      body: JSON.stringify(entry.body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Drain the outbox. Safe to call from several triggers at once — the
 * module-level guard plus the queue's `sending` claim keep it single-flight.
 */
export async function drainQueue(): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { synced: 0, failed: 0, dead: 0, stoppedBecauseOffline: false }
  if (draining) return outcome
  draining = true

  try {
    if (!(await probeReachable())) {
      outcome.stoppedBecauseOffline = true
      return outcome
    }

    // Serial loop. One entry at a time, oldest first.
    for (;;) {
      const entry = await claimNext()
      if (!entry) break

      if (entry.attempts > MAX_ATTEMPTS) {
        await markDead(entry.clientSaleId, `Gave up after ${MAX_ATTEMPTS} attempts.`, entry.lastStatus)
        outcome.dead += 1
        continue
      }

      let res: Response
      try {
        res = await postSale(entry)
      } catch (err: any) {
        // Network error or timeout. The sale MAY have committed server-side, so
        // this is explicitly not a failure — requeue and let the server's
        // replay path sort it out on the next attempt.
        await releaseForRetry(entry.clientSaleId, err?.name === 'AbortError' ? 'Request timed out' : 'Network unreachable', null)
        outcome.failed += 1
        outcome.stoppedBecauseOffline = true
        break
      }

      // 200 = replay of an already-recorded sale, 201 = recorded now. Both mean
      // the server holds exactly one sale for this clientSaleId.
      if (res.status === 200 || res.status === 201) {
        const sale = (await res.json()) as { id: string; totalAmount: string }
        await resolveSynced(entry.clientSaleId, { saleId: sale.id, confirmedTotal: sale.totalAmount })
        outcome.synced += 1
        continue
      }

      const bodyText = await res.text().catch(() => '')

      // 5xx and 429 are transient — the server is unwell, not the payload.
      if (res.status >= 500 || res.status === 429) {
        await releaseForRetry(entry.clientSaleId, `Server error ${res.status}`, res.status)
        outcome.failed += 1
        await new Promise((r) => setTimeout(r, backoffFor(entry.attempts)))
        continue
      }

      // A locked register needs a fresh PIN, not payload intervention. Keep
      // the sale queued and return the whole app to the operator gate.
      if (res.status === 423) {
        await releaseForRetry(entry.clientSaleId, 'Staff PIN required before this sale can sync', res.status)
        outcome.failed += 1
        notifyRegisterLocked()
        break
      }

      // 401/403 — the session expired or lost authorisation. Not the sale's
      // fault, and retrying after re-auth will work. Stop the drain rather than
      // burning attempts on every queued entry.
      if (res.status === 401 || res.status === 403) {
        await releaseForRetry(entry.clientSaleId, 'Sign-in required before this sale can sync', res.status)
        outcome.failed += 1
        break
      }

      // Any other 4xx is a genuine rejection of this payload (closed shift,
      // deleted variant, payment mismatch). Retrying cannot fix it; a human
      // must decide. Never dropped.
      await markDead(entry.clientSaleId, describeRejection(res.status, bodyText), res.status)
      outcome.dead += 1
    }

    return outcome
  } finally {
    draining = false
  }
}

function describeRejection(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    // fall through
  }
  return `Rejected by the server (${status}).`
}

/**
 * Wire the drain to its triggers: reconnect, tab focus, and a slow safety
 * timer. Returns a cleanup function.
 */
export function startSyncEngine(onOutcome?: (outcome: SyncOutcome) => void): () => void {
  let stopped = false

  const run = async () => {
    if (stopped) return
    const outcome = await drainQueue()
    if (!stopped) onOutcome?.(outcome)
  }

  void run()
  const timer = window.setInterval(run, 60_000)
  const onOnline = () => void run()
  const onFocus = () => void run()

  window.addEventListener('online', onOnline)
  window.addEventListener('focus', onFocus)

  return () => {
    stopped = true
    window.clearInterval(timer)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('focus', onFocus)
  }
}
