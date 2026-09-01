'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, LogOut, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { AuthenticatedRequestError, getAuthenticatedAppContext, type AppContext } from '@/lib/api/authenticated-client'
import { NAV_GROUPS, NAMES, navIdForPath } from './navigation'
import { UsErrorState, UsLoadingState } from './states'
import './us-app.css'

type UsAppContextValue = {
  context: AppContext | null
  loading: boolean
  error: string | null
  reload: () => void
}

const UsAppContext = createContext<UsAppContextValue | null>(null)

export function useUsAppContext(): UsAppContextValue {
  const context = useContext(UsAppContext)
  if (!context) throw new Error('useUsAppContext must be used inside UsAppShell')
  return context
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'US'
}

function routeForContextError(error: unknown, router: ReturnType<typeof useRouter>) {
  if (!(error instanceof AuthenticatedRequestError)) return false
  if (error.kind === 'unauthenticated') {
    router.replace(`/us/auth?returnTo=${encodeURIComponent(window.location.pathname)}`)
    return true
  }
  if (error.kind === 'register_locked') {
    router.replace(`/terminal/pin?returnTo=${encodeURIComponent(window.location.pathname)}`)
    return true
  }
  return false
}

export function UsAppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [context, setContext] = useState<AppContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void getAuthenticatedAppContext()
      .then((nextContext) => {
        if (!cancelled) setContext(nextContext)
      })
      .catch((nextError: unknown) => {
        if (cancelled || routeForContextError(nextError, router)) return
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Store context is unavailable right now.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [reloadKey, router])

  const value = useMemo(() => ({ context, loading, error, reload: () => setReloadKey((key) => key + 1) }), [context, loading, error])
  const activeId = navIdForPath(pathname)
  const pageName = NAMES[activeId]
  const staffName = context?.staff.name || 'Signed-in staff'
  const storeName = context?.store?.name || 'Business scope'
  const locality = context?.store?.locality || context?.tenant.locality || 'International workspace'

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' })
    router.replace('/us/auth')
  }

  return (
    <UsAppContext.Provider value={value}>
      <div className="us-app-scope">
        <div className="bg-canvas"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>
        <div className="us-app">
          <aside className="sidebar">
            <Link className="brand" href="/us/dashboard" aria-label="Ambel POS dashboard">
              <div className="brand-mark">AP</div>
              <div className="brand-text"><strong>Ambel POS</strong><span>International retail</span></div>
            </Link>
            <nav aria-label="International POS navigation">
              {NAV_GROUPS.map((group) => (
                <div className="nav-group" key={group.label}>
                  <div className="nav-group-label">{group.label}</div>
                  {group.items.map(({ id, href, icon: Icon }) => (
                    <Link className={`nav-item${activeId === id ? ' active' : ''}`} href={href} key={id} aria-current={activeId === id ? 'page' : undefined}>
                      <Icon aria-hidden="true" /><span>{NAMES[id]}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-footer">
              <div className="status-pod"><div className="status-led" /><div><b>API-backed workspace</b><small>Numbers on this surface come from the selected tenant.</small></div></div>
            </div>
          </aside>

          <main className="main">
            <header className="topbar">
              <div className="crumb"><span>Ambel POS</span><ChevronRight size={12} /><b>{pageName}</b></div>
              <div className="search"><Search className="search-icon" aria-hidden="true" /><input className="search-input" aria-label="Search workspace" placeholder="Search products, customers, orders…" /><kbd>⌘K</kbd></div>
              <div className="topbar-right">
                <div className="store-context"><b>{storeName}</b><span>{locality}</span></div>
                <div className="user-block"><div className="avatar">{initials(staffName)}</div><div className="user-meta"><b>{staffName}</b><span>{context?.staff.role || 'authenticated'}</span></div></div>
                <button className="logout" type="button" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={14} /></button>
              </div>
            </header>
            <div className="content">
              {loading && !context ? <UsLoadingState label="Loading store context" rows={6} /> : null}
              {error && !context ? <UsErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /> : null}
              {context ? children : null}
            </div>
          </main>
        </div>
      </div>
    </UsAppContext.Provider>
  )
}
