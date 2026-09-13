'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Boxes, FileText, LayoutDashboard, ReceiptText, ShoppingBag } from 'lucide-react'
import { Card, CardHead, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { getAuthenticatedStores, type Store } from '@/lib/api/authenticated-client'
import { setActiveStoreId } from '@/lib/store-context'
import { useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

export function StoreWorkspace({ storeId }: { storeId: string }) {
  const t = useT()
  const { appPath } = useAppRegion()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getAuthenticatedStores()
      const selected = payload.stores.find((item) => item.id === storeId)
      if (!selected) throw new Error(t('records.errors.workspaceUnavailable'))
      setActiveStoreId(selected.id)
      setStore(selected)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('records.errors.storeUpdate'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <LoadingState label={t('records.workspace.openWorkspace')} />
  if (error || !store) return <ErrorState message={error ?? t('records.stores.unavailable')} onRetry={() => void load()} />

  const destination = [store.addressLine1, store.city, store.state].filter(Boolean).join(', ')
  const destinations = [
    { href: appPath('/app/dashboard'), label: t('nav.items.dashboard'), detail: t('records.workspace.dashboardDetail'), icon: LayoutDashboard },
    { href: appPath('/app/orders'), label: t('records.workspace.salesHistory'), detail: t('records.workspace.salesDetail'), icon: ReceiptText },
    { href: appPath('/app/documents'), label: t('records.workspace.taxDocuments'), detail: t('records.workspace.documentsDetail'), icon: FileText },
    { href: appPath('/app/inventory'), label: t('records.workspace.inventoryHistory'), detail: t('records.workspace.inventoryDetail'), icon: Boxes },
    ...(store.isActive
      ? [{ href: appPath('/app/billing'), label: t('records.workspace.checkout'), detail: t('records.workspace.checkoutDetail'), icon: ShoppingBag }]
      : []),
  ]

  return (
    <>
      <PageHead
        title={store.name}
        sub={destination || t('records.workspace.noAddress')}
        actions={<Link href={appPath('/app/stores')} className="btn"><ArrowLeft size={15} /> {t('records.workspace.allStores')}</Link>}
      />
      <Card>
        <CardHead
          title={store.isActive ? t('records.workspace.operate') : t('records.workspace.closedHistory')}
          sub={store.isActive
            ? t('records.workspace.activeScope')
            : t('records.workspace.closedScope')}
        />
        <div style={{ display: 'grid', gap: 12, padding: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {destinations.map(({ href, label, detail, icon: Icon }) => (
            <Link key={href} href={href} className="btn" style={{ minHeight: 84, justifyContent: 'flex-start', textAlign: 'left' }}>
              <Icon size={20} />
              <span><b style={{ display: 'block' }}>{label}</b><span style={{ color: 'var(--muted)', fontSize: 12 }}>{detail}</span></span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
