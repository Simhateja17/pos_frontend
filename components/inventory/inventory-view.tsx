'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Barcode, Boxes, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { Card, CardHead, DataTable, KpiRow, PageHead, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, KpiSkeleton, LoadingState, UnavailableValue } from '@/components/couture/states'
import { ReorderSuggestions } from './reorder-suggestions'

type LowStockVariant = {
  variantId: string
  productId: string
  productName: string
  sku: string
  size: string | null
  color: string | null
  material: string | null
  quantity: number
  reorderThreshold: number
}

const LOAD_ERROR = "We couldn't load your current stock. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined
}

export function InventoryView() {
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.GET('/stock-movements/low-stock', { headers: await authHeader() })
    setLoading(false)
    if (requestError || !data) {
      setError(LOAD_ERROR)
      return
    }
    setLowStock(data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const critical = lowStock.filter((item) => item.quantity === 0).length

  const metrics: KpiItem[] = [
    { label: 'Low Stock', value: loading ? '—' : String(lowStock.length), meta: 'At or below reorder threshold' },
    { label: 'Out of Stock', value: loading ? '—' : String(critical), meta: critical > 0 ? 'Needs immediate reorder' : 'None currently' },
    { label: 'Total SKUs', value: <UnavailableValue />, meta: 'No catalog aggregate endpoint' },
    { label: 'Inventory Value', value: <UnavailableValue />, meta: 'Cost basis is not persisted' },
  ]

  return (
    <>
      <PageHead
        title="Inventory"
        sub="Stock levels, variants and reorder exceptions"
        actions={
          <>
            <Link className="btn" href="/inventory/labels">
              <Barcode size={15} /> Print labels
            </Link>
            <Link className="btn btn-pri" href="/inventory/catalog">
              <Plus size={15} /> Add product
            </Link>
          </>
        }
      />

      {loading ? <KpiSkeleton cols={4} /> : <KpiRow items={metrics} cols={4} />}

      <ReorderSuggestions />

      <Card>
        <CardHead
          title="Low-stock exceptions"
          sub="Server-calculated variants at or below their reorder threshold"
          right={
            <Link className="btn btn-sm" href="/inventory/catalog">
              Open catalog
            </Link>
          }
        />

        {loading && <LoadingState label="Loading inventory" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && lowStock.length === 0 && (
          <EmptyState
            icon={<Boxes size={24} strokeWidth={1.8} />}
            title="All stock levels are healthy"
            body="No variant is at or below its reorder threshold right now."
            action={
              <Link className="btn btn-pri" href="/inventory/catalog">
                Open catalog
              </Link>
            }
          />
        )}

        {!loading && !error && lowStock.length > 0 && (
          <DataTable
            cols={['SKU', 'Product', 'Variant', { label: 'Available', align: 'right' }, { label: 'Reorder at', align: 'right' }, 'Status']}
            minWidth={760}
          >
            {lowStock.map((item) => {
              const out = item.quantity === 0
              return (
                <tr key={item.variantId}>
                  <td className="t-mono t-strong">{item.sku}</td>
                  <td>{item.productName}</td>
                  <td className="t-sub">
                    {[item.size, item.color, item.material].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="num t-strong" style={{ textAlign: 'right' }}>
                    {item.quantity}
                  </td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--muted)' }}>
                    {item.reorderThreshold}
                  </td>
                  <td>
                    <span className={`badge ${out ? 'b-red' : 'b-amber'}`}>{out ? 'Out of stock' : 'Low stock'}</span>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </Card>
    </>
  )
}
