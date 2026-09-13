'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { type PaymentRead, getAuthenticatedPayments } from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable, KpiRow, PageHead, Tabs, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState, UnavailableValue } from '@/components/couture/states'
import { downloadCsv } from '@/lib/csv'
import { Pagination } from './orders-view'
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT } from '@/lib/i18n/i18n'

const FILTER_VALUES = ['all', 'completed', 'refunded'] as const
type Filter = (typeof FILTER_VALUES)[number]

export function PaymentsView() {
  const { money, dateLocale } = useAppRegion()
  const t = useT()
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
        setError(cause instanceof Error ? cause.message : t('records.errors.paymentsLoad'))
      } finally {
        setLoading(false)
      }
    },
    [filter], // eslint-disable-line react-hooks/exhaustive-deps -- locale changes must not refetch payments
  )

  useEffect(() => {
    void load()
  }, [load])

  const summary = data?.summary
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
  const filterItems = FILTER_VALUES.map((value) => ({
    value,
    label: value === 'all' ? t('records.payments.all') : value === 'completed' ? t('records.payments.collected') : t('records.payments.refunded'),
  }))
  const metrics: KpiItem[] = [
    { label: t('records.payments.collected'), value: summary ? money(Number(summary.collectedAmount)) : '-', meta: t('records.payments.serverCalculated') },
    { label: t('records.payments.refunded'), value: summary ? money(Number(summary.refundedAmount)) : '-', meta: t('records.payments.serverCalculated') },
    { label: t('records.payments.net'), value: summary ? money(Number(summary.netAmount)) : '-', meta: t('records.payments.serverCalculated') },
    { label: t('records.payments.title'), value: <UnavailableValue />, meta: t('records.payments.noSettlementEndpoint') },
  ]

  return (
    <>
      <PageHead
        title={t('records.payments.title')}
        sub={t('records.payments.subtitle')}
        actions={
          <button
            className="btn"
            type="button"
            disabled={!data || data.items.length === 0}
            title={data?.items.length ? t('records.payments.downloadTitle') : t('records.payments.nothingExport')}
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
            <Download size={15} /> {t('records.payments.export')}
          </button>
        }
      />

      <KpiRow items={metrics} cols={4} />

      <Card>
        <CardHead
          title={<Tabs items={filterItems} active={filter} onSelect={setFilter} ariaLabel={t('records.payments.filterLabel')} />}
          right={<span className="t-sub">{t('records.payments.settlementUnavailable')}</span>}
        />

        {loading && <LoadingState label={t('records.payments.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!loading && !error && data?.items.length === 0 && (
          <EmptyState title={t('records.payments.emptyTitle')} body={t('records.payments.emptyBody')} />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <DataTable cols={[t('records.payments.payment'), t('records.payments.cols.bill'), t('records.payments.cols.method'), t('records.payments.cols.date'), t('records.payments.cols.type'), t('records.payments.cols.amount')]} minWidth={820}>
            {data.items.map((payment) => (
              <tr key={payment.id}>
                <td className="t-mono t-strong">{payment.id.slice(0, 8).toUpperCase()}</td>
                <td className="t-mono t-sub">{payment.saleId.slice(0, 8).toUpperCase()}</td>
                <td style={{ textTransform: 'capitalize' }}>{enumLabel(t, 'method', payment.method)}</td>
                <td className="t-mono t-sub">{dateTime.format(new Date(payment.createdAt))}</td>
                <td>
                  <span className={`badge ${payment.direction === 'refund' ? 'b-blue' : 'b-green'}`}>
                    {payment.direction === 'refund' ? t('records.payments.refunded') : t('records.payments.collected')}
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
