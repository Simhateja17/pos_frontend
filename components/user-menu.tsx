'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { AppContext } from '@/lib/api/authenticated-client'
import styles from './user-menu.module.css'

function initials(name?: string | null) {
  if (!name?.trim()) return '—'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}

export function UserMenu({
  context,
  isContextLoading,
  hasError,
  allowOrganizationSignOut = true,
  className,
}: {
  context: AppContext | null
  isContextLoading: boolean
  hasError: boolean
  allowOrganizationSignOut?: boolean
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function signOut() {
    setSigningOut(true)
    try {
      await apiClient.POST('/terminal/pin/logout', { headers: await authHeaders() })
    } catch {
      // Signing out the organisation session below is still the safe fallback
      // if the cashier-session request cannot reach the server.
    }
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('operatorToken')
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function lockRegister() {
    setOpen(false)
    if (typeof window !== 'undefined') window.sessionStorage.setItem('registerLocked', 'true')
    try {
      await apiClient.POST('/terminal/pin/lock', { headers: await authHeaders() })
    } catch {
      // The local token is still removed, so the next screen cannot continue
      // acting as the previous cashier.
    }
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('operatorToken')
    // Replace the app entry so browser Back cannot simply restore the unlocked
    // register page. The AppShell also re-checks the paired-device guard on
    // every pathname change as a defence in depth.
    router.replace('/terminal/pin')
  }

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`tb-user ${styles.trigger}`}
        aria-live="polite"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="tb-ava">{initials(context?.staff.name)}</div>
        <div>
          <div className="nm">{isContextLoading ? 'Loading staff…' : (context?.staff.name ?? 'Staff unavailable')}</div>
          <div className="rl">{context?.staff.role ?? (hasError ? 'Retry to load access' : 'Loading access…')}</div>
        </div>
      </button>

      {open && (
        <div className={styles.panel} role="menu" aria-label="Account menu">
          <button type="button" className={styles.item} role="menuitem" onClick={() => void lockRegister()}>
            <LockKeyhole size={15} strokeWidth={1.85} /> Lock register
          </button>
          {allowOrganizationSignOut && (
            <button type="button" className={styles.item} role="menuitem" onClick={() => void signOut()} disabled={signingOut}>
              <LogOut size={15} strokeWidth={1.85} /> {signingOut ? 'Signing out…' : 'Sign out organisation'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
