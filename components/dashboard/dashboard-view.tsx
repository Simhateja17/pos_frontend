'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Boxes, IndianRupee, PackageOpen, ReceiptIndianRupee, WalletCards } from 'lucide-react'
import { type Dashboard, type DashboardRange, getAuthenticatedDashboard } from '@/lib/api/authenticated-client'

const RANGES: DashboardRange[] = ['7d', '14d', '30d']
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function money(value: string) {
  return currency.format(Number(value))
}

function unavailable(reason: string) {
  return <span className="text-sm text-slate-500">Unavailable: {reason}</span>
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
      setError(loadError instanceof Error ? loadError.message : 'We couldn’t load current store data. Retry loading the dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard(range)
  }, [loadDashboard, range])

  return (
    <main className="p-5 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500">Current store activity · India</p>
        </div>
        <Link href="/app/shifts" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2b64c5] px-5 font-semibold text-white shadow-lg shadow-blue-200">
          <PackageOpen className="size-5" /> Open Register
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Dashboard date range">
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={range === option}
            disabled={isLoading}
            onClick={() => setRange(option)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b64c5] ${range === option ? 'bg-[#2b64c5] text-white' : 'border border-[#e2e5ea] bg-white text-slate-700'}`}
          >
            {option.replace('d', ' days')}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p>We couldn’t load current store data. Retry loading the dashboard.</p>
          <button type="button" onClick={() => void loadDashboard(range)} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
            Retry loading dashboard
          </button>
        </div>
      )}

      {isLoading && <DashboardSkeleton />}
      {!isLoading && dashboard && <DashboardContent dashboard={dashboard} range={range} />}
    </main>
  )
}

function DashboardSkeleton() {
  return <div aria-label="Loading dashboard" className="animate-pulse space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-40 rounded-2xl bg-slate-100" />)}</div><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"><div className="h-96 rounded-2xl bg-slate-100" /><div className="h-96 rounded-2xl bg-slate-100" /></div></div>
}

function DashboardContent({ dashboard, range }: { dashboard: Dashboard; range: DashboardRange }) {
  const highestRevenue = useMemo(() => Math.max(...dashboard.trend.revenue.map((point) => Number(point.amount)), 0), [dashboard.trend.revenue])
  const hasActivity = dashboard.sales.billCount > 0
  const metrics = [
    { label: 'Sales', value: money(dashboard.sales.totalAmount), meta: `${dashboard.sales.billCount} completed bill${dashboard.sales.billCount === 1 ? '' : 's'}`, icon: IndianRupee, primary: true },
    { label: 'Avg bill value', value: money(dashboard.sales.averageBillAmount), meta: hasActivity ? `Across ${dashboard.sales.billCount} completed bills` : 'No completed bills in this period', icon: ReceiptIndianRupee },
    { label: 'Gross margin', value: 'Unavailable', meta: dashboard.sales.grossMargin.reason, icon: ArrowUpRight },
    { label: 'Cash drawer', value: dashboard.cashDrawer.status === 'open' ? money(dashboard.cashDrawer.openingCash) : 'No open shift', meta: dashboard.cashDrawer.status === 'open' ? `Opened ${dateLabel(dashboard.cashDrawer.openedAt)}` : 'Open a register before taking sales', icon: WalletCards },
    { label: 'Low stock', value: String(dashboard.lowStock.count), meta: dashboard.lowStock.count > 0 ? 'Review items that need attention' : 'All stock levels reported healthy', icon: Boxes },
    { label: 'Settlement', value: 'Unavailable', meta: dashboard.settlement.reason, icon: ReceiptIndianRupee },
  ]

  return <>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {metrics.map(({ label, value, meta, icon: Icon, primary }) => <article key={label} className={`rounded-2xl border p-5 shadow-sm ${primary ? 'border-blue-200 bg-[#edf4ff]' : 'border-[#e2e5ea] bg-white'}`}><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><Icon className="size-4 text-slate-400" /></div><p className="mt-4 break-words font-mono text-2xl font-bold">{value}</p><p className="mt-2 text-sm text-slate-500">{meta}</p></article>)}
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <article className="min-w-0 rounded-2xl border border-[#e2e5ea] bg-white p-6 shadow-sm"><h2 className="font-heading text-xl font-bold">Sales trend</h2><p className="text-sm text-slate-500">Last {range.replace('d', '')} days · completed revenue</p>{dashboard.trend.revenue.length === 0 ? <EmptyActivity /> : <><div className="mt-8 min-w-[420px] border-b border-dashed border-slate-200"><div className="flex h-64 items-end gap-3" aria-label="Revenue chart">{dashboard.trend.revenue.map((point) => <div key={point.date} className="flex h-full min-w-10 flex-1 flex-col justify-end"><span className="sr-only">{dateLabel(point.date)}: {money(point.amount)}</span><div className="w-full rounded-t-md bg-gradient-to-t from-[#cfe0ff] to-[#76a1ef]" style={{ height: `${Math.max((Number(point.amount) / highestRevenue) * 100, 2)}%` }} /><span className="mt-2 text-center text-xs text-slate-500">{dateLabel(point.date)}</span></div>)}</div></div><p className="mt-5 text-sm text-slate-500">Profit trend: {unavailable(dashboard.trend.profit.reason)}</p></>}</article>
      <ActionCenter dashboard={dashboard} />
    </section>
  </>
}

function EmptyActivity() {
  return <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-6"><h3 className="font-semibold">Your store is ready for its first sale</h3><p className="mt-2 text-sm text-slate-500">Open the register to begin; metrics will appear after real transactions.</p><Link href="/app/shifts" className="mt-4 inline-flex rounded-lg bg-[#2b64c5] px-4 py-2 text-sm font-semibold text-white">Open register</Link></div>
}

function ActionCenter({ dashboard }: { dashboard: Dashboard }) {
  return <article className="rounded-2xl border border-[#e2e5ea] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-heading text-xl font-bold">Action Center</h2><span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{dashboard.actionable.items.length} item{dashboard.actionable.items.length === 1 ? '' : 's'}</span></div>{dashboard.actionable.items.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5"><p className="font-semibold">No operational actions need attention</p><p className="mt-1 text-sm text-slate-500">Current alerts will appear here when the store records them.</p></div> : <div className="mt-5 space-y-3">{dashboard.actionable.items.map((item) => item.type === 'low_stock' ? <Link key={item.variantId} href="/app/inventory" className="block rounded-xl border p-4 transition hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2b64c5]"><strong className="block text-sm">{item.productName} is low on stock</strong><span className="mt-1 block text-xs text-slate-500">{item.sku} · {item.quantity} remaining · reorder at {item.reorderThreshold}</span></Link> : <Link key={item.shiftId} href="/app/shifts" className="block rounded-xl border p-4 transition hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2b64c5]"><strong className="block text-sm">Register is open</strong><span className="mt-1 block text-xs text-slate-500">Opened {dateLabel(item.openedAt)} · review the current shift</span></Link>)}</div>}</article>
}
