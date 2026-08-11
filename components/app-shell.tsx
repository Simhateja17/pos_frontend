'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AmbelMark } from '@/components/brand/ambel-mark'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { UserMenu } from '@/components/user-menu'
import {
  APP_NAVIGATION,
  cashierCanAccessAppPath,
  navigationForRole,
  roleCanAccessAppPath,
  type AppNavItem,
} from '@/components/app-navigation'
import { supabase } from '@/lib/supabase/client'
import {
  AuthenticatedRequestError,
  getAuthenticatedAppContext,
  getAuthenticatedBillingStatus,
  type AppContext,
} from '@/lib/api/authenticated-client'
import styles from '@/components/app-shell.module.css'
import { useIdleTimer } from '@/lib/hooks/useIdleTimer'
import { apiClient, REGISTER_LOCKED_EVENT } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { ACTIVE_STORE_CHANGED_EVENT } from '@/lib/store-context'

const ALL_NAV_ITEMS = APP_NAVIGATION.flatMap((group) => group.items)

/**
 * Nested nav routes (e.g. Inventory `/app/inventory` and Categories
 * `/app/inventory/categories`) both prefix-match a Categories pathname, so
 * picking "any prefix match" highlights both. Only the longest — i.e. most
 * specific — matching href should be marked active.
 */
function matchedNavHref(pathname: string, items: AppNavItem[] = ALL_NAV_ITEMS): string | undefined {
  let best: string | undefined
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.length) best = item.href
    }
  }
  return best
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [context, setContext] = useState<AppContext | null>(null)
  const [contextError, setContextError] = useState<AuthenticatedRequestError | null>(null)
  const [isContextLoading, setIsContextLoading] = useState(true)
  const [deviceGate, setDeviceGate] = useState<'checking' | 'ready' | 'redirecting'>('checking')
  const drawerRef = useRef<HTMLElement>(null)

  const loadContext = useCallback(async () => {
    setContext(null)
    setContextError(null)
    setIsContextLoading(true)

    try {
      setContext(await getAuthenticatedAppContext())
    } catch (error) {
      if (error instanceof AuthenticatedRequestError && error.kind === 'unauthenticated') {
        if (typeof window !== 'undefined') window.sessionStorage.removeItem('operatorToken')
        setDeviceGate('redirecting')
        router.replace('/login')
        return
      }
      setContextError(
        error instanceof AuthenticatedRequestError
          ? error
          : new AuthenticatedRequestError('unavailable', 'Store context is unavailable right now. Please retry.'),
      )
    } finally {
      setIsContextLoading(false)
    }
  }, [router])

  useEffect(() => {
    const returnToPin = () => {
      setDeviceGate('redirecting')
      router.replace('/terminal/pin')
    }
    window.addEventListener(REGISTER_LOCKED_EVENT, returnToPin)
    return () => window.removeEventListener(REGISTER_LOCKED_EVENT, returnToPin)
  }, [router])

  useEffect(() => {
    // AppShell stays mounted while Next changes routes. Include pathname here:
    // browser Back/Forward must re-check the lock, otherwise a locked register
    // can render the previous /app page without an operator token.
    let cancelled = false
    setDeviceGate('checking')

    void authHeaders()
      .then((headers) => {
        // Do this before asking the device endpoint anything. An anonymous
        // URL visit is a login concern, never a register setup concern.
        if (!headers) {
          if (!cancelled) {
            setDeviceGate('redirecting')
            router.replace('/login')
          }
          return null
        }
        return apiClient.GET('/terminals/device', { headers })
      })
      .then((result) => {
        if (cancelled || !result) return
        const paired = Boolean(result.data?.terminal)
        const hasOperator = Boolean(window.sessionStorage.getItem('operatorToken'))
        const registerLocked =
          Boolean(result.data?.isRegisterLocked) ||
          window.sessionStorage.getItem('registerLocked') === 'true'
        if ((paired || registerLocked) && !hasOperator) {
          setDeviceGate('redirecting')
          router.replace('/terminal/pin')
          return
        }
        setDeviceGate('ready')
      })
      .catch(() => {
        // Context below owns the visible network/session error. Do not guess
        // that an unreachable device endpoint means the register is unpaired.
        if (!cancelled) setDeviceGate('ready')
      })

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  useEffect(() => {
    if (deviceGate === 'ready') void loadContext()
  }, [deviceGate, loadContext])

  useEffect(() => {
    const reload = () => void loadContext()
    window.addEventListener(ACTIVE_STORE_CHANGED_EVENT, reload)
    return () => window.removeEventListener(ACTIVE_STORE_CHANGED_EVENT, reload)
  }, [loadContext])

  useEffect(() => {
    if (pathname === '/app' || deviceGate !== 'ready') return
    void getAuthenticatedBillingStatus()
      .then((status) => {
        if (!status.accessAllowed) router.replace('/plans')
      })
      .catch(() => {
        // Operational API calls remain server-gated. A transient status read
        // must not turn a recoverable network failure into a logout.
      })
  }, [deviceGate, pathname, router])

  useEffect(() => {
    if (context?.staff.role && !roleCanAccessAppPath(context.staff.role, pathname)) {
      router.replace(context.staff.role === 'cashier' ? '/app/billing' : '/app/dashboard')
    }
  }, [context?.staff.role, pathname, router])

  const reauthenticate = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const lockIdleRegister = useCallback(() => {
    if (typeof window === 'undefined' || !window.sessionStorage.getItem('operatorToken')) return
    window.sessionStorage.setItem('registerLocked', 'true')
    void authHeaders()
      .then((headers) => apiClient.POST('/terminal/pin/lock', { headers }))
      .catch(() => undefined)
      .finally(() => {
        window.sessionStorage.removeItem('operatorToken')
        router.replace('/terminal/pin')
      })
  }, [router])

  // Cashier sessions are idle-locked even when the cashier is inside Billing
  // or another app route; the lock screen itself is the only place where a
  // PIN can be entered again.
  useIdleTimer(lockIdleRegister)

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

  const cashierIsRedirecting =
    context?.staff.role === 'cashier' && !cashierCanAccessAppPath(pathname)
  const roleIsRedirecting = Boolean(
    context?.staff.role && !roleCanAccessAppPath(context.staff.role, pathname),
  )
  if (deviceGate !== 'ready' || isContextLoading || cashierIsRedirecting || roleIsRedirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        Opening register…
      </div>
    )
  }

  const navigation = navigationForRole(context?.staff.role)
  const visibleNavItems = navigation.flatMap((group) => group.items)
  const matchedHref = matchedNavHref(pathname, visibleNavItems)
  const current = visibleNavItems.find((item) => item.href === matchedHref)?.label ?? 'Ambel POS'
  const isCashier = context?.staff.role === 'cashier'

  const storeFull = context
    ? context.store
      ? [context.store.name, context.store.locality].filter(Boolean).join(' · ')
      : `${context.tenant.businessName} · All stores`
    : isContextLoading
      ? 'Loading store…'
      : 'Store unavailable'

  /**
   * The pill mirrors the design's compact "Mumbai · Bandra" store chip, so it
   * prefers locality. businessName is tenant free-text and is often a full
   * sentence — it stays in the title/tooltip rather than the chip.
   */
  const storeLabel = context?.store?.name || (context ? 'All stores' : storeFull)

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
            <AmbelMark size={38} />
          </div>
          <div>
            <h1>Ambel POS</h1>
            <p>Retail operations suite</p>
          </div>
          <button className={styles.closeDrawer} aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sb-nav">
          {navigation.map((group) => (
            <div key={group.label}>
              <div className="sb-group">{group.label}</div>
              {group.items.map((item) => {
                const active = item.href === matchedHref
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
      </aside>

      <div className="main">
        <header className={`topbar ${styles.topbar}`}>
          <button className={styles.mobileMenu} aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          <div className={`crumb ${styles.crumb}`}>
            Ambel POS / <b>{current}</b>
          </div>

          {!isCashier && (
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
          )}

          {/* Pinned to the right edge so the cluster does not shift with the breadcrumb width. */}
          <div className={styles.topbarActions}>
            <div className={`store-switch ${styles.storeSwitch}`}>
              <span className="store-pill active" title={storeFull}>
                {storeLabel}
              </span>
            </div>

            {!isCashier && <NotificationBell />}

            <UserMenu
              context={context}
              isContextLoading={isContextLoading}
              hasError={!!contextError}
              allowOrganizationSignOut={!isCashier}
              className={styles.user}
            />
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
            {contextError.kind === 'unauthenticated' ? (
              <button className="btn btn-sm" onClick={() => void reauthenticate()}>
                Sign in again
              </button>
            ) : (
              <button className="btn btn-sm" onClick={() => void loadContext()}>
                Retry context
              </button>
            )}
          </div>
        )}

        <main className={`content ${styles.content}`}>{children}</main>
      </div>
    </div>
  )
}
