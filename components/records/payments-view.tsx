'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { type PaymentRead, getAuthenticatedPayments } from '@/lib/api/authenticated-client'
import { Pagination, ReadState } from './orders-view'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export function PaymentsView() {
  const [status, setStatus] = useState<'completed' | 'refunded' | undefined>()
  const [data, setData] = useState<PaymentRead | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async (nextCursor?: string) => { setLoading(true); setError(null); try { setData(await getAuthenticatedPayments({ status, cursor: nextCursor, limit: 25 })); setCursor(nextCursor) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Payment records are unavailable right now.') } finally { setLoading(false) } }, [status])
  useEffect(() => { void load() }, [load])
  const summary = data?.summary
  return <main className="p-5 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-bold">Payments & Settlement</h1><p className="mt-1 text-slate-500">Tender mix, settlements and reconciliation</p></div><button type="button" disabled title="Exports are not available yet" className="flex h-12 items-center gap-2 rounded-xl border bg-white px-4 font-semibold disabled:cursor-not-allowed disabled:text-slate-400"><Download className="size-4" /> Export unavailable</button></div>
    <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Collected" value={summary ? money.format(Number(summary.collectedAmount)) : '—'} meta="Server-calculated" primary /><Metric label="Refunded" value={summary ? money.format(Number(summary.refundedAmount)) : '—'} meta="Server-calculated" /><Metric label="Net collected" value={summary ? money.format(Number(summary.netAmount)) : '—'} meta="Server-calculated" /><Metric label="Settlement" value="Unavailable" meta="No settlement endpoint is available" /></section>
    <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold" aria-label="Payment status filter">{([{ label: 'All', value: undefined }, { label: 'Collected', value: 'completed' }, { label: 'Refunded', value: 'refunded' }] as const).map((filter) => <button key={filter.label} type="button" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)} className={`rounded-lg px-4 py-2 ${status === filter.value ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{filter.label}</button>)}</div><p className="text-sm text-slate-500">Settlement/provider detail is unavailable.</p></div><ReadState loading={loading} error={error} empty={!!data && data.items.length === 0} onRetry={() => void load(cursor)} />
      {data && !loading && !error && data.items.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="text-xs font-bold uppercase tracking-wider text-slate-400"><tr>{['Payment', 'Invoice', 'Method', 'Time', 'Status', 'Amount'].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr></thead><tbody className="divide-y">{data.items.map((payment) => <tr key={payment.id}><td className="px-5 py-5 font-mono font-bold">{payment.id}</td><td className="px-5 py-5 font-mono text-slate-500">{payment.saleId}</td><td className="px-5 py-5 capitalize">{payment.method}</td><td className="px-5 py-5 font-mono text-sm">{dateTime.format(new Date(payment.createdAt))}</td><td className="px-5 py-5"><span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${payment.direction === 'refund' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{payment.direction === 'refund' ? 'Refunded' : 'Collected'}</span></td><td className="px-5 py-5 font-mono font-bold">{money.format(Number(payment.amount))}</td></tr>)}</tbody></table></div>}
      {data && !loading && !error && <Pagination shown={data.items.length} total={data.total} previous={cursor} next={data.nextCursor} onPrevious={() => void load(undefined)} onNext={() => void load(data.nextCursor ?? undefined)} />}
    </section></main>
}
function Metric({ label, value, meta, primary = false }: { label: string; value: string; meta: string; primary?: boolean }) { return <article className={`rounded-2xl border p-5 shadow-sm ${primary ? 'border-blue-200 bg-[#edf4ff]' : 'bg-white'}`}><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-4 font-mono text-2xl font-bold">{value}</p><p className="mt-2 text-sm text-slate-500">{meta}</p></article> }
