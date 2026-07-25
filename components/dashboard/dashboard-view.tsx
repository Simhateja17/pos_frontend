'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, PackageOpen, RotateCcw, Zap } from 'lucide-react'
import { type Dashboard, type DashboardRange, getAuthenticatedDashboard } from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, KpiRow, ListRow, PageHead, Seg, Split2, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, KpiSkeleton, LoadingState, UnavailableValue } from '@/components/couture/states'

const RANGES = [
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
  { label: '30D', value: '30d' },
] as const

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dayMonth = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

function money(value: string) {
  return currency.format(Number(value))
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

export function DashboardView() {
  const [range, setRange] = useState<DashboardRange>('7d')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (nextRange: DashboardRange) => {
    setDashboard(null)
    setIsLoading(true)
    setError(null)

    try {
      setDashboard(await getAuthenticatedDashboard(nextRange))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We couldn’t load current store data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard(range)
  }, [loadDashboard, range])

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={`Today · ${dayMonth.format(new Date())}`}
        actions={
          <Link className="btn btn-grad" href="/app/shifts">
            <Zap size={15} /> Open Register
          </Link>
        }
      />

      {error && (
        <Card>
          <ErrorState message={error} onRetry={() => void loadDashboard(range)} />
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

      {!isLoading && !error && dashboard && <DashboardContent dashboard={dashboard} range={range} onRange={setRange} />}
    </>
  )
}

function DashboardContent({
  dashboard,
  range,
  onRange,
}: {
  dashboard: Dashboard
  range: DashboardRange
  onRange: (value: DashboardRange) => void
}) {
  const hasActivity = dashboard.sales.billCount > 0
  const drawer = dashboard.cashDrawer

  const metrics: KpiItem[] = [
    {
      label: 'Sales',
      value: money(dashboard.sales.totalAmount),
      meta: `${dashboard.sales.billCount} completed bill${dashboard.sales.billCount === 1 ? '' : 's'}`,
    },
    {
      label: 'Avg Bill Value',
      value: money(dashboard.sales.averageBillAmount),
      meta: hasActivity ? `Across ${dashboard.sales.billCount} completed bills` : 'No completed bills in this period',
    },
    {
      // Available since Phase 5: goods receipt now persists a moving-average
      // cost per variant. Still a union — a tenant whose sold items have never
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
      value: drawer.status === 'open' ? money(drawer.openingCash) : 'No open shift',
      meta: drawer.status === 'open' ? `Opened ${dateLabel(drawer.openedAt)}` : 'Open a register before taking sales',
    },
    {
      label: 'Low Stock',
      value: String(dashboard.lowStock.count),
      meta: dashboard.lowStock.count > 0 ? 'At or below reorder point' : 'All stock levels reported healthy',
    },
    {
      label: 'UPI Settlement',
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
            right={<Seg items={RANGES} active={range} onSelect={onRange} ariaLabel="Dashboard date range" />}
          />
          <CardPad>
            {dashboard.trend.revenue.length === 0 ? (
              <EmptyState
                icon={<PackageOpen size={24} strokeWidth={1.8} />}
                title="Your store is ready for its first sale"
                body="Open the register to begin. The revenue trend appears here once real transactions are recorded."
                action={
                  <Link className="btn btn-pri" href="/app/shifts">
                    Open register
                  </Link>
                }
              />
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
    </>
  )
}

/**
 * Area + baseline chart matching the prototype's sparkChart geometry, but
 * plotted from real revenue points only. No synthetic series is drawn.
 */
function RevenueChart({ points }: { points: { date: string; amount: string }[] }) {
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

  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} preserveAspectRatio="none" style={{ width: '100%', height: 210, overflow: 'visible' }} role="img" aria-label="Completed revenue trend">
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

      {dots.map((c, i) => (
        <circle key={i} cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r={i === dots.length - 1 ? 5 : 3.2} fill={i === dots.length - 1 ? '#0058BA' : '#fff'} stroke={i === dots.length - 1 ? '#fff' : '#0058BA'} strokeWidth={i === dots.length - 1 ? 2.5 : 2} />
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
      <title>{`Peak ${currency.format(max)}`}</title>
    </svg>
  )
}

function ActionCenter({ dashboard }: { dashboard: Dashboard }) {
  const items = dashboard.actionable.items

  return (
    <Card>
      <CardHead
        title="Action Center"
        sub="Operational items that need attention"
        right={<span className="badge b-blue">{items.length} item{items.length === 1 ? '' : 's'}</span>}
      />
      {items.length === 0 ? (
        <CardPad>
          <EmptyState
            title="Nothing needs attention"
            body="Low stock, open registers and other operational alerts appear here as soon as the store records them."
          />
        </CardPad>
      ) : (
        <CardPad style={{ paddingTop: 4 }}>
          {items.map((item) =>
            item.type === 'low_stock' ? (
              <ListRow
                key={item.variantId}
                tone="red"
                icon={<Boxes size={17} strokeWidth={1.85} />}
                title={`${item.productName} is low on stock`}
                sub={`${item.sku} · ${item.quantity} remaining · reorder at ${item.reorderThreshold}`}
                action={
                  <Link className="btn btn-sm btn-ghost" href="/app/inventory">
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
                  <Link className="btn btn-sm btn-ghost" href="/app/shifts">
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
