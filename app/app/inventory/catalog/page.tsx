'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Card, CardHead, DataTable, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { LowStockBadge } from '@/components/low-stock-badge'
import { priceLabel, unitSuffix } from '@/lib/units'

type Variant = {
  id: string
  productId: string
  sku: string
  barcode: string | null
  unitOfMeasure: string
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

const LOAD_ERROR = "Couldn't load your catalog. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function variantAttributes(variant: Variant) {
  const attrs = [variant.size, variant.color, variant.material].filter(Boolean).join(' / ')
  if (attrs) return attrs
  // A grocery variant usually has no size/colour/material — its unit is what
  // distinguishes it (loose kg vs a pre-packed pack), so say that instead of "—".
  const suffix = unitSuffix(variant.unitOfMeasure)
  return suffix ? `Sold by ${suffix}` : 'Sold by piece'
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const { data, error } = await apiClient.GET('/products', { headers: await authHeader() })

    setIsLoading(false)

    if (error || !data) {
      setLoadError(LOAD_ERROR)
      return
    }

    setProducts(data as Product[])
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const term = search.trim().toLowerCase()
  const visible = term
    ? products
        .map((product) => ({
          ...product,
          variants: product.variants.filter(
            (v) =>
              v.barcode === term ||
              v.sku.toLowerCase().includes(term) ||
              product.name.toLowerCase().includes(term),
          ),
        }))
        .filter((product) => product.variants.length > 0)
    : products

  return (
    <>
      <PageHead
        title="Products"
        sub="Catalog, variants and pricing"
        actions={
          <>
            <Link className="btn" href="/app/import">
              <Upload size={15} /> Import file
            </Link>
            <Link className="btn btn-pri" href="/app/inventory/catalog/new">
              <Plus size={15} /> Add product
            </Link>
          </>
        }
      />

      <Card>
        <CardHead
          title="Catalog"
          sub={products.length > 0 ? `${products.length} products` : undefined}
          right={
            products.length > 0 ? (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Scan a barcode, or search name / SKU"
                ariaLabel="Search catalog"
                width={280}
              />
            ) : undefined
          }
        />

        {isLoading && <LoadingState label="Loading catalog" />}
        {!isLoading && loadError && <ErrorState message={loadError} onRetry={() => void loadProducts()} />}
        {!isLoading && !loadError && products.length === 0 && (
          <EmptyState
            icon={<Package size={24} strokeWidth={1.8} />}
            title="No products yet"
            body="Add your first product, or import a supplier price list to load many at once."
            action={
              <Link className="btn btn-pri" href="/app/inventory/catalog/new">
                <Plus size={15} /> Add product
              </Link>
            }
          />
        )}
        {!isLoading && !loadError && products.length > 0 && visible.length === 0 && (
          <EmptyState title="Nothing matches that" body="No product, SKU or barcode matches your search." />
        )}

        {!isLoading && !loadError && visible.length > 0 && (
          <DataTable
            cols={[
              'Product / Variant',
              'SKU',
              'Barcode',
              { label: 'Price', align: 'right' },
              { label: 'Stock', align: 'right' },
            ]}
            minWidth={860}
          >
            {visible.map((product) => (
              <Fragment key={product.id}>
                <tr>
                  <td colSpan={5} className="t-strong">
                    {product.name}
                    {product.category ? (
                      <span className="t-sub" style={{ marginLeft: 8, fontWeight: 400 }}>
                        {product.category}
                      </span>
                    ) : null}
                  </td>
                </tr>
                {product.variants.map((variant) => (
                  <tr key={variant.id}>
                    <td style={{ paddingLeft: 28 }}>
                      <Link
                        href={`/app/inventory/catalog/${variant.id}`}
                        className="t-sub"
                        style={{ textDecoration: 'none' }}
                      >
                        {variantAttributes(variant)}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {variant.sku}
                        <LowStockBadge quantity={variant.currentStock} threshold={variant.reorderThreshold} />
                      </div>
                    </td>
                    <td className="t-sub t-mono">{variant.barcode ?? '—'}</td>
                    <td className="num">{priceLabel(variant.price, variant.unitOfMeasure)}</td>
                    <td className="num">
                      {variant.currentStock}
                      {unitSuffix(variant.unitOfMeasure) ? ` ${unitSuffix(variant.unitOfMeasure)}` : ''}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </DataTable>
        )}
      </Card>
    </>
  )
}
