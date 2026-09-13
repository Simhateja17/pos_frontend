'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT, type Translate } from '@/lib/i18n/i18n'

const RANGE_VALUES = ['today', '7d', 'month'] as const

type Range = (typeof RANGE_VALUES)[number]

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: 'green',
  paid: 'green',
  held: 'amber',
  pending: 'amber',
  refunded: 'blue',
  cancelled: 'red',
  voided: 'red',
}

function customerLabel(sale: SaleList['items'][number], t: Translate): string {
  const customer = sale.customer
  return customer?.name
    ?? customer?.billingName
    ?? customer?.phone
    ?? customer?.email
    ?? (sale.customerId ? t('orders.customerLinked') : t('orders.walkIn'))
}

// CSV exports stay in English on purpose: they feed spreadsheets and
// accounting imports that expect stable column names and codes.
function customerExportValue(sale: SaleList['items'][number]): string {
  const customer = sale.customer
  if (!customer) return sale.customerId ? 'Customer linked' : 'Walk-in'
  return [customer.name ?? customer.billingName, customer.phone, customer.email].filter(Boolean).join(' · ') || 'Customer'
}

export function OrdersView() {
  const { money, dateLocale } = useAppRegion()
  const t = useT()
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

  const ranges = RANGE_VALUES.map((value) => ({ value, label: t(`orders.ranges.${value}`) }))
  const { timeOnly, dateShort } = useMemo(
    () => ({
      timeOnly: new Intl.DateTimeFormat(dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }),
      dateShort: new Intl.DateTimeFormat(dateLocale, { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
    }),
    [dateLocale],
  )

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
        setError(cause instanceof Error ? cause.message : t('orders.loadError'))
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { label: t('orders.kpi.matching'), value: data ? String(data.total) : '-', meta: t('orders.kpi.matchingMeta') },
    { label: t('orders.kpi.held'), value: <UnavailableValue />, meta: t('orders.kpi.heldMeta') },
    { label: t('orders.kpi.paid'), value: <UnavailableValue />, meta: t('orders.kpi.paidMeta') },
    { label: t('orders.kpi.cancelled'), value: <UnavailableValue />, meta: t('orders.kpi.cancelledMeta') },
  ]

  return (
    <>
      <PageHead
        title={t('orders.title')}
        sub={t('orders.sub')}
        actions={
          <>
            {!isCashier && (
              <button
                className="btn"
                type="button"
                disabled={!data || data.items.length === 0}
                title={data?.items.length ? t('orders.exportTitle') : t('orders.nothingToExport')}
                onClick={() =>
                  data &&
                  downloadCsv(
                    `sales-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['Bill No.', 'Sale ID', 'Customer', 'Created at', 'Payment methods', 'Status', 'Subtotal', 'Discount', 'Tax', 'Total'],
                    data.items.map((sale) => [
                      sale.invoiceNumber ?? sale.id.slice(0, 8).toUpperCase(),
                      sale.id,
                      customerExportValue(sale),
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
                <Download size={15} /> {t('orders.export')}
              </button>
            )}
            <Link className="btn btn-pri" href="/app/billing">
              <Plus size={15} /> {t('orders.newBill')}
            </Link>
          </>
        }
      />

      {!isCashier && <KpiRow items={metrics} cols={4} />}

      <Card>
        <CardHead
          title={
            isCashier
              ? t('orders.cashierShift')
              : <Tabs items={ranges} active={range} onSelect={setRange} ariaLabel={t('orders.rangeLabel')} />
          }
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchField value={search} onChange={setSearch} placeholder={t('orders.searchPlaceholder')} ariaLabel={t('orders.searchLabel')} width={200} />
              {!isCashier && (
                <select className="fld-select" aria-label={t('orders.statusLabel')} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">{t('orders.allStatuses')}</option>
                  <option value="completed">{enumLabel(t, 'status', 'completed')}</option>
                </select>
              )}
            </div>
          }
        />

        {isLoading && <LoadingState label={t('orders.loading')} />}
        {!isLoading && error && <ErrorState message={error} onRetry={() => void load(cursor)} />}
        {!isLoading && !error && data?.items.length === 0 && (
          <EmptyState
            title={t('orders.emptyTitle')}
            body={t('orders.emptyBody')}
            action={
              <Link className="btn btn-pri" href="/app/billing">
                {t('orders.startBill')}
              </Link>
            }
          />
        )}

        {!isLoading && !error && data && data.items.length > 0 && (
          <DataTable
            cols={[
              t('orders.cols.bill'),
              t('orders.cols.customer'),
              t('orders.cols.cashier'),
              t('orders.cols.time'),
              t('orders.cols.method'),
              t('orders.cols.status'),
              t('orders.cols.amount'),
              '',
            ]}
            minWidth={900}
          >
            {data.items.map((sale) => {
              const created = new Date(sale.createdAt)
              const billReference = sale.invoiceNumber ?? sale.id.slice(0, 8).toUpperCase()
              return (
                <tr key={sale.id}>
                  <td className="t-mono t-strong">{billReference}</td>
                  <td>{customerLabel(sale, t)}</td>
                  <td className="t-sub">{sale.cashierName ?? t('orders.notRecorded')}</td>
                  <td className="t-mono t-sub">
                    {timeOnly.format(created)}
                    <div className="t-sub">{dateShort.format(created)}</div>
                  </td>
                  <td>{sale.payments.map((p) => enumLabel(t, 'method', p.method)).join(', ') || '-'}</td>
                  <td>
                    <span className={`badge b-${STATUS_TONE[sale.status.toLowerCase()] ?? 'grey'}`}>{enumLabel(t, 'status', sale.status)}</span>
                  </td>
                  <td className="num t-strong">
                    {money(Number(sale.totalAmount))}
                  </td>
                  <td>
                    <Link className="btn btn-sm" href={`/app/orders/${encodeURIComponent(sale.id)}`}>
                      {t('orders.view')}
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
  const t = useT()
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
      <span>{t('orders.showing', { shown, total })}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm" disabled={!previous} onClick={onPrevious}>
          {t('orders.firstPage')}
        </button>
        <button className="btn btn-sm" disabled={!next} onClick={onNext}>
          {t('orders.nextPage')}
        </button>
      </div>
    </div>
  )
}
