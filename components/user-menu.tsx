'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
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
  className,
}: {
  context: AppContext | null
  isContextLoading: boolean
  hasError: boolean
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
    await supabase.auth.signOut()
    router.push('/login')
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
          <button type="button" className={styles.item} role="menuitem" onClick={() => void signOut()} disabled={signingOut}>
            <LogOut size={15} strokeWidth={1.85} /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
