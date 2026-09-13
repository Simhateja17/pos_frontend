'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Store as StoreIcon } from 'lucide-react'
import { getAuthenticatedStores, type AppContext, type Store } from '@/lib/api/authenticated-client'
import { setActiveStoreId } from '@/lib/store-context'
import styles from '@/components/store-switcher.module.css'
import { useT } from '@/lib/i18n/i18n'

export function StoreSwitcher({ context }: { context: AppContext }) {
  const t = useT()
  const isOwner = context.staff.role === 'owner'
  const activeStoreId = context.store?.id ?? 'all'
  const label = context.store?.name ?? t('shell.allStores')
  const fullLabel = context.store
    ? [context.store.name, context.store.locality].filter(Boolean).join(' · ')
    : `${context.tenant.businessName} · ${t('shell.allStores')}`
  const [open, setOpen] = useState(false)
  const [stores, setStores] = useState<Store[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  // Fetch eagerly, not only on toggle: a one-store business must never see
  // "All stores" at all, and a stale `all` selection left over from before
  // the business dropped to one store has to self-correct even if the owner
  // never opens this menu. "All stores" vs. "the one store" is meaningless
  // to a single-shop owner but every business-scoped screen (Counters,
  // Settings, staff PIN setup — none of which offer a store picker of their
  // own) throws them into a dead end when it's active.
  //
  // Self-correct via setActiveStoreId ONLY — never a hard reload here. This
  // effect can legitimately observe a momentarily-stale `all` scope while
  // another in-flight transition (e.g. store-workspace.tsx opening a store
  // detail page) is already correcting it through the same soft mechanism
  // (dispatch -> AppShell's ACTIVE_STORE_CHANGED_EVENT listener refetches
  // context in place). A forced window.location.reload() here previously
  // collided with that in-flight transition and froze the app on a skeleton
  // mid-navigation (2026-09-05 incident).
  useEffect(() => {
    let cancelled = false
    async function loadStores() {
      try {
        const payload = await getAuthenticatedStores()
        if (cancelled) return
        setStores(payload.stores)
        if (payload.stores.length === 1 && activeStoreId !== payload.stores[0].id) {
          setActiveStoreId(payload.stores[0].id)
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t('shell.storeSwitcher.loadError'))
      }
    }
    void loadStores()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const singleStore = stores?.length === 1 ? stores[0] : null

  function toggle() {
    setOpen((prev) => !prev)
  }

  function selectStore(storeId: string) {
    if (storeId === activeStoreId) {
      setOpen(false)
      return
    }

    setActiveStoreId(storeId)
    // Operational views fetch on mount. A full reload guarantees that every
    // chart, table, and action now uses the newly selected store scope.
    window.location.reload()
  }

  if (!isOwner) {
    return <span className="store-pill active" title={fullLabel}>{label}</span>
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`store-pill active ${styles.trigger}`}
        title={fullLabel}
        aria-label={t('shell.storeSwitcher.currentStore', { store: label })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className={styles.triggerLabel}>{label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div className={styles.menu} role="menu" aria-label={t('shell.storeSwitcher.switchStore')}>
          <div className={styles.heading}>{t('shell.storeSwitcher.switchStore')}</div>
          {!singleStore ? (
            <>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={activeStoreId === 'all'}
                className={styles.option}
                onClick={() => selectStore('all')}
              >
                <span className={styles.optionIcon}><StoreIcon size={16} /></span>
                <span className={styles.optionText}>
                  <strong>{t('shell.allStores')}</strong>
                  <small>{t('shell.storeSwitcher.combinedView')}</small>
                </span>
                {activeStoreId === 'all' ? <Check size={16} className={styles.check} /> : null}
              </button>

              <div className={styles.divider} />
            </>
          ) : null}
          {stores === null && !error ? <div className={styles.status}>{t('shell.storeSwitcher.loadingStores')}</div> : null}
          {error ? <div className={styles.error}>{error}</div> : null}
          {stores?.map((store) => (
            <button
              key={store.id}
              type="button"
              role="menuitemradio"
              aria-checked={activeStoreId === store.id}
              className={styles.option}
              onClick={() => selectStore(store.id)}
            >
              <span className={styles.optionIcon}><StoreIcon size={16} /></span>
              <span className={styles.optionText}>
                <strong>{store.name}</strong>
                <small>
                  {store.isActive
                    ? ([store.city, store.state].filter(Boolean).join(' · ') || t('shell.storeSwitcher.store'))
                    : t('shell.storeSwitcher.closedHistory')}
                </small>
              </span>
              {activeStoreId === store.id ? <Check size={16} className={styles.check} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
