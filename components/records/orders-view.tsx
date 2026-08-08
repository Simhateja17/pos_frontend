'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  type SaleList,
  getAuthenticatedAppContext,
  getAuthenticatedSales,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable, KpiRow, PageHead, SearchField, Tabs, type BadgeTone, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'
import { downloadCsv } from '@/lib/csv'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const timeOnly = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
const dateShort = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'This month', value: 'month' },
] as const

type Range = (typeof RANGES)[number]['value']

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: 'green',
  paid: 'green',
  held: 'amber',
  pending: 'amber',
  refunded: 'blue',
  cancelled: 'red',
  voided: 'red',
}

export function OrdersView() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<Range>('today')
  const [status, setStatus] = useState('')
  const [data, setData] = useState<SaleList | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null)
  const isCashier = role === 'cashier'

  const load = useCallback(
    async (nextCursor?: string) => {
      setIsLoading(true)
      setError(null)
      try {
        setData(
          await getAuthenticatedSales({
            search: search || undefined,
            status: status || undefined,
            ...(role === 'cashier' ? {} : rangeQuery(range)),
            cursor: nextCursor,
            limit: 25,
          }),
        )
        setCursor(nextCursor)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Sales records are unavailable right now.')
      } finally {
        setIsLoading(false)
      }
    },
    [range, role, search, status],
  )

  useEffect(() => {
    void getAuthenticatedAppContext()
      .then((appContext) => setRole(appContext.staff.role))
      .catch(() => setRole('cashier'))
  }, [])

  useEffect(() => {
    if (!role) return
    const timer = window.setTimeout(() => void load(), 300)
    return () => window.clearTimeout(timer)
  }, [load, role])

  useEffect(() => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    if (status) next.set('status', status)
    if (!isCashier) next.set('range', range)
    router.replace(`/app/orders?${next.toString()}`)
  }, [isCashier, range, router, search, status])

  const metrics: KpiItem[] = [
    { label: 'Matching Invoices', value: data ? String(data.total) : '—', meta: 'Server-filtered records' },
    { label: 'Held Bills', value: <UnavailableValue />, meta: 'No held-bill aggregate is available' },
    { label: 'Paid Sales', value: <UnavailableValue />, meta: 'No sales aggregate is available' },
    { label: 'Cancelled / Refunded', value: <UnavailableValue />, meta: 'No aggregate is available' },
  ]

  return (
    <>
      <PageHead
        title="Sales / Orders"
        sub="Invoice and held-bill history"
        actions={
          <>
            {!isCashier && (
              <button
                className="btn"
                type="button"
                disabled={!data || data.items.length === 0}
                title={data?.items.length ? 'Download the sales shown below' : 'There is nothing to export yet'}
                onClick={() =>
                  data &&
                  downloadCsv(
                    `sales-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['Invoice', 'Sale ID', 'Customer', 'Created at', 'Payment methods', 'Status', 'Subtotal', 'Discount', 'Tax', 'Total'],
                    data.items.map((sale) => [
                      sale.id.slice(0, 8).toUpperCase(),
                      sale.id,
                      sale.customerId ? 'Customer linked' : 'Walk-in',
                      sale.createdAt,
                      sale.payments.map((payment) => payment.method).join(' / '),
                      sale.status,
                      sale.subtotal,
                      sale.discountAmount,
                      sale.taxAmount,
                      sale.totalAmount,
                    ]),
                  )
                }
              >
                <Download size={15} /> Export
              </button>
            )}
            <Link className="btn btn-pri" href="/app/billing">
              <Plus size={15} /> New Bill
            </Link>
          </>
        }
      />

      {!isCashier && <KpiRow items={metrics} cols={4} />}

      <Card>
        <CardHead
          title={
            isCashier
              ? 'Sales on this counter\'s current shift'
              : <Tabs items={RANGES} active={range} onSelect={setRange} ariaLabel="Sales date range" />
          }
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchField value={search} onChange={setSearch} placeholder="Invoice or customer" ariaLabel="Search sales" width={200} />
              {!isCashier && (
                <select className="fld-select" aria-label="Sales status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
          }
        />

        {isLoading && <LoadingState label="Loading sales" />}
        {!isLoading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!isLoading && !error && data?.items.length === 0 && (
          <EmptyState
            title="No orders match this view"
            body="Completed sales appear here as soon as the server records them. Nothing is previewed in the meantime."
            action={
              <Link className="btn btn-pri" href="/app/billing">
                Start a bill
              </Link>
            }
          />
        )}

        {!isLoading && !error && data && data.items.length > 0 && (
          <DataTable
            cols={['Invoice', 'Customer', 'Cashier', 'Time', 'Method', 'Status', { label: 'Amount', align: 'right' }, '']}
            minWidth={900}
          >
            {data.items.map((sale) => {
              const created = new Date(sale.createdAt)
              return (
                <tr key={sale.id}>
                  <td className="t-mono t-strong">{sale.id.slice(0, 8).toUpperCase()}</td>
                  <td>{sale.customerId ? 'Customer linked' : 'Walk-in'}</td>
                  <td className="t-sub">Not recorded</td>
                  <td className="t-mono t-sub">
                    {timeOnly.format(created)}
                    <div className="t-sub">{dateShort.format(created)}</div>
                  </td>
                  <td>{sale.payments.map((p) => p.method).join(', ') || '—'}</td>
                  <td>
                    <span className={`badge b-${STATUS_TONE[sale.status.toLowerCase()] ?? 'grey'}`}>{sale.status}</span>
                  </td>
                  <td className="num t-strong" style={{ textAlign: 'right' }}>
                    {money.format(Number(sale.totalAmount))}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn btn-sm" href={`/app/returns?saleId=${encodeURIComponent(sale.id)}`}>
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}

        {data && !isLoading && !error && (
          <Pagination
            shown={data.items.length}
            total={data.total}
            previous={cursor}
            next={data.nextCursor}
            onPrevious={() => void load(undefined)}
            onNext={() => void load(data.nextCursor ?? undefined)}
          />
        )}
      </Card>
    </>
  )
}

function rangeQuery(range: Range) {
  const now = new Date()
  const from = new Date(now)
  if (range === 'today') from.setHours(0, 0, 0, 0)
  else if (range === '7d') from.setDate(now.getDate() - 7)
  else from.setDate(1)
  return { from: from.toISOString(), to: now.toISOString() }
}

export function Pagination({
  shown,
  total,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  shown: number
  total: number
  previous?: string
  next: string | null
  onPrevious: () => void
  onNext: () => void
}) {
  if (total === 0) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderTop: '1px solid var(--border-soft)',
        fontSize: 12.5,
        color: 'var(--muted)',
      }}
    >
      <span>
        Showing {shown} of {total}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm" disabled={!previous} onClick={onPrevious}>
          First page
        </button>
        <button className="btn btn-sm" disabled={!next} onClick={onNext}>
          Next page
        </button>
      </div>
    </div>
  )
}
