'use client'

import { useEffect, useRef } from 'react'

/**
 * Calls `onIdle` after `timeoutMs` of no user activity (mouse/touch/key events).
 * Used by the PIN pad page (D-11's auto-timeout requirement) to re-lock a shared
 * terminal to the staff picker after a period of inactivity — a reasonable default
 * of 5 minutes is used where the caller doesn't override it (CONTEXT.md leaves the
 * exact duration to implementation discretion).
 */
export function useIdleTimer(onIdle: () => void, timeoutMs: number = 5 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onIdle, timeoutMs)
    }
    const events = ['mousedown', 'keydown', 'touchstart', 'pointerdown'] as const
    events.forEach((e) => window.addEventListener(e, reset))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onIdle, timeoutMs])
}
