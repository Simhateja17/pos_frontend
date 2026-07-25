'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

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

  useEffect(() => { void load() }, [load])

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-8">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0058ba]">Stock & catalog</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-[#0f1729]">Inventory</h1>
          <p className="mt-2 text-sm text-slate-500">Review current stock and continue to the live catalog, labels, and movement workflows.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/inventory/labels">Print labels</Link></Button>
          <Button asChild className="bg-[#0058ba] hover:bg-[#064b9f]"><Link href="/inventory/catalog">Add product</Link></Button>
        </div>
      </header>

      {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription><Button type="button" variant="outline" onClick={() => void load()} className="mt-3">Retry loading inventory</Button></Alert>}
      {loading && <div className="grid gap-4 md:grid-cols-2"><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /></div>}
      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div><h2 className="font-heading text-xl font-bold">Low-stock exceptions</h2><p className="mt-1 text-sm text-slate-500">Server-calculated variants at or below their reorder threshold.</p></div>
            <Button asChild variant="outline"><Link href="/inventory/catalog">Open catalog</Link></Button>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-8 text-center"><h3 className="font-heading text-lg font-bold">All stock levels are healthy</h3><p className="mt-2 text-sm text-slate-500">Your catalog has no current low-stock exceptions.</p></div>
          ) : (
            <div className="divide-y">
              {lowStock.map((item) => <div key={item.variantId} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div><strong className="block">{item.productName}</strong><span className="text-sm text-slate-500">{item.sku}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</span></div><span className="text-sm text-slate-500">Reorder at {item.reorderThreshold}</span><strong className="text-amber-700">{item.quantity} in stock</strong></div>)}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
