'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Plus } from 'lucide-react'
import { AuthenticatedRequestError, getAuthenticatedSales, type SaleList } from '@/lib/api/authenticated-client'
import { downloadCsv } from '@/lib/csv'
import { UsCard, UsEmptyState, UsErrorState, UsKpiGrid, UsLoadingState, UsPageHead, UsTable } from './states'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

function errorMessage(error: unknown) { return error instanceof AuthenticatedRequestError || error instanceof Error ? error.message : 'Order history is unavailable right now.' }

export function UsOrdersView() {
  const [data, setData] = useState<SaleList | null>(null)
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextCursor?: string, history = cursorHistory) => {
    setLoading(true)
    setError(null)
    try {
      const next = await getAuthenticatedSales({ status: 'completed', limit: 25, search: search.trim() || undefined, cursor: nextCursor })
      setData(next)
      setCursor(nextCursor)
      setCursorHistory(history)
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [cursorHistory, search])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(undefined, []) }, 250)
    return () => window.clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  function nextPage() {
    if (!data?.nextCursor) return
    void load(data.nextCursor, [...cursorHistory, cursor])
  }

  function previousPage() {
    if (cursorHistory.length === 0) return
    const history = cursorHistory.slice(0, -1)
    void load(cursorHistory[cursorHistory.length - 1], history)
  }

  const rows = data?.items ?? []
  return (
    <>
      <UsPageHead title="Orders" sub="Completed sales from the selected International store" actions={<><button className="btn" type="button" disabled={rows.length === 0} onClick={() => downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, ['Bill No.', 'Sale ID', 'Customer', 'Created at', 'Payment methods', 'Status', 'Subtotal', 'Discount', 'Tax', 'Total'], rows.map((sale) => [sale.invoiceNumber ?? sale.id, sale.id, sale.customerId ? 'Customer linked' : 'Walk-in', sale.createdAt, sale.payments.map((payment) => payment.method).join(' / '), sale.status, sale.subtotal, sale.discountAmount, sale.taxAmount, sale.totalAmount]))}><Download size={14} />Export page</button><Link className="btn btn-primary" href="/us/dashboard/billing"><Plus size={14} />New sale</Link></>} />
      <UsKpiGrid items={[{ label: 'Matching orders', value: data?.total ?? '—', meta: 'Server-filtered completed sales' }, { label: 'Current page', value: rows.length, meta: 'Records returned in this page' }, { label: 'Online / BOPIS', value: '—', meta: 'No channel contract in this build' }, { label: 'Order revenue', value: '—', meta: 'Run a report for supported aggregates' }]} />
      <UsCard>
        <div className="card-header"><div className="card-header-left"><h3>Order history</h3><p>Search by bill or sale identifier. Online-channel and pickup status are not implied.</p></div><div className="field" style={{ minWidth: 240 }}><label className="sr-only" htmlFor="us-order-search">Search orders</label><input id="us-order-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bill number or sale ID" /></div></div>
        {loading ? <UsLoadingState label="Loading orders" /> : null}
        {!loading && error ? <UsErrorState message={error} onRetry={() => void load(cursor, cursorHistory)} /> : null}
        {!loading && !error && rows.length === 0 ? <UsEmptyState title="No orders match this view" body="Completed sales appear here after the backend records them. Nothing is previewed while the result is empty." action={<Link className="btn btn-primary" href="/us/dashboard/billing">Start a sale</Link>} /> : null}
        {!loading && !error && rows.length > 0 ? <UsTable columns={['Bill no.', 'Customer', 'Created', 'Payment', 'Status', 'Amount']} minWidth={760}>{rows.map((sale) => <tr key={sale.id}><td className="num"><b>{sale.invoiceNumber ?? sale.id.slice(0, 8).toUpperCase()}</b><span className="sub">{sale.id.slice(0, 8)}</span></td><td>{sale.customerId ? 'Customer linked' : 'Walk-in'}</td><td>{dateTime.format(new Date(sale.createdAt))}</td><td>{sale.payments.map((payment) => payment.method).join(', ') || '—'}</td><td><span className="badge b-green">{sale.status}</span></td><td className="num"><b>{usd.format(Number(sale.totalAmount))}</b></td></tr>)}</UsTable> : null}
        {data && !loading && !error ? <div className="pagination"><span>Showing {rows.length} of {data.total}</span><div className="page-actions"><button className="btn btn-sm" type="button" disabled={cursorHistory.length === 0} onClick={previousPage}>Previous</button><button className="btn btn-sm" type="button" disabled={!data.nextCursor} onClick={nextPage}>Next</button></div></div> : null}
      </UsCard>
    </>
  )
}
