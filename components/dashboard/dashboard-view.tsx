'use client'

import Link from 'next/link'
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, PackageOpen, RotateCcw, Sparkle, Zap } from 'lucide-react'
import {
  type Dashboard,
  type DashboardRange,
  type ReorderSuggestionList,
  getAuthenticatedDashboard,
  getAuthenticatedProducts,
  getAuthenticatedReorderSuggestions,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, CardPad, KpiRow, ListRow, PageHead, Seg, Split2, type KpiItem } from '@/components/couture/ui'
import { SetupPrompt } from '@/components/onboarding/setup-prompt'
import { EmptyState, ErrorState, InlineLoader, KpiSkeleton, LoadingState, UnavailableValue } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

const RANGES = [
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
  { label: '30D', value: '30d' },
] as const

export function DashboardView() {
  const { fullDate, appPath } = useAppRegion()
  const t = useT()
  const [range, setRange] = useState<DashboardRange>('7d')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [hasCatalog, setHasCatalog] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only the very first load blanks the page. A range switch keeps the
  // current figures on screen and shows an inline indicator instead: the
  // whole dashboard used to skeleton out on every range click.
  const loadDashboard = useCallback(async (nextRange: DashboardRange, isFirstLoad: boolean) => {
    if (isFirstLoad) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      setDashboard(await getAuthenticatedDashboard(nextRange))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('dashboard.loadError'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void getAuthenticatedProducts()
      .then((products) => setHasCatalog(products.length > 0))
      .catch(() => setHasCatalog(null))
  }, [])

  useEffect(() => {
    void loadDashboard(range, dashboard === null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  return (
    <>
      <PageHead
        title={t('dashboard.title')}
        sub={t('dashboard.today', { date: fullDate(new Date()) })}
        actions={
          hasCatalog === false ? (
            <Link className="btn btn-grad" href={appPath('/app/inventory/catalog/new')}>
              <Zap size={15} /> {t('dashboard.addProduct')}
            </Link>
          ) : (
            <Link className="btn btn-grad" href={appPath('/app/shifts')}>
              <Zap size={15} /> {t('dashboard.openRegister')}
            </Link>
          )
        }
      />

      {error && (
        <Card>
          <ErrorState message={error} onRetry={() => void loadDashboard(range, dashboard === null)} />
        </Card>
      )}

      {isLoading && !error && (
        <>
          <KpiSkeleton cols={6} />
          <Card>
            <LoadingState label={t('dashboard.loading')} rows={4} />
          </Card>
        </>
      )}

      {!isLoading && !error && dashboard && (
        <DashboardContent
          dashboard={dashboard}
          range={range}
          onRange={setRange}
          isRefreshing={isRefreshing}
          hasCatalog={hasCatalog}
        />
      )}
    </>
  )
}

function DashboardContent({
  dashboard,
  range,
  onRange,
  isRefreshing,
  hasCatalog,
}: {
  dashboard: Dashboard
  range: DashboardRange
  onRange: (value: DashboardRange) => void
  isRefreshing: boolean
  hasCatalog: boolean | null
}) {
  const { money, shortDate: dateLabel, appPath } = useAppRegion()
  const t = useT()
  const hasActivity = dashboard.sales.billCount > 0
  const drawer = dashboard.cashDrawer
  const billCount = dashboard.sales.billCount

  const metrics: KpiItem[] = [
    {
      label: t('dashboard.kpi.sales'),
      value: money(dashboard.sales.totalAmount),
      meta: billCount === 1 ? t('dashboard.kpi.billsOne') : t('dashboard.kpi.bills', { count: billCount }),
      href: '/app/reports',
    },
    {
      label: t('dashboard.kpi.avgBill'),
      value: money(dashboard.sales.averageBillAmount),
      meta: hasActivity ? t('dashboard.kpi.across', { count: billCount }) : t('dashboard.kpi.noBills'),
      href: '/app/reports',
    },
    {
      // Available since Phase 5: goods receipt now persists a moving-average
      // cost per variant. Still a union: a tenant whose sold items have never
      // been received against a PO genuinely has no cost basis and is told so.
      label: t('dashboard.kpi.grossMargin'),
      value:
        dashboard.sales.grossMargin.status === 'available' ? (
          `${dashboard.sales.grossMargin.percent}%`
        ) : (
          <UnavailableValue reason={dashboard.sales.grossMargin.reason} />
        ),
      meta:
        dashboard.sales.grossMargin.status === 'available'
          ? t('dashboard.kpi.marginMeta', {
              margin: money(dashboard.sales.grossMargin.amount),
              costed: money(dashboard.sales.grossMargin.costedRevenue),
            }) +
            (Number(dashboard.sales.grossMargin.uncostedRevenue) > 0
              ? t('dashboard.kpi.uncosted', { amount: money(dashboard.sales.grossMargin.uncostedRevenue) })
              : '')
          : dashboard.sales.grossMargin.reason,
    },
    {
      label: t('dashboard.kpi.cashDrawer'),
      value:
        drawer.status === 'open' ? (
          money(drawer.openingCash)
        ) : (
          <UnavailableValue reason={t('dashboard.kpi.openFirst')} text={t('dashboard.kpi.noShift')} />
        ),
      meta: drawer.status === 'open' ? t('dashboard.kpi.opened', { date: dateLabel(drawer.openedAt) }) : t('dashboard.kpi.openFirst'),
      href: '/app/shifts',
    },
    {
      label: t('dashboard.kpi.lowStock'),
      value: String(dashboard.lowStock.count),
      meta: dashboard.lowStock.count > 0 ? t('dashboard.kpi.atReorder') : t('dashboard.kpi.healthy'),
      href: '/app/inventory',
    },
    {
      // DASH-01 keeps this tile despite it never carrying a figure in V1: an
      // owner migrating from a POS that showed settlement needs to know we
      // deliberately do not, rather than wonder where it went. It states why
      // rather than showing a zero.
      label: t('dashboard.kpi.settlement'),
      value: <UnavailableValue reason={dashboard.settlement.reason} />,
      meta: dashboard.settlement.reason,
    },
  ]

  return (
    <>
      <KpiRow items={metrics} cols={6} />

      <Split2>
        <Card>
          <CardHead
            title={t('dashboard.trend.title')}
            sub={t('dashboard.trend.sub', { days: range.replace('d', '') })}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isRefreshing && <InlineLoader label={t('dashboard.trend.updating')} />}
                <Seg items={RANGES} active={range} onSelect={onRange} ariaLabel={t('dashboard.trend.rangeLabel')} />
              </div>
            }
          />
          <CardPad>
            {dashboard.trend.revenue.length === 0 ? (
              hasCatalog === false ? (
                <EmptyState
                  icon={<PackageOpen size={24} strokeWidth={1.8} />}
                  title={t('dashboard.trend.firstProductsTitle')}
                  body={t('dashboard.trend.firstProductsBody')}
                  action={
                    <Link className="btn btn-pri" href={appPath('/app/inventory/catalog/new')}>
                      {t('dashboard.trend.addProducts')}
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  icon={<PackageOpen size={24} strokeWidth={1.8} />}
                  title={t('dashboard.trend.noSalesTitle')}
                  body={t('dashboard.trend.noSalesBody')}
                  action={
                    <Link className="btn btn-pri" href={appPath('/app/shifts')}>
                      {t('dashboard.trend.openRegister')}
                    </Link>
                  }
                />
              )
            ) : (
              <RevenueChart points={dashboard.trend.revenue} />
            )}
          </CardPad>
          {dashboard.trend.revenue.length > 0 && (
            <CardPad style={{ paddingTop: 0, fontSize: 11.5, color: 'var(--muted)' }}>
              {t('dashboard.trend.profitSeries', { reason: dashboard.trend.profit.reason })}
            </CardPad>
          )}
        </Card>

        <ActionCenter dashboard={dashboard} />
      </Split2>

      <ReorderSummaryCard />

      <SetupPrompt />
    </>
  )
}

/**
 * Area + baseline chart matching the prototype's sparkChart geometry, but
 * plotted from real revenue points only. No synthetic series is drawn.
 */
function RevenueChart({ points }: { points: { date: string; amount: string }[] }) {
  const { money, fullDate, shortDate: dateLabel } = useAppRegion()
  const t = useT()
  const { area, line, dots, max } = useMemo(() => {
    const w = 640
    const h = 175
    const pad = 10
    const values = points.map((p) => Number(p.amount))
    const peak = Math.max(...values, 1)
    const step = points.length > 1 ? w / (points.length - 1) : w
    const xy = values.map((v, i) => [points.length > 1 ? i * step : w / 2, h - (v / peak) * (h - pad)] as const)

    let d = xy.length ? `M${xy[0][0]},${xy[0][1]}` : ''
    for (let i = 0; i < xy.length - 1; i++) {
      const p0 = xy[i - 1] ?? xy[i]
      const p1 = xy[i]
      const p2 = xy[i + 1]
      const p3 = xy[i + 2] ?? p2
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }

    return {
      line: d,
      area: d ? `${d} L${w},${h} L0,${h} Z` : '',
      dots: xy,
      max: peak,
    }
  }, [points])

  const w = 640
  const h = 175
  const [hover, setHover] = useState<number | null>(null)

  const onMove = useCallback(
    (event: MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const fraction = (event.clientX - rect.left) / rect.width
      const index = Math.round(fraction * (points.length - 1))
      setHover(Math.min(Math.max(index, 0), points.length - 1))
    },
    [points.length],
  )

  const active = hover !== null ? dots[hover] : null
  const activePoint = hover !== null ? points[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h + 24}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 210, overflow: 'visible' }}
        role="img"
        aria-label={t('dashboard.trend.chartLabel')}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0058BA" stopOpacity=".22" />
            <stop offset=".6" stopColor="#6C9FFF" stopOpacity=".08" />
            <stop offset="1" stopColor="#6C9FFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dash-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0058BA" />
            <stop offset="1" stopColor="#6C9FFF" />
          </linearGradient>
        </defs>

        {[0.18, 0.42, 0.66, 0.9].map((f) => (
          <line key={f} x1="0" y1={(f * h).toFixed(0)} x2={w} y2={(f * h).toFixed(0)} stroke="#EEF0F2" strokeWidth="1" strokeDasharray="2 6" />
        ))}

        {area && <path d={area} fill="url(#dash-area)" />}
        {line && <path d={line} fill="none" stroke="url(#dash-line)" strokeWidth="2.6" strokeLinecap="round" />}

        {active && (
          <line x1={active[0]} y1={0} x2={active[0]} y2={h} stroke="#0058BA" strokeWidth="1" strokeDasharray="3 4" opacity={0.4} />
        )}

        {dots.map((c, i) => (
          <circle
            key={i}
            cx={c[0].toFixed(1)}
            cy={c[1].toFixed(1)}
            r={i === hover ? 5.5 : i === dots.length - 1 ? 5 : 3.2}
            fill={i === hover || i === dots.length - 1 ? '#0058BA' : '#fff'}
            stroke={i === hover || i === dots.length - 1 ? '#fff' : '#0058BA'}
            strokeWidth={i === hover || i === dots.length - 1 ? 2.5 : 2}
          />
        ))}

        {points.map((p, i) => {
          const stride = Math.ceil(points.length / 8)
          if (i % stride !== 0 && i !== points.length - 1) return null
          const x = points.length > 1 ? i * (w / (points.length - 1)) : w / 2
          return (
            <text key={p.date} x={x} y={h + 18} fontSize="11" fill="#98A2B3" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
              {dateLabel(p.date)}
            </text>
          )
        })}
        <title>{t('dashboard.trend.peak', { amount: money(max) })}</title>
      </svg>

      {active && activePoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(active[0] / w) * 100}%`,
            top: Math.max(active[1] - 46, 0),
            transform: `translateX(${active[0] < w / 2 ? '4px' : 'calc(-100% - 4px)'})`,
            background: 'var(--ink)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontWeight: 600 }}>{money(activePoint.amount)}</div>
          <div style={{ opacity: 0.75, fontSize: 11 }}>{fullDate(new Date(activePoint.date))}</div>
        </div>
      )}
    </div>
  )
}

function ActionCenter({ dashboard }: { dashboard: Dashboard }) {
  const { shortDate: dateLabel, appPath } = useAppRegion()
  const t = useT()
  const items = dashboard.actionable.items

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHead
        title={t('dashboard.actions.title')}
        sub={t('dashboard.actions.sub')}
        right={
          <span className="badge b-blue">
            {items.length === 1 ? t('dashboard.actions.itemsOne') : t('dashboard.actions.items', { count: items.length })}
          </span>
        }
      />
      {items.length === 0 ? (
        <CardPad style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState title={t('dashboard.actions.emptyTitle')} body={t('dashboard.actions.emptyBody')} />
        </CardPad>
      ) : (
        <CardPad style={{ paddingTop: 4, flex: 1 }}>
          {items.map((item) =>
            item.type === 'low_stock' ? (
              <ListRow
                key={item.variantId}
                tone="red"
                icon={<Boxes size={17} strokeWidth={1.85} />}
                title={t('dashboard.actions.lowTitle', { product: item.productName })}
                sub={t('dashboard.actions.lowSub', { sku: item.sku, quantity: item.quantity, threshold: item.reorderThreshold })}
                action={
                  <Link className="btn btn-sm btn-ghost" href={appPath('/app/inventory')}>
                    {t('common.review')}
                  </Link>
                }
              />
            ) : (
              <ListRow
                key={item.shiftId}
                tone="amber"
                icon={<RotateCcw size={17} strokeWidth={1.85} />}
                title={t('dashboard.actions.registerOpen')}
                sub={t('dashboard.actions.registerSub', { date: dateLabel(item.openedAt) })}
                action={
                  <Link className="btn btn-sm btn-ghost" href={appPath('/app/shifts')}>
                    {t('common.open')}
                  </Link>
                }
              />
            ),
          )}
        </CardPad>
      )}
    </Card>
  )
}

/**
 * Compact surface for the ML wedge on the dashboard itself: the full
 * interactive table (recalculate, select, draft PO) lives on Demand Planning
 * so there's one place suggestions are actually actioned from.
 */
function ReorderSummaryCard() {
  const { appPath } = useAppRegion()
  const t = useT()
  const [data, setData] = useState<ReorderSuggestionList | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAuthenticatedReorderSuggestions()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return null

  const items = data?.items ?? []
  if (items.length === 0) return null

  const top = items.slice(0, 4)
  return (
    <Card style={{ marginTop: 18 }}>
      <CardHead
        title={t('dashboard.reorder.title')}
        sub={t('dashboard.reorder.sub')}
        right={
          <Link className="btn btn-sm btn-pri" href={appPath('/app/demand-planning')}>
            <Sparkle size={14} /> {t('dashboard.reorder.reviewAll', { count: items.length })}
          </Link>
        }
      />
      <CardPad style={{ paddingTop: 4 }}>
        {top.map((s) => (
          <ListRow
            key={s.id}
            tone="blue"
            icon={<Boxes size={17} strokeWidth={1.85} />}
            title={t('dashboard.reorder.orderLine', { quantity: s.suggestedQuantity, product: s.productName })}
            sub={t('dashboard.reorder.available', { sku: s.sku, stock: s.reason.currentStock })}
          />
        ))}
      </CardPad>
    </Card>
  )
}
