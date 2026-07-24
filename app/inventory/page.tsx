'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

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

const LOAD_ERROR = "Couldn't load your catalog. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export default function InventoryLandingPage() {
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/stock-movements/low-stock', { headers })
    setIsLoading(false)
    if (error || !data) {
      setLoadError(LOAD_ERROR)
      return
    }
    setLowStock(data)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1
        style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}
        className="mb-6"
      >
        Inventory
      </h1>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
          <Button type="button" onClick={load} className="mt-2" style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}>
            Retry
          </Button>
        </Alert>
      )}

      {!loadError && !isLoading && (
        <Link href="/inventory/catalog" className="mb-6 block no-underline">
          {lowStock.length > 0 ? (
            <div className="rounded-md p-4" style={{ backgroundColor: '#FEF3E0', color: '#b8770c' }}>
              {lowStock.length} item{lowStock.length === 1 ? '' : 's'} low on stock
            </div>
          ) : (
            <div className="rounded-md p-4 text-sm" style={{ color: '#64748B' }}>
              All stock levels healthy
            </div>
          )}
        </Link>
      )}

      {!loadError && isLoading && (
        <p className="mb-6 text-sm" style={{ color: '#64748B' }}>
          Loading…
        </p>
      )}

      <div className="flex gap-4">
        <Link href="/inventory/catalog">
          <Button type="button" style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}>
            View catalog
          </Button>
        </Link>
        <Link href="/inventory/labels">
          <Button type="button" variant="outline">
            Print labels
          </Button>
        </Link>
      </div>
    </div>
  )
}
