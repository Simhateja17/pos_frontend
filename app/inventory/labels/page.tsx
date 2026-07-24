'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarcodeLabel } from '@/components/barcode-label'

type Variant = {
  id: string
  productId: string
  sku: string
  size: string | null
  color: string | null
  material: string | null
  price: string
  reorderThreshold: number
  identityLocked: boolean
  currentStock: number
  createdAt: string
}

type Product = {
  id: string
  name: string
  category: string | null
  createdAt: string
  variants: Variant[]
}

type VariantRow = {
  variant: Variant
  productName: string
}

const LOAD_ERROR = "Couldn't load your catalog. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function variantDisplayName(row: VariantRow) {
  const attrs = [row.variant.size, row.variant.color, row.variant.material]
    .filter(Boolean)
    .join(' / ')
  return attrs ? `${row.productName} - ${attrs}` : row.productName
}

function formatPrice(price: string) {
  const numeric = Number(price)
  return Number.isFinite(numeric) ? `$${numeric.toFixed(2)}` : price
}

export default function LabelsPage() {
  return (
    <Suspense fallback={null}>
      <LabelsPageContent />
    </Suspense>
  )
}

function LabelsPageContent() {
  const searchParams = useSearchParams()
  const preselectVariantId = searchParams.get('variantId')

  const [rows, setRows] = useState<VariantRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const contentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef })

  const loadVariants = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/products', { headers })

    setIsLoading(false)

    if (error || !data) {
      setLoadError(LOAD_ERROR)
      return
    }

    const products = data as Product[]
    const flat: VariantRow[] = products.flatMap((product) =>
      product.variants.map((variant) => ({ variant, productName: product.name })),
    )
    setRows(flat)
  }, [])

  useEffect(() => {
    loadVariants()
  }, [loadVariants])

  useEffect(() => {
    if (preselectVariantId) {
      setSelectedIds(new Set([preselectVariantId]))
    }
  }, [preselectVariantId])

  function toggleSelected(variantId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.variant.id)),
    [rows, selectedIds],
  )

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}
        >
          Print labels
        </h1>
        <Button
          type="button"
          disabled={selectedRows.length === 0}
          onClick={() => handlePrint()}
          style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
        >
          Print labels
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
          <Button
            type="button"
            onClick={loadVariants}
            className="mt-2"
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!loadError && isLoading && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          Loading variants…
        </p>
      )}

      {!loadError && !isLoading && (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <label
              key={row.variant.id}
              className="flex min-h-11 items-center gap-3 rounded-md border p-2"
              style={{ borderColor: '#E2E8F0' }}
            >
              <Checkbox
                checked={selectedIds.has(row.variant.id)}
                onCheckedChange={() => toggleSelected(row.variant.id)}
                className="size-6"
              />
              <span>{variantDisplayName(row)}</span>
              <span className="text-sm" style={{ color: '#64748B' }}>
                {row.variant.sku}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}
          className="mb-4"
        >
          Label preview
        </h2>

        {selectedRows.length === 0 ? (
          <p className="text-sm" style={{ color: '#64748B' }}>
            Select one or more variants to generate labels.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {selectedRows.map((row) => (
              <div
                key={row.variant.id}
                style={{ transform: 'scale(2)', transformOrigin: 'top left', margin: '0 4in 1in 0' }}
              >
                <BarcodeLabel
                  sku={row.variant.sku}
                  name={variantDisplayName(row)}
                  price={formatPrice(row.variant.price)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actual printable content — natural (1x) scale, hidden on screen via sr-only,
          made visible in @media print via globals.css's .label-sheet rules. Kept in
          the DOM at all times so contentRef always has content to print. */}
      <div ref={contentRef} className="label-sheet sr-only">
        {selectedRows.map((row) => (
          <BarcodeLabel
            key={row.variant.id}
            sku={row.variant.sku}
            name={variantDisplayName(row)}
            price={formatPrice(row.variant.price)}
          />
        ))}
      </div>
    </div>
  )
}
