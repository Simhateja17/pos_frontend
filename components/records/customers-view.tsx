'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { type CustomerList, getAuthenticatedCustomers } from '@/lib/api/authenticated-client'
import { Pagination, ReadState } from './orders-view'

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })

export function CustomersView() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<CustomerList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async (nextCursor?: string) => { setLoading(true); setError(null); try { setData(await getAuthenticatedCustomers({ search: search || undefined, cursor: nextCursor, limit: 25 })); setCursor(nextCursor) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Customer records are unavailable right now.') } finally { setLoading(false) } }, [search])
  useEffect(() => { const timer = window.setTimeout(() => void load(), 300); return () => window.clearTimeout(timer) }, [load])
  return <main className="p-5 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-bold">Customers</h1><p className="mt-1 text-slate-500">Profiles, purchase history and loyalty</p></div><button type="button" disabled title="Customer creation is not available on this route" className="flex h-12 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Plus className="size-4" /> New customer unavailable</button></div>
    <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex items-center gap-3 border-b p-5"><Search className="size-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 flex-1 outline-none" placeholder="Search by name, phone or email…" aria-label="Search customers" /></div><ReadState loading={loading} error={error} empty={!!data && data.items.length === 0} onRetry={() => void load(cursor)} />
      {data && !loading && !error && data.items.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="text-xs font-bold uppercase tracking-wider text-slate-400"><tr>{['Customer', 'Phone', 'Email', 'Created', ''].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr></thead><tbody className="divide-y">{data.items.map((customer) => <tr key={customer.id}><td className="px-5 py-5 font-semibold">{customer.name ?? 'Unnamed customer'}</td><td className="px-5 py-5 text-slate-500">{customer.phone ?? '—'}</td><td className="px-5 py-5 text-slate-500">{customer.email ?? '—'}</td><td className="px-5 py-5 font-mono text-sm">{dateTime.format(new Date(customer.createdAt))}</td><td className="px-5 py-5 text-sm text-slate-500">Profile details unavailable</td></tr>)}</tbody></table></div>}
      {data && !loading && !error && <Pagination shown={data.items.length} total={data.total} previous={cursor} next={data.nextCursor} onPrevious={() => void load(undefined)} onNext={() => void load(data.nextCursor ?? undefined)} />}
    </section></main>
}
