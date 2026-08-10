'use client'

import Link from 'next/link'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Barcode, Boxes, Package, Plus, Upload } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, DataTable, KpiRow, PageHead, SearchField, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, KpiSkeleton, LoadingState, UnavailableValue } from '@/components/couture/states'
import { LowStockBadge } from '@/components/low-stock-badge'
import { priceLabel, unitSuffix } from '@/lib/units'
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

const LOAD_ERROR = "We couldn't load your current stock. Check your connection and try again."
const CATALOG_LOAD_ERROR = "Couldn't load your catalog. Check your connection and try again."

function variantAttributes(variant: Variant) {
  return [variant.size, variant.color, variant.material].filter(Boolean).join(' / ')
}

export function InventoryView() {
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.GET('/stock-movements/low-stock', { headers: await authHeaders() })
    setLoading(false)
    if (requestError || !data) {
      setError(LOAD_ERROR)
      return
    }
    setLowStock(data)
  }, [])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    const { data, error: requestError } = await apiClient.GET('/products', { headers: await authHeaders() })
    setCatalogLoading(false)
    if (requestError || !data) {
      setCatalogError(CATALOG_LOAD_ERROR)
      return
    }
    setProducts(data as Product[])
  }, [])

  useEffect(() => {
    void load()
    void loadCatalog()
  }, [load, loadCatalog])

  const critical = lowStock.filter((item) => item.quantity === 0).length

  const metrics: KpiItem[] = [
    { label: 'Low Stock', value: loading ? '-' : String(lowStock.length), meta: 'At or below reorder threshold' },
    { label: 'Out of Stock', value: loading ? '-' : String(critical), meta: critical > 0 ? 'Needs immediate reorder' : 'None currently' },
    {
      label: 'Total SKUs',
      value: catalogLoading ? '-' : String(products.reduce((sum, p) => sum + p.variants.length, 0)),
      meta: catalogLoading ? '' : `${products.length} product${products.length === 1 ? '' : 's'}`,
    },
    { label: 'Inventory Value', value: <UnavailableValue />, meta: 'Cost basis is not persisted' },
  ]

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
        title="Inventory"
        sub="Products, stock levels and reorder exceptions"
        actions={
          <>
            <Link className="btn" href="/app/inventory/labels">
              <Barcode size={15} /> Print labels
            </Link>
            <Link className="btn" href="/app/import">
              <Upload size={15} /> Import file
            </Link>
            <Link className="btn btn-pri" href="/app/inventory/catalog/new">
              <Plus size={15} /> Add product
            </Link>
          </>
        }
      />

      {loading || catalogLoading ? <KpiSkeleton cols={4} /> : <KpiRow items={metrics} cols={4} />}

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

        {catalogLoading && <LoadingState label="Loading catalog" />}
        {!catalogLoading && catalogError && <ErrorState message={catalogError} onRetry={() => void loadCatalog()} />}
        {!catalogLoading && !catalogError && products.length === 0 && (
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
        {!catalogLoading && !catalogError && products.length > 0 && visible.length === 0 && (
          <EmptyState title="Nothing matches that" body="No product, SKU or barcode matches your search." />
        )}

        {!catalogLoading && !catalogError && visible.length > 0 && (
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
            {visible.map((product) => {
              const [firstVariant, ...restVariants] = product.variants
              if (!firstVariant) {
                return (
                  <tr key={product.id}>
                    <td colSpan={5} className="t-strong">
                      {product.name}
                      {product.category ? (
                        <span className="t-sub" style={{ marginLeft: 8, fontWeight: 400 }}>
                          {product.category}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                )
              }
              return (
                <Fragment key={product.id}>
                  <tr>
                    <td className="t-strong">
                      <Link href={`/app/inventory/catalog/${firstVariant.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {product.name}
                      </Link>
                      {product.category ? (
                        <span className="t-sub" style={{ marginLeft: 8, fontWeight: 400 }}>
                          {product.category}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {firstVariant.sku}
                        <LowStockBadge quantity={firstVariant.currentStock} threshold={firstVariant.reorderThreshold} />
                      </div>
                    </td>
                    <td className="t-sub t-mono">{firstVariant.barcode ?? '-'}</td>
                    <td className="num">{priceLabel(firstVariant.price, firstVariant.unitOfMeasure)}</td>
                    <td className="num">
                      {firstVariant.currentStock}
                      {unitSuffix(firstVariant.unitOfMeasure) ? ` ${unitSuffix(firstVariant.unitOfMeasure)}` : ''}
                    </td>
                  </tr>
                  {restVariants.map((variant) => (
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
                      <td className="t-sub t-mono">{variant.barcode ?? '-'}</td>
                      <td className="num">{priceLabel(variant.price, variant.unitOfMeasure)}</td>
                      <td className="num">
                        {variant.currentStock}
                        {unitSuffix(variant.unitOfMeasure) ? ` ${unitSuffix(variant.unitOfMeasure)}` : ''}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </DataTable>
        )}
      </Card>

      <ReorderSuggestions />

      <Card>
        <CardHead
          title="Low-stock exceptions"
          sub="Server-calculated variants at or below their reorder threshold"
        />

        {loading && <LoadingState label="Loading inventory" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && lowStock.length === 0 && (
          <EmptyState
            icon={<Boxes size={24} strokeWidth={1.8} />}
            title="All stock levels are healthy"
            body="No variant is at or below its reorder threshold right now."
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
                    {[item.size, item.color, item.material].filter(Boolean).join(' · ') || '-'}
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
