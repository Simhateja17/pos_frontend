'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { type PaymentRead, getAuthenticatedPayments } from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable, KpiRow, PageHead, Tabs, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'
import { downloadCsv } from '@/lib/csv'
import { Pagination } from './orders-view'
import { useAppRegion } from '@/lib/app-region'

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Collected', value: 'completed' },
  { label: 'Refunded', value: 'refunded' },
] as const

type Filter = (typeof FILTERS)[number]['value']

export function PaymentsView() {
  const { money } = useAppRegion()
  const [filter, setFilter] = useState<Filter>('all')
  const [data, setData] = useState<PaymentRead | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true)
      setError(null)
      try {
        setData(
          await getAuthenticatedPayments({
            status: filter === 'all' ? undefined : filter,
            cursor: nextCursor,
            limit: 25,
          }),
        )
        setCursor(nextCursor)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Payment records are unavailable right now.')
      } finally {
        setLoading(false)
      }
    },
    [filter],
  )

  useEffect(() => {
    void load()
  }, [load])

  const summary = data?.summary
  const metrics: KpiItem[] = [
    { label: 'Collected', value: summary ? money(Number(summary.collectedAmount)) : '-', meta: 'Server-calculated' },
    { label: 'Refunded', value: summary ? money(Number(summary.refundedAmount)) : '-', meta: 'Server-calculated' },
    { label: 'Net Collected', value: summary ? money(Number(summary.netAmount)) : '-', meta: 'Server-calculated' },
    { label: 'Settlement', value: <UnavailableValue />, meta: 'No settlement endpoint is available' },
  ]

  return (
    <>
      <PageHead
        title="Payments & Settlement"
        sub="Tender mix, settlements and reconciliation"
        actions={
          <button
            className="btn"
            type="button"
            disabled={!data || data.items.length === 0}
            title={data?.items.length ? 'Download the payments shown below' : 'There is nothing to export yet'}
            onClick={() =>
              data &&
              downloadCsv(
                `payments-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Payment ID', 'Sale ID', 'Method', 'Direction', 'Created at', 'Amount'],
                data.items.map((payment) => [
                  payment.id,
                  payment.saleId,
                  payment.method,
                  payment.direction,
                  payment.createdAt,
                  payment.amount,
                ]),
              )
            }
          >
            <Download size={15} /> Export
          </button>
        }
      />

      <KpiRow items={metrics} cols={4} />

      <Card>
        <CardHead
          title={<Tabs items={FILTERS} active={filter} onSelect={setFilter} ariaLabel="Payment status filter" />}
          right={<span className="t-sub">Settlement and provider detail are not available</span>}
        />

        {loading && <LoadingState label="Loading payments" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState title="No payments recorded yet" body="Collected and refunded tender appears here once sales are completed." />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={['Payment', 'Bill', 'Method', 'Time', 'Status', 'Amount']} minWidth={820}>
            {data.items.map((payment) => (
              <tr key={payment.id}>
                <td className="t-mono t-strong">{payment.id.slice(0, 8).toUpperCase()}</td>
                <td className="t-mono t-sub">{payment.saleId.slice(0, 8).toUpperCase()}</td>
                <td style={{ textTransform: 'capitalize' }}>{payment.method}</td>
                <td className="t-mono t-sub">{dateTime.format(new Date(payment.createdAt))}</td>
                <td>
                  <span className={`badge ${payment.direction === 'refund' ? 'b-blue' : 'b-green'}`}>
                    {payment.direction === 'refund' ? 'Refunded' : 'Collected'}
                  </span>
                </td>
                <td className="num t-strong">
                  {money(Number(payment.amount))}
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {data && !loading && !error && (
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
