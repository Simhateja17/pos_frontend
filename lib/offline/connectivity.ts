/**
 * OFFLINE-01 — connectivity detection.
 *
 * `navigator.onLine` is necessary but nowhere near sufficient: it reports link
 * state, not reachability. A till on shop Wi-Fi whose uplink is down reports
 * `true` and every request still fails. So link state is treated as a hint, and
 * a real reachability probe is the authority.
 */
'use client'

import { useEffect, useState } from 'react'

const POLL_INTERVAL_MS = 15_000
const PROBE_TIMEOUT_MS = 4_000

/**
 * GET /health lives at the API root, not under /api (see backend/src/server.ts:
 * app.get('/health', ...) is registered before app.use('/api', routes)). This
 * derives the root from NEXT_PUBLIC_API_URL — the same variable
 * lib/api/client.ts uses — by stripping a trailing /api rather than
 * introducing a second env var that would need to be kept in sync with it.
 */
function healthUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
  return `${apiUrl.replace(/\/api\/?$/, '')}/health`
}

/** Single reachability probe. Never throws. */
export async function probeReachable(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const res = await fetch(healthUrl(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Live connectivity for UI. Starts optimistic so a healthy till does not flash
 * an offline banner on first paint, then corrects within one probe.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const ok = await probeReachable()
      if (cancelled) return
      setIsOnline(ok)
      setCheckedAt(new Date())
    }

    void check()
    const timer = window.setInterval(check, POLL_INTERVAL_MS)

    // Browser events are hints that something changed — re-probe immediately
    // rather than trusting them outright.
    const onOnline = () => void check()
    const onOffline = () => setIsOnline(false)
    const onFocus = () => void check()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return { isOnline, checkedAt }
}
