'use client'

import Link from 'next/link'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Barcode, BarChart3, Boxes, Package, Plus, Upload } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable, KpiRow, PageHead, SearchField, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, KpiSkeleton, LoadingState, UnavailableValue } from '@/components/couture/states'
import { LowStockBadge } from '@/components/low-stock-badge'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'
import { priceLabel, unitSuffix } from '@/lib/units'
import { inventoryStatus, inventoryVariantMatches } from '@/lib/operational-display'

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
  movingAverageCost: string | null
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

type StockFilter = 'all' | 'low' | 'out'

function variantAttributes(variant: Variant) {
  return [variant.size, variant.color, variant.material].filter(Boolean).join(' / ')
}

function inventoryCostSummary(products: Product[]) {
  return products.reduce(
    (summary, product) =>
      product.variants.reduce((next, variant) => {
        if (variant.movingAverageCost == null) {
          return { ...next, uncostedVariants: next.uncostedVariants + 1 }
        }

        const unitCost = Number(variant.movingAverageCost)
        if (!Number.isFinite(unitCost)) {
          return { ...next, uncostedVariants: next.uncostedVariants + 1 }
        }

        return {
          ...next,
          value: next.value + unitCost * variant.currentStock,
          costedVariants: next.costedVariants + 1,
        }
      }, summary),
    { value: 0, costedVariants: 0, uncostedVariants: 0 },
  )
}

export function InventoryView() {
  const { appPath, money } = useAppRegion()
  const t = useT()
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null)
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const exceptionsRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.GET('/stock-movements/low-stock', { headers: await authHeaders() })
    setLoading(false)
    if (requestError || !data) {
      setError(t('inventory.errors.stockLoad'))
      return
    }
    setLowStock(data)
    // t is intentionally omitted: changing locale must not refetch stock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    const { data, error: requestError } = await apiClient.GET('/products', { headers: await authHeaders() })
    setCatalogLoading(false)
    if (requestError || !data) {
      setCatalogError(t('inventory.errors.catalogLoad'))
      return
    }
    setProducts(data as Product[])
    // t is intentionally omitted: changing locale must not refetch the catalog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void getAuthenticatedAppContext()
      .then((context) => setRole(context.staff.role))
      .catch(() => setRole(null))
    void load()
    void loadCatalog()
  }, [load, loadCatalog])

  const critical = lowStock.filter((item) => item.quantity === 0).length
  const inventory = inventoryCostSummary(products)
  const uncostedMeta = inventory.uncostedVariants > 0
    ? `${inventory.uncostedVariants} ${inventory.uncostedVariants === 1 ? t('inventory.kpi.uncostedOne') : t('inventory.kpi.uncostedMany')}`
    : t('inventory.kpi.movingAverage')

  const toggleStockFilter = (next: Exclude<StockFilter, 'all'>) => {
    setStockFilter((current) => (current === next ? 'all' : next))
    exceptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const metrics: KpiItem[] = [
    {
      label: t('inventory.kpi.lowStock'),
      value: loading ? '-' : String(lowStock.length),
      meta: t('inventory.kpi.atThreshold'),
      onClick: loading || lowStock.length === 0 ? undefined : () => toggleStockFilter('low'),
      active: stockFilter === 'low',
    },
    {
      label: t('inventory.kpi.outOfStock'),
      value: loading ? '-' : String(critical),
      meta: critical > 0 ? t('inventory.kpi.needsReorder') : t('inventory.kpi.noneCurrently'),
      onClick: loading || critical === 0 ? undefined : () => toggleStockFilter('out'),
      active: stockFilter === 'out',
    },
    {
      label: t('inventory.kpi.totalSkus'),
      value: catalogLoading ? '-' : String(products.reduce((sum, p) => sum + p.variants.length, 0)),
      meta: catalogLoading
        ? ''
        : `${products.length} ${products.length === 1 ? t('inventory.kpi.productOne') : t('inventory.kpi.products')}`,
    },
    {
      label: t('inventory.kpi.inventoryValue'),
      value:
        catalogLoading
          ? '-'
          : inventory.costedVariants === 0
            ? <UnavailableValue />
            : money(inventory.value),
      meta:
        catalogLoading
          ? ''
          : inventory.costedVariants === 0
            ? t('inventory.kpi.costBasisNotPersisted')
            : uncostedMeta,
    },
  ]

  // 'low' keeps every flagged variant so the table matches the Low Stock tile:
  // out-of-stock variants are a subset of the ones below their reorder threshold.
  const exceptions = stockFilter === 'out' ? lowStock.filter((item) => item.quantity === 0) : lowStock

  const term = search.trim().toLowerCase()
  const visible = term
    ? products
        .map((product) => ({
          ...product,
          variants: product.variants.filter(
            (v) => inventoryVariantMatches(product.name, v, term),
          ),
        }))
        .filter((product) => product.variants.length > 0)
    : products

  return (
    <>
      <PageHead
        title={t('inventory.title')}
        sub={t('inventory.subtitle')}
        actions={
          <>
            <Link className="btn" href={appPath('/app/demand-planning')}>
              <BarChart3 size={15} /> {t('inventory.actions.demandPlanning')}
            </Link>
            <Link className="btn" href={appPath('/app/inventory/labels')}>
              <Barcode size={15} /> {t('inventory.actions.printLabels')}
            </Link>
            {role === 'owner' && (
              <Link className="btn" href={appPath('/app/import')}>
              <Upload size={15} /> {t('inventory.actions.importFile')}
              </Link>
            )}
            <Link className="btn btn-pri" href={appPath('/app/inventory/catalog/new')}>
              <Plus size={15} /> {t('inventory.actions.addProduct')}
            </Link>
          </>
        }
      />

      {loading || catalogLoading ? <KpiSkeleton cols={4} /> : <KpiRow items={metrics} cols={4} />}

      <Card>
        <CardHead
          title={t('inventory.catalog.title')}
          sub={products.length > 0 ? `${products.length} ${products.length === 1 ? t('inventory.catalog.productsOne') : t('inventory.catalog.productsMany')}` : undefined}
          right={
            products.length > 0 ? (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder={t('inventory.catalog.searchPlaceholder')}
                ariaLabel={t('inventory.catalog.searchLabel')}
                width={280}
              />
            ) : undefined
          }
        />

        {catalogLoading && <LoadingState label={t('inventory.catalog.loading')} />}
        {!catalogLoading && catalogError && <ErrorState message={catalogError} onRetry={() => void loadCatalog()} />}
        {!catalogLoading && !catalogError && products.length === 0 && (
          <EmptyState
            icon={<Package size={24} strokeWidth={1.8} />}
            title={t('inventory.catalog.emptyTitle')}
            body={t('inventory.catalog.emptyBody')}
            action={
              <Link className="btn btn-pri" href={appPath('/app/inventory/catalog/new')}>
                <Plus size={15} /> {t('inventory.actions.addProduct')}
              </Link>
            }
          />
        )}
        {!catalogLoading && !catalogError && products.length > 0 && visible.length === 0 && (
          <EmptyState title={t('inventory.catalog.noMatchTitle')} body={t('inventory.catalog.noMatchBody')} />
        )}

        {!catalogLoading && !catalogError && visible.length > 0 && (
          <DataTable
            cols={[t('inventory.catalog.cols.productVariant'), t('inventory.catalog.cols.sku'), t('inventory.catalog.cols.barcode'), t('inventory.catalog.cols.price'), t('inventory.catalog.cols.stock')]}
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
                      <Link href={appPath(`/app/inventory/catalog/${firstVariant.id}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                    <td className="num">
                      {priceLabel(firstVariant.price, firstVariant.unitOfMeasure)}
                    </td>
                    <td className="num">
                      {firstVariant.currentStock}
                      {unitSuffix(firstVariant.unitOfMeasure) ? ` ${unitSuffix(firstVariant.unitOfMeasure)}` : ''}
                    </td>
                  </tr>
                  {restVariants.map((variant) => (
                    <tr key={variant.id}>
                      <td style={{ paddingLeft: 28 }}>
                        <Link
                          href={appPath(`/app/inventory/catalog/${variant.id}`)}
                          className="t-nested"
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
                      <td className="num">
                        {priceLabel(variant.price, variant.unitOfMeasure)}
                      </td>
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

      <div ref={exceptionsRef} className="gap-block" style={{ scrollMarginTop: 16 }}>
        <Card>
          <CardHead
            title={
              stockFilter === 'out'
                ? t('inventory.exceptions.outTitle')
                : stockFilter === 'low'
                  ? t('inventory.exceptions.lowTitle')
                  : t('inventory.exceptions.allTitle')
            }
            sub={
              stockFilter === 'out'
                ? t('inventory.exceptions.outSubtitle')
                : stockFilter === 'low'
                  ? t('inventory.exceptions.lowSubtitle')
                  : t('inventory.exceptions.allSubtitle')
            }
            right={
              stockFilter === 'all' ? undefined : (
                <button type="button" className="btn" onClick={() => setStockFilter('all')}>
                  {t('inventory.exceptions.showAll')}
                </button>
              )
            }
          />

          {loading && <LoadingState label={t('inventory.exceptions.loading')} />}
          {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
          {!loading && !error && lowStock.length === 0 && (
            <EmptyState
              icon={<Boxes size={24} strokeWidth={1.8} />}
              title={t('inventory.exceptions.healthyTitle')}
              body={t('inventory.exceptions.healthyBody')}
            />
          )}

          {!loading && !error && lowStock.length > 0 && exceptions.length === 0 && (
            <EmptyState
              icon={<Boxes size={24} strokeWidth={1.8} />}
              title={t('inventory.exceptions.noOutTitle')}
              body={t('inventory.exceptions.noOutBody')}
            />
          )}

          {!loading && !error && exceptions.length > 0 && (
            <DataTable
              cols={[t('inventory.exceptions.cols.sku'), t('inventory.exceptions.cols.product'), t('inventory.exceptions.cols.variant'), t('inventory.exceptions.cols.available'), t('inventory.exceptions.cols.reorderAt'), t('inventory.exceptions.cols.status')]}
              minWidth={760}
            >
              {exceptions.map((item) => {
                const status = inventoryStatus(item.quantity, item.reorderThreshold)
                return (
                  <tr key={item.variantId}>
                    <td className="t-mono t-strong">{item.sku}</td>
                    <td>{item.productName}</td>
                    <td className="t-sub">
                      {[item.size, item.color, item.material].filter(Boolean).join(' · ') || '-'}
                    </td>
                    <td className="num t-strong">
                      {item.quantity}
                    </td>
                    <td className="num" style={{ color: 'var(--muted)' }}>
                      {item.reorderThreshold}
                    </td>
                    <td>
                      <span className={`badge b-${status.tone}`}>{status.label}</span>
                    </td>
                  </tr>
                )
              })}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  )
}
