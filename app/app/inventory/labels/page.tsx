'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Card, CardHead, CardPad, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { BarcodeLabel } from '@/components/barcode-label'
import { money } from '@/lib/region'

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
  const attrs = [row.variant.size, row.variant.color, row.variant.material].filter(Boolean).join(' / ')
  return attrs ? `${row.productName} - ${attrs}` : row.productName
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
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.has(row.variant.id)), [rows, selectedIds])

  return (
    <>
      <PageHead
        title="Print labels"
        sub="Select variants to generate thermal barcode labels"
        actions={
          <button className="btn btn-pri" disabled={selectedRows.length === 0} onClick={() => handlePrint()}>
            <Printer size={15} /> Print labels
          </button>
        }
      />

      <Card>
        <CardHead title="Variants" sub={rows.length > 0 ? `${rows.length} variants` : undefined} />

        {isLoading && <LoadingState label="Loading variants" />}
        {!isLoading && loadError && <ErrorState message={loadError} onRetry={() => void loadVariants()} />}
        {!isLoading && !loadError && rows.length === 0 && (
          <EmptyState title="No variants yet" body="Add a product with at least one variant to print labels for it." />
        )}
        {!isLoading && !loadError && rows.length > 0 && (
          <CardPad style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            {rows.map((row) => (
              <label
                key={row.variant.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 44,
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.variant.id)}
                  onChange={() => toggleSelected(row.variant.id)}
                  style={{ width: 18, height: 18 }}
                />
                <span>{variantDisplayName(row)}</span>
                <span className="t-sub">{row.variant.sku}</span>
              </label>
            ))}
          </CardPad>
        )}
      </Card>

      <Card>
        <CardHead title="Label preview" />
        <CardPad>
          {selectedRows.length === 0 ? (
            <p className="t-sub">Select one or more variants to generate labels.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {selectedRows.map((row) => (
                <div key={row.variant.id} style={{ transform: 'scale(2)', transformOrigin: 'top left', margin: '0 4in 1in 0' }}>
                  <BarcodeLabel sku={row.variant.sku} name={variantDisplayName(row)} price={money(row.variant.price)} />
                </div>
              ))}
            </div>
          )}
        </CardPad>
      </Card>

      {/* Actual printable content — natural (1x) scale, hidden on screen via sr-only,
          made visible in @media print via globals.css's .label-sheet rules. Kept in
          the DOM at all times so contentRef always has content to print. */}
      <div ref={contentRef} className="label-sheet sr-only">
        {selectedRows.map((row) => (
          <BarcodeLabel key={row.variant.id} sku={row.variant.sku} name={variantDisplayName(row)} price={money(row.variant.price)} />
        ))}
      </div>
    </>
  )
}
