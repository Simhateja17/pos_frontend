'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Boxes, ExternalLink, Search } from 'lucide-react'
import { AuthenticatedRequestError, getAuthenticatedLowStock, getAuthenticatedProducts, type LowStockVariant, type Product } from '@/lib/api/authenticated-client'
import { UsCard, UsCardHeader, UsEmptyState, UsErrorState, UsKpiGrid, UsLoadingState, UsPageHead, UsTable } from './states'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
function errorMessage(error: unknown) { return error instanceof AuthenticatedRequestError || error instanceof Error ? error.message : 'Inventory records are unavailable right now.' }

export function UsInventoryView() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextProducts, nextLowStock] = await Promise.all([getAuthenticatedProducts(), getAuthenticatedLowStock()])
      setProducts(nextProducts)
      setLowStock(nextLowStock)
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const variants = useMemo(() => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))), [products])
  const visibleVariants = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return variants
    return variants.filter(({ product, variant }) => [product.name, product.category, variant.sku, variant.barcode, variant.size, variant.color, variant.material].some((value) => value?.toLowerCase().includes(needle)))
  }, [search, variants])
  const outOfStock = variants.filter(({ variant }) => variant.currentStock <= 0).length

  if (loading) return <><UsPageHead title="Inventory + Variants" sub="Live catalog and reorder-threshold data" /><UsLoadingState label="Loading inventory" rows={8} /></>
  if (error && products.length === 0) return <><UsPageHead title="Inventory + Variants" sub="Live catalog and reorder-threshold data" /><UsCard><UsErrorState message={error} onRetry={() => void load()} /></UsCard></>

  return (
    <>
      <UsPageHead title="Inventory + Variants" sub="Live catalog stock for the selected International store" actions={<Link className="btn btn-primary" href="/us/dashboard/billing"><ExternalLink size={14} />Open checkout</Link>} />
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      <UsKpiGrid items={[{ label: 'Catalog products', value: products.length, meta: 'Products returned by GET /products' }, { label: 'Variants', value: variants.length, meta: 'Size, color, material, and SKU records' }, { label: 'Low stock', value: lowStock.length, meta: lowStock.length ? 'At or below reorder threshold' : 'No threshold breaches' }, { label: 'Out of stock', value: outOfStock, meta: 'Variants with zero current stock' }]} />
      <div className="grid cols-2">
        <UsCard>
          <UsCardHeader title="Low-stock variants" sub="GET /stock-movements/low-stock" right={<span className={`badge ${lowStock.length ? 'b-amber' : 'b-green'}`}>{lowStock.length} returned</span>} />
          {lowStock.length === 0 ? <UsEmptyState icon={<Boxes size={24} />} title="No low-stock variants" body="The backend returned no variant at or below its configured reorder threshold." /> : <UsTable columns={['Product', 'SKU', 'On hand', 'Threshold', 'Unit']} minWidth={580}>{lowStock.map((item) => <tr key={item.variantId}><td><b>{item.productName || 'Unnamed product'}</b><span className="sub">{[item.size, item.color, item.material].filter(Boolean).join(' · ') || 'Variant details not set'}</span></td><td className="num">{item.sku}</td><td className="num">{item.quantity}</td><td className="num">{item.reorderThreshold}</td><td>{item.unitOfMeasure}</td></tr>)}</UsTable>}
        </UsCard>
        <UsCard>
          <UsCardHeader title="Catalog" sub="Prices and stock returned for this store" right={<div className="search" style={{ maxWidth: 210 }}><Search className="search-icon" aria-hidden="true" /><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalog" aria-label="Search catalog" /></div>} />
          {visibleVariants.length === 0 ? <UsEmptyState title={variants.length === 0 ? 'Catalog is empty' : 'No matching variants'} body={variants.length === 0 ? 'Create or import products before managing store inventory.' : 'Try another name or SKU.'} /> : <UsTable columns={['Product', 'SKU', 'Price', 'On hand', 'Status']} minWidth={620}>{visibleVariants.slice(0, 50).map(({ product, variant }) => <tr key={variant.id}><td><b>{product.name}</b><span className="sub">{[variant.size, variant.color, variant.material].filter(Boolean).join(' · ') || variant.unitOfMeasure}</span></td><td className="num">{variant.sku}</td><td className="num">{usd.format(Number(variant.price))}</td><td className="num">{variant.currentStock}</td><td><span className={`badge ${variant.currentStock <= 0 ? 'b-red' : variant.currentStock <= variant.reorderThreshold ? 'b-amber' : 'b-green'}`}>{variant.currentStock <= 0 ? 'Out of stock' : variant.currentStock <= variant.reorderThreshold ? 'Low stock' : 'In stock'}</span></td></tr>)}</UsTable>}
          {visibleVariants.length > 50 ? <div className="pagination"><span>Showing first 50 matching variants</span><span className="muted">Use search to narrow the catalog.</span></div> : null}
        </UsCard>
      </div>
    </>
  )
}
