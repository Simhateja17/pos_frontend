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

const RANGES = [
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
  { label: '30D', value: '30d' },
] as const

export function DashboardView() {
  const { fullDate, appPath } = useAppRegion()
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
      setError(loadError instanceof Error ? loadError.message : 'We couldn’t load current store data.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
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
        title="Dashboard"
        sub={`Today · ${fullDate(new Date())}`}
        actions={
          hasCatalog === false ? (
            <Link className="btn btn-grad" href={appPath('/app/inventory/catalog/new')}>
              <Zap size={15} /> Add Product
            </Link>
          ) : (
            <Link className="btn btn-grad" href={appPath('/app/shifts')}>
              <Zap size={15} /> Open Register
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
            <LoadingState label="Loading dashboard" rows={4} />
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
  const hasActivity = dashboard.sales.billCount > 0
  const drawer = dashboard.cashDrawer

  const metrics: KpiItem[] = [
    {
      label: 'Sales',
      value: money(dashboard.sales.totalAmount),
      meta: `${dashboard.sales.billCount} completed bill${dashboard.sales.billCount === 1 ? '' : 's'}`,
      href: '/app/reports',
    },
    {
      label: 'Avg Bill Value',
      value: money(dashboard.sales.averageBillAmount),
      meta: hasActivity ? `Across ${dashboard.sales.billCount} completed bills` : 'No completed bills in this period',
      href: '/app/reports',
    },
    {
      // Available since Phase 5: goods receipt now persists a moving-average
      // cost per variant. Still a union: a tenant whose sold items have never
      // been received against a PO genuinely has no cost basis and is told so.
      label: 'Gross Margin',
      value:
        dashboard.sales.grossMargin.status === 'available' ? (
          `${dashboard.sales.grossMargin.percent}%`
        ) : (
          <UnavailableValue reason={dashboard.sales.grossMargin.reason} />
        ),
      meta:
        dashboard.sales.grossMargin.status === 'available'
          ? `${money(dashboard.sales.grossMargin.amount)} on ${money(dashboard.sales.grossMargin.costedRevenue)} of costed sales` +
            (Number(dashboard.sales.grossMargin.uncostedRevenue) > 0
              ? ` · ${money(dashboard.sales.grossMargin.uncostedRevenue)} has no cost recorded yet`
              : '')
          : dashboard.sales.grossMargin.reason,
    },
    {
      label: 'Cash Drawer',
      value:
        drawer.status === 'open' ? (
          money(drawer.openingCash)
        ) : (
          <UnavailableValue reason="Open a register before taking sales" text="No open shift" />
        ),
      meta: drawer.status === 'open' ? `Opened ${dateLabel(drawer.openedAt)}` : 'Open a register before taking sales',
      href: '/app/shifts',
    },
    {
      label: 'Low Stock',
      value: String(dashboard.lowStock.count),
      meta: dashboard.lowStock.count > 0 ? 'At or below reorder point' : 'All stock levels reported healthy',
      href: '/app/inventory',
    },
    {
      // DASH-01 keeps this tile despite it never carrying a figure in V1: an
      // owner migrating from a POS that showed settlement needs to know we
      // deliberately do not, rather than wonder where it went. It states why
      // rather than showing a zero.
      label: 'Settlement',
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
            title="Sales trend"
            sub={`Last ${range.replace('d', '')} days · completed revenue`}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isRefreshing && <InlineLoader label="Updating" />}
                <Seg items={RANGES} active={range} onSelect={onRange} ariaLabel="Dashboard date range" />
              </div>
            }
          />
          <CardPad>
            {dashboard.trend.revenue.length === 0 ? (
              hasCatalog === false ? (
                <EmptyState
                  icon={<PackageOpen size={24} strokeWidth={1.8} />}
                  title="Add your first products to get started"
                  body="A store needs a catalog before it can sell anything. Add products, then open the register to make your first sale."
                  action={
                    <Link className="btn btn-pri" href={appPath('/app/inventory/catalog/new')}>
                      Add products
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  icon={<PackageOpen size={24} strokeWidth={1.8} />}
                  title="No sales in this range"
                  body="Choose a longer date range or open the register to record the next sale."
                  action={
                    <Link className="btn btn-pri" href={appPath('/app/shifts')}>
                      Open register
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
              Profit series: {dashboard.trend.profit.reason}
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
        aria-label="Completed revenue trend"
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
        <title>{`Peak ${money(max)}`}</title>
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
  const items = dashboard.actionable.items

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHead
        title="Action Center"
        sub="Operational items that need attention"
        right={<span className="badge b-blue">{items.length} item{items.length === 1 ? '' : 's'}</span>}
      />
      {items.length === 0 ? (
        <CardPad style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            title="Nothing needs attention"
            body="Low stock, open registers and other operational alerts appear here as soon as the store records them."
          />
        </CardPad>
      ) : (
        <CardPad style={{ paddingTop: 4, flex: 1 }}>
          {items.map((item) =>
            item.type === 'low_stock' ? (
              <ListRow
                key={item.variantId}
                tone="red"
                icon={<Boxes size={17} strokeWidth={1.85} />}
                title={`${item.productName} is low on stock`}
                sub={`${item.sku} · ${item.quantity} remaining · reorder at ${item.reorderThreshold}`}
                action={
                  <Link className="btn btn-sm btn-ghost" href={appPath('/app/inventory')}>
                    Review
                  </Link>
                }
              />
            ) : (
              <ListRow
                key={item.shiftId}
                tone="amber"
                icon={<RotateCcw size={17} strokeWidth={1.85} />}
                title="Register is open"
                sub={`Opened ${dateLabel(item.openedAt)} · review the current shift`}
                action={
                  <Link className="btn btn-sm btn-ghost" href={appPath('/app/shifts')}>
                    Open
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
 * interactive table (recalculate, select, draft PO) stays on the Inventory
 * screen so there's one place suggestions are actually actioned from.
 */
function ReorderSummaryCard() {
  const { appPath } = useAppRegion()
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
        title="Reorder suggestions"
        sub="Rule-based, worked out from sales rate and supplier lead time"
        right={
          <Link className="btn btn-sm btn-pri" href={appPath('/app/inventory')}>
            <Sparkle size={14} /> Review all ({items.length})
          </Link>
        }
      />
      <CardPad style={{ paddingTop: 4 }}>
        {top.map((s) => (
          <ListRow
            key={s.id}
            tone="blue"
            icon={<Boxes size={17} strokeWidth={1.85} />}
            title={`${s.productName}: reorder ${s.suggestedQuantity} units`}
            sub={`${s.sku} · ${s.reason.currentStock} in stock`}
            action={<Badge tone={s.confidence === 'high' ? 'green' : s.confidence === 'medium' ? 'amber' : 'grey'}>{s.confidence} confidence</Badge>}
          />
        ))}
      </CardPad>
    </Card>
  )
}
