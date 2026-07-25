'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type SaleList, getAuthenticatedSales } from '@/lib/api/authenticated-client'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export function OrdersView() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<'today' | '7d' | 'month'>('today')
  const [status, setStatus] = useState('')
  const [data, setData] = useState<SaleList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async (nextCursor?: string) => {
    setIsLoading(true); setError(null)
    try { setData(await getAuthenticatedSales({ search: search || undefined, status: status || undefined, ...rangeQuery(range), cursor: nextCursor, limit: 25 })); setCursor(nextCursor) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Sales records are unavailable right now.') }
    finally { setIsLoading(false) }
  }, [range, search, status])
  useEffect(() => { const timer = window.setTimeout(() => void load(), 300); return () => window.clearTimeout(timer) }, [load])
  useEffect(() => { const next = new URLSearchParams(); if (search) next.set('search', search); if (status) next.set('status', status); next.set('range', range); router.replace(`/app/orders?${next.toString()}`) }, [range, router, search, status])
  return <main className="p-5 md:p-8">
    <Header />
    <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Matching invoices" value={data ? String(data.total) : '—'} meta="Server-filtered records" primary />
      <Metric label="Held bills" value="Unavailable" meta="No held-bill aggregate is available" />
      <Metric label="Paid sales" value="Unavailable" meta="No sales aggregate is available" />
      <Metric label="Cancelled / Refunded" value="Unavailable" meta="No aggregate is available" />
    </section>
    <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
        <div className="flex flex-wrap items-center gap-3"><div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold" aria-label="Sales date range">{([{ label: 'Today', value: 'today' }, { label: 'Last 7 days', value: '7d' }, { label: 'This month', value: 'month' }] as const).map((option) => <button key={option.value} type="button" aria-pressed={range === option.value} onClick={() => setRange(option.value)} className={`rounded-lg px-3 py-2 ${range === option.value ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{option.label}</button>)}</div><select aria-label="Sales status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm"><option value="">All statuses</option><option value="completed">Completed</option></select></div>
        <label className="flex h-11 items-center gap-2 rounded-xl border px-3"><Search className="size-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="outline-none" placeholder="Invoice or customer" aria-label="Search sales" /></label>
      </div>
      <ReadState loading={isLoading} error={error} empty={!!data && data.items.length === 0} onRetry={() => void load(cursor)} />
      {data && !isLoading && !error && data.items.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="text-xs font-bold uppercase tracking-wider text-slate-400"><tr>{['Invoice', 'Customer', 'Cashier', 'Time', 'Method', 'Status', 'Amount', ''].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr></thead><tbody className="divide-y">{data.items.map((sale) => <tr key={sale.id}><td className="px-5 py-5 font-mono font-bold">{sale.id}</td><td className="px-5 py-5">{sale.customerId ? 'Customer linked' : 'Walk-in'}</td><td className="px-5 py-5 text-slate-500">Unavailable</td><td className="px-5 py-5 font-mono">{dateTime.format(new Date(sale.createdAt))}</td><td className="px-5 py-5">{sale.payments.map((payment) => payment.method).join(', ') || '—'}</td><td className="px-5 py-5"><span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">{sale.status}</span></td><td className="px-5 py-5 font-mono font-bold">{money.format(Number(sale.totalAmount))}</td><td className="px-5 py-5"><Link className="rounded-lg border px-3 py-2 text-sm font-semibold" href={`/app/returns?saleId=${encodeURIComponent(sale.id)}`}>View</Link></td></tr>)}</tbody></table></div>}
      {data && !isLoading && !error && <Pagination shown={data.items.length} total={data.total} previous={cursor} next={data.nextCursor} onPrevious={() => void load(undefined)} onNext={() => void load(data.nextCursor ?? undefined)} />}
    </section>
  </main>
}

function rangeQuery(range: 'today' | '7d' | 'month') { const now = new Date(); const from = new Date(now); if (range === 'today') from.setHours(0, 0, 0, 0); else if (range === '7d') from.setDate(now.getDate() - 7); else from.setDate(1); return { from: from.toISOString(), to: now.toISOString() } }

function Header() { return <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-bold">Sales / Orders</h1><p className="mt-1 text-slate-500">Invoice and held-bill history</p></div><div className="flex gap-3"><button type="button" disabled title="Exports are not available yet" className="flex h-12 items-center gap-2 rounded-xl border bg-white px-4 font-semibold disabled:cursor-not-allowed disabled:text-slate-400"><Download className="size-4" /> Export unavailable</button><Link href="/app/billing" className="flex h-12 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white"><Plus className="size-4" /> New Bill</Link></div></div> }
function Metric({ label, value, meta, primary = false }: { label: string; value: string; meta: string; primary?: boolean }) { return <article className={`rounded-2xl border p-5 shadow-sm ${primary ? 'border-blue-200 bg-[#edf4ff]' : 'bg-white'}`}><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-4 font-mono text-2xl font-bold">{value}</p><p className="mt-2 text-sm text-slate-500">{meta}</p></article> }
export function ReadState({ loading, error, empty, onRetry }: { loading: boolean; error: string | null; empty: boolean; onRetry: () => void }) { if (loading) return <div aria-label="Loading records" className="animate-pulse p-5"><div className="h-24 rounded-xl bg-slate-100" /></div>; if (error) return <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>We couldn’t load these records. {error}</p><button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">Retry loading records</button></div>; if (empty) return <div className="p-8 text-center"><h2 className="font-heading text-xl font-bold">No orders match this search</h2><p className="mt-2 text-sm text-slate-500">Completed sales will appear here when the server records them.</p></div>; return null }
export function Pagination({ shown, total, previous, next, onPrevious, onNext }: { shown: number; total: number; previous?: string; next: string | null; onPrevious: () => void; onNext: () => void }) { return <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>Showing {shown} of {total}</span><div className="flex gap-2"><button type="button" disabled={!previous} onClick={onPrevious} className="rounded-lg border px-3 py-2 font-semibold disabled:text-slate-300">First page</button><button type="button" disabled={!next} onClick={onNext} className="rounded-lg border px-3 py-2 font-semibold disabled:text-slate-300">Next page</button></div></div> }
