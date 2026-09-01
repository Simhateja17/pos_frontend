'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, DollarSign, PackageOpen, RefreshCw, ShoppingCart } from 'lucide-react'
import { getAuthenticatedDashboard, type Dashboard, type DashboardRange } from '@/lib/api/authenticated-client'
import { AuthenticatedRequestError } from '@/lib/api/authenticated-client'
import { UsCard, UsCardBody, UsCardHeader, UsEmptyState, UsErrorState, UsKpiGrid, UsLoadingState, UsPageHead, UsTable, UsUnavailableValue } from './states'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

function money(value: string | number) {
  return usd.format(Number(value))
}

function formatRangeDate(value: string) {
  return dateOnly.format(new Date(`${value}T12:00:00`))
}

export function UsDashboardView() {
  const [range, setRange] = useState<DashboardRange>('7d')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDashboard(await getAuthenticatedDashboard(range))
    } catch (nextError) {
      setError(nextError instanceof AuthenticatedRequestError ? nextError.message : 'Dashboard data is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { void load() }, [load])

  if (loading && !dashboard) {
    return <><UsPageHead title="Dashboard" sub="Current tenant performance and operational signals" /><UsLoadingState label="Loading dashboard" rows={8} /></>
  }
  if (error && !dashboard) {
    return <><UsPageHead title="Dashboard" sub="Current tenant performance and operational signals" /><UsCard><UsErrorState message={error} onRetry={() => void load()} /></UsCard></>
  }
  if (!dashboard) return null

  const margin = dashboard.sales.grossMargin
  const marginValue = margin.status === 'available' ? `${margin.percent}%` : <UsUnavailableValue reason={margin.reason} />
  const drawer = dashboard.cashDrawer.status === 'open'
    ? `${money(dashboard.cashDrawer.openingCash)} opening`
    : <UsUnavailableValue text="No open shift" />

  return (
    <>
      <UsPageHead
        title="Dashboard"
        sub={`${dateOnly.format(new Date(dashboard.period.endsAt))} · Business-day window ${dateOnly.format(new Date(dashboard.period.startsAt))}–${dateOnly.format(new Date(dashboard.period.endsAt))}`}
        actions={
          <>
            <div className="tabs" aria-label="Dashboard range">
              {(['7d', '14d', '30d'] as const).map((value) => <button key={value} type="button" className={`tab-btn${range === value ? ' on' : ''}`} onClick={() => setRange(value)}>{value}</button>)}
            </div>
            <button className="btn" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} />{loading ? 'Refreshing…' : 'Refresh'}</button>
            <Link className="btn btn-primary" href="/us/dashboard/billing"><ShoppingCart size={14} />New sale</Link>
          </>
        }
      />

      {error ? <div className="notice error" role="alert">{error} Showing the last successful dashboard response.</div> : null}
      <UsKpiGrid items={[
        { label: 'Net sales', value: money(dashboard.sales.totalAmount), meta: `${dashboard.sales.billCount} completed bills`, href: '/us/dashboard/orders' },
        { label: 'Transactions', value: dashboard.sales.billCount, meta: `Average ticket ${money(dashboard.sales.averageBillAmount)}`, href: '/us/dashboard/orders' },
        { label: 'Gross margin', value: marginValue, meta: margin.status === 'available' ? `${money(margin.amount)} on costed revenue` : margin.reason },
        { label: 'Low stock', value: dashboard.lowStock.count, meta: dashboard.lowStock.count === 0 ? 'No variants at threshold' : 'Variants at or below reorder threshold', href: '/us/dashboard/inventory' },
      ]} />

      <div className="grid cols-2 anim-up delay-1">
        <UsCard>
          <UsCardHeader title="Revenue by business day" sub={`${dashboard.range} window · tenant timezone applied`} />
          {dashboard.trend.revenue.length === 0 ? <UsEmptyState icon={<DollarSign size={24} />} title="No completed sales in this period" body="Revenue appears here after the selected tenant records a completed sale." /> : (
            <UsTable columns={['Business day', 'Revenue']} minWidth={420}>
              {dashboard.trend.revenue.map((row) => <tr key={row.date}><td>{formatRangeDate(row.date)}</td><td className="num"><b>{money(row.amount)}</b></td></tr>)}
            </UsTable>
          )}
        </UsCard>

        <UsCard>
          <UsCardHeader title="Cash drawer" sub="Shift facts returned by the backend" />
          <UsCardBody className="item-list">
            <div className="item-row"><div className="item-icon"><DollarSign size={16} /></div><div className="item-body"><b>{dashboard.cashDrawer.status === 'open' ? 'Open shift' : 'No open shift'}</b><small>{dashboard.cashDrawer.status === 'open' ? `Opened ${dateTime.format(new Date(dashboard.cashDrawer.openedAt))}` : 'Open a shift before completing a sale.'}</small></div><span className={`badge ${dashboard.cashDrawer.status === 'open' ? 'b-green' : 'b-muted'}`}>{dashboard.cashDrawer.status === 'open' ? drawer : 'Unavailable'}</span></div>
            <div className="item-row"><div className="item-icon"><PackageOpen size={16} /></div><div className="item-body"><b>Settlement status</b><small>{dashboard.settlement.reason}</small></div><UsUnavailableValue text="Not tracked" /></div>
            <div className="item-row"><div className="item-icon"><ArrowRight size={16} /></div><div className="item-body"><b>Profit trend</b><small>{dashboard.trend.profit.reason}</small></div><UsUnavailableValue text="Not tracked" /></div>
          </UsCardBody>
        </UsCard>
      </div>

      <div className="grid cols-2 anim-up delay-2" style={{ marginTop: 14 }}>
        <UsCard>
          <UsCardHeader title="Low-stock variants" sub="Live catalog and store-level stock threshold results" right={<Link className="btn btn-sm" href="/us/dashboard/inventory">Open inventory</Link>} />
          {dashboard.lowStock.items.length === 0 ? <UsEmptyState title="No low-stock variants" body="The backend did not return any variant at or below its reorder threshold." /> : (
            <UsTable columns={['Product', 'SKU', 'On hand', 'Threshold']}>
              {dashboard.lowStock.items.slice(0, 8).map((item) => <tr key={item.variantId}><td><b>{item.productName || 'Unnamed product'}</b></td><td className="num">{item.sku}</td><td className="num">{item.quantity}</td><td className="num">{item.reorderThreshold}</td></tr>)}
            </UsTable>
          )}
        </UsCard>

        <UsCard>
          <UsCardHeader title="Actionable signals" sub="Only facts the current backend can substantiate" />
          {dashboard.actionable.items.length === 0 ? <UsEmptyState title="No actions returned" body="There are no low-stock variants or open-shift reminders in this response." /> : (
            <UsCardBody className="item-list">
              {dashboard.actionable.items.map((item) => item.type === 'low_stock' ? (
                <div className="item-row" key={`low-${item.variantId}`}><div className="item-icon"><PackageOpen size={16} /></div><div className="item-body"><b>{item.productName || 'Unnamed product'}</b><small>{item.sku} · {item.quantity} on hand against threshold {item.reorderThreshold}</small></div><span className="badge b-amber">Low stock</span></div>
              ) : (
                <div className="item-row" key={`shift-${item.shiftId}`}><div className="item-icon"><DollarSign size={16} /></div><div className="item-body"><b>Open shift</b><small>Opened {dateTime.format(new Date(item.openedAt))}</small></div><span className="badge b-green">Active</span></div>
              ))}
            </UsCardBody>
          )}
        </UsCard>
      </div>
    </>
  )
}
