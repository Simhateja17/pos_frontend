/**
 * OFFLINE-01 — the sale outbox.
 *
 * Invariants:
 * - An entry is removed ONLY on a confirmed server response. Never on a
 *   timeout, never on a network error, never on app teardown. If we are not
 *   certain the server has it, it stays queued.
 * - `clientSaleId` is the primary key, so enqueuing the same bill twice is a
 *   no-op rather than a second entry. This mirrors the server's unique index
 *   (migration 0018) on the client side.
 * - A permanently rejected sale becomes `dead`, not deleted. Silently dropping
 *   money is worse than surfacing a problem.
 */
import { getOutboxDb, type QueuedSale, type QueuedSaleStatus } from './db'

export type { QueuedSale, QueuedSaleStatus }

export async function enqueueSale(input: {
  clientSaleId: string
  body: unknown
  estimatedTotal: string
}): Promise<QueuedSale> {
  const db = await getOutboxDb()
  const existing = await db.get('sales', input.clientSaleId)
  if (existing) return existing

  const now = new Date().toISOString()
  const entry: QueuedSale = {
    clientSaleId: input.clientSaleId,
    body: input.body,
    status: 'pending',
    attempts: 0,
    lastError: null,
    lastStatus: null,
    createdAt: now,
    updatedAt: now,
    estimatedTotal: input.estimatedTotal,
    confirmedTotal: null,
    saleId: null,
  }
  await db.put('sales', entry)
  return entry
}

/** Oldest first — order matters, because stock movements are order-sensitive. */
export async function listQueue(status?: QueuedSaleStatus): Promise<QueuedSale[]> {
  const db = await getOutboxDb()
  const all = await db.getAllFromIndex('sales', 'by-created')
  return status ? all.filter((e) => e.status === status) : all
}

export async function countPending(): Promise<number> {
  return (await listQueue()).filter((e) => e.status !== 'dead').length
}

/**
 * Claim the next entry for sending. Marks it `sending` so a second drain
 * running concurrently (focus + timer firing together) cannot pick it up.
 */
export async function claimNext(): Promise<QueuedSale | null> {
  const db = await getOutboxDb()
  const tx = db.transaction('sales', 'readwrite')
  const all = await tx.store.index('by-created').getAll()
  const next = all.find((e) => e.status === 'pending')
  if (!next) {
    await tx.done
    return null
  }
  const claimed: QueuedSale = {
    ...next,
    status: 'sending',
    attempts: next.attempts + 1,
    updatedAt: new Date().toISOString(),
  }
  await tx.store.put(claimed)
  await tx.done
  return claimed
}

/** The only path that removes an entry: the server confirmed it. */
export async function resolveSynced(
  clientSaleId: string,
  result: { saleId: string; confirmedTotal: string },
): Promise<void> {
  const db = await getOutboxDb()
  await db.delete('sales', clientSaleId)
  await recordHistory({ clientSaleId, ...result })
}

/** Recoverable failure — back to pending so the next drain retries it. */
export async function releaseForRetry(clientSaleId: string, error: string, status: number | null): Promise<void> {
  const db = await getOutboxDb()
  const entry = await db.get('sales', clientSaleId)
  if (!entry) return
  await db.put('sales', {
    ...entry,
    status: 'pending',
    lastError: error,
    lastStatus: status,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Unrecoverable failure. The server actively rejected this sale (a 4xx that is
 * not a conflict or timeout), so retrying forever would just spin. Needs a
 * human — never dropped.
 */
export async function markDead(clientSaleId: string, error: string, status: number | null): Promise<void> {
  const db = await getOutboxDb()
  const entry = await db.get('sales', clientSaleId)
  if (!entry) return
  await db.put('sales', {
    ...entry,
    status: 'dead',
    lastError: error,
    lastStatus: status,
    updatedAt: new Date().toISOString(),
  })
}

/** Operator action from the reconciliation screen: try a dead entry again. */
export async function reviveDead(clientSaleId: string): Promise<void> {
  const db = await getOutboxDb()
  const entry = await db.get('sales', clientSaleId)
  if (!entry || entry.status !== 'dead') return
  await db.put('sales', { ...entry, status: 'pending', updatedAt: new Date().toISOString() })
}

/**
 * Operator action: discard a dead entry. Requires an explicit reason so the
 * decision is auditable — abandoning a recorded sale should leave a trace.
 */
export async function discardDead(clientSaleId: string, reason: string): Promise<void> {
  const db = await getOutboxDb()
  const entry = await db.get('sales', clientSaleId)
  if (!entry || entry.status !== 'dead') return
  await db.delete('sales', clientSaleId)
  await recordHistory({
    clientSaleId,
    saleId: null,
    confirmedTotal: null,
    discardedReason: reason,
    estimatedTotal: entry.estimatedTotal,
  })
}

/* -------------------------------------------------------------------------- */
/* Sync history — kept so the reconciliation screen can show what happened     */
/* after an entry left the queue, including any total divergence.              */
/* -------------------------------------------------------------------------- */

export interface SyncHistoryEntry {
  clientSaleId: string
  saleId: string | null
  confirmedTotal: string | null
  estimatedTotal?: string
  discardedReason?: string
  at: string
}

const HISTORY_KEY = 'couture-offline-history'
const HISTORY_LIMIT = 100

async function recordHistory(entry: Omit<SyncHistoryEntry, 'at'>): Promise<void> {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list: SyncHistoryEntry[] = raw ? JSON.parse(raw) : []
    list.unshift({ ...entry, at: new Date().toISOString() })
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)))
  } catch {
    // History is diagnostic only. Losing it must never break a sync.
  }
}

export function readHistory(): SyncHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as SyncHistoryEntry[]) : []
  } catch {
    return []
  }
}
