'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { APP_NAVIGATION } from '@/components/app-navigation'
import {
  AuthenticatedRequestError,
  getAuthenticatedAppContext,
  type AppContext,
} from '@/lib/api/authenticated-client'
import styles from '@/components/app-shell.module.css'

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/app/dashboard' && pathname.startsWith(`${href}/`))
}

function initials(name?: string | null) {
  if (!name?.trim()) return '—'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [context, setContext] = useState<AppContext | null>(null)
  const [contextError, setContextError] = useState<AuthenticatedRequestError | null>(null)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const drawerRef = useRef<HTMLElement>(null)

  const loadContext = useCallback(async () => {
    setContext(null)
    setContextError(null)
    setIsContextLoading(true)

    try {
      setContext(await getAuthenticatedAppContext())
    } catch (error) {
      setContextError(
        error instanceof AuthenticatedRequestError
          ? error
          : new AuthenticatedRequestError('unavailable', 'Store context is unavailable right now. Please retry.'),
      )
    } finally {
      setIsContextLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/app') void loadContext()
  }, [loadContext, pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const drawer = drawerRef.current
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable?.[0]
    const last = focusable?.[focusable.length - 1]
    first?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab' || !first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  if (pathname === '/app') return children

  const current =
    APP_NAVIGATION.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))?.label ??
    'Couture POS'

  const storeFull = context
    ? [context.tenant.businessName, context.tenant.locality].filter(Boolean).join(' · ')
    : isContextLoading
      ? 'Loading store…'
      : 'Store unavailable'

  /**
   * The pill mirrors the design's compact "Mumbai · Bandra" store chip, so it
   * prefers locality. businessName is tenant free-text and is often a full
   * sentence — it stays in the title/tooltip rather than the chip.
   */
  const storeLabel = context?.tenant.locality?.trim() || context?.tenant.businessName || storeFull

  return (
    <div className="app">
      {mobileOpen && (
        <button className={styles.scrim} aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        ref={drawerRef}
        aria-label="India application navigation"
        aria-modal={mobileOpen ? true : undefined}
        role={mobileOpen ? 'dialog' : undefined}
        className={`sidebar ${styles.sidebar} ${mobileOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        <div className="sb-brand">
          <div className="sb-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7.4" height="7.4" rx="2.4" />
              <rect x="13.6" y="3" width="7.4" height="7.4" rx="2.4" />
              <rect x="3" y="13.6" width="7.4" height="7.4" rx="2.4" />
              <rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2.4" />
            </svg>
          </div>
          <div>
            <h1>Couture POS</h1>
            <p>Retail operations suite</p>
          </div>
          <button className={styles.closeDrawer} aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sb-nav">
          {APP_NAVIGATION.map((group) => (
            <div key={group.label}>
              <div className="sb-group">{group.label}</div>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`nav-item ${active ? 'active' : ''}`}
                  >
                    <Icon strokeWidth={1.85} />
                    <span>{item.label}</span>
                    {item.badge ? <span className={`ni-badge ${item.badge}`}>{item.badge}</span> : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sb-foot">
          <div className="sys-pill">
            <b>
              <span className="dot" style={contextError ? { background: 'var(--danger)', boxShadow: '0 0 0 3px var(--danger-soft)' } : undefined} />
              {isContextLoading ? 'Connecting…' : contextError ? 'Store context unavailable' : 'Store context connected'}
            </b>
            <p>{contextError ? 'Retry from the notice above' : storeFull}</p>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className={`topbar ${styles.topbar}`}>
          <button className={styles.mobileMenu} aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          <div className={`crumb ${styles.crumb}`}>
            Couture POS / <b>{current}</b>
          </div>

          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              placeholder="Search orders, products, customers, suppliers…  or type a command"
              aria-label="Search"
            />
            <span className="kbd">⌘K</span>
          </div>

          <div className={`store-switch ${styles.storeSwitch}`}>
            <span className="store-pill active" title={storeFull}>
              {storeLabel}
            </span>
          </div>

          <Link className="tb-icon" href="/app/notifications" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9.2a6 6 0 0 1 12 0c0 4.8 2 6 2 6H4s2-1.2 2-6z" />
              <path d="M10.3 19a1.9 1.9 0 0 0 3.4 0" />
            </svg>
          </Link>

          <div className={`tb-user ${styles.user}`} aria-live="polite">
            <div className="tb-ava">{initials(context?.staff.name)}</div>
            <div>
              <div className="nm">{isContextLoading ? 'Loading staff…' : (context?.staff.name ?? 'Staff unavailable')}</div>
              <div className="rl">{context?.staff.role ?? (contextError ? 'Retry to load access' : 'Loading access…')}</div>
            </div>
          </div>
        </header>

        {contextError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 26px',
              borderBottom: '1px solid #F6D4D4',
              background: 'var(--danger-soft)',
              color: '#8f2323',
              fontSize: 13,
            }}
          >
            <span>{contextError.message}</span>
            <button className="btn btn-sm" onClick={() => void loadContext()}>
              Retry context
            </button>
          </div>
        )}

        <main className={`content ${styles.content}`}>{children}</main>
      </div>
    </div>
  )
}
