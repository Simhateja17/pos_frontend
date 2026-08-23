'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Boxes, FileText, LayoutDashboard, ReceiptText, ShoppingBag } from 'lucide-react'
import { Card, CardHead, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { getAuthenticatedStores, type Store } from '@/lib/api/authenticated-client'
import { setActiveStoreId } from '@/lib/store-context'

export function StoreWorkspace({ storeId }: { storeId: string }) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getAuthenticatedStores()
      const selected = payload.stores.find((item) => item.id === storeId)
      if (!selected) throw new Error('This store is not available to your account.')
      setActiveStoreId(selected.id)
      setStore(selected)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This store could not be opened.')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <LoadingState label="Opening store" />
  if (error || !store) return <ErrorState message={error ?? 'Store unavailable'} onRetry={() => void load()} />

  const destination = [store.addressLine1, store.city, store.state].filter(Boolean).join(', ')
  const destinations = [
    { href: '/app/dashboard', label: 'Dashboard', detail: 'Sales and performance for this shop', icon: LayoutDashboard },
    { href: '/app/orders', label: 'Sales history', detail: 'Completed bills from this shop', icon: ReceiptText },
    { href: '/app/documents', label: 'Tax documents', detail: 'Tax Invoices and credit notes issued here', icon: FileText },
    { href: '/app/inventory', label: 'Inventory history', detail: 'Stock records held at this shop', icon: Boxes },
    ...(store.isActive
      ? [{ href: '/app/billing', label: 'Checkout', detail: 'Ring sales with this shop price and tax', icon: ShoppingBag }]
      : []),
  ]

  return (
    <>
      <PageHead
        title={store.name}
        sub={destination || 'No address on file'}
        actions={<Link href="/app/stores" className="btn"><ArrowLeft size={15} /> All stores</Link>}
      />
      <Card>
        <CardHead
          title={store.isActive ? 'Operate this shop' : 'Read closed-store history'}
          sub={store.isActive
            ? 'The active store now applies to every operational request in this tab.'
            : 'Historical records stay readable. New sales and other writes remain blocked until the store is reactivated.'}
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
