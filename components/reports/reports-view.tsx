'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Info } from 'lucide-react'
import {
  type ReportCatalog,
  type ReportKind,
  type ReportTable,
  getAuthenticatedReport,
  getAuthenticatedReportCatalog,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, DataTable, PageHead, Seg, SectionLabel } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { MessageKey, useT } from '@/lib/i18n/i18n'

const GROUPS = ['sales', 'payments', 'purchases', 'stock', 'staff'] as const

type Group = (typeof GROUPS)[number]

const REPORT_COPY: Record<ReportKind, { title: MessageKey; description: MessageKey }> = {
  'sales-by-day': { title: 'reports.reportTitles.salesByDay', description: 'reports.reportDescriptions.salesByDay' },
  'sales-by-product': { title: 'reports.reportTitles.salesByProduct', description: 'reports.reportDescriptions.salesByProduct' },
  'sales-by-category': { title: 'reports.reportTitles.salesByCategory', description: 'reports.reportDescriptions.salesByCategory' },
  'sales-by-staff': { title: 'reports.reportTitles.salesByStaff', description: 'reports.reportDescriptions.salesByStaff' },
  'payments-by-method': { title: 'reports.reportTitles.paymentsByMethod', description: 'reports.reportDescriptions.paymentsByMethod' },
  'refunds-by-method': { title: 'reports.reportTitles.refundsByMethod', description: 'reports.reportDescriptions.refundsByMethod' },
  'shift-tender-reconciliation': { title: 'reports.reportTitles.shiftTenderReconciliation', description: 'reports.reportDescriptions.shiftTenderReconciliation' },
  'purchases-by-supplier': { title: 'reports.reportTitles.purchasesBySupplier', description: 'reports.reportDescriptions.purchasesBySupplier' },
  'goods-received-by-day': { title: 'reports.reportTitles.goodsReceivedByDay', description: 'reports.reportDescriptions.goodsReceivedByDay' },
  'purchase-cost-by-product': { title: 'reports.reportTitles.purchaseCostByProduct', description: 'reports.reportDescriptions.purchaseCostByProduct' },
  'stock-valuation': { title: 'reports.reportTitles.stockValuation', description: 'reports.reportDescriptions.stockValuation' },
  'stock-movements': { title: 'reports.reportTitles.stockMovements', description: 'reports.reportDescriptions.stockMovements' },
  'staff-exceptions': { title: 'reports.reportTitles.staffExceptions', description: 'reports.reportDescriptions.staffExceptions' },
}

const REPORT_COLUMN_KEYS: Record<string, MessageKey> = {
  day: 'reports.columns.day', bills: 'reports.columns.bills', units: 'reports.columns.units', revenue: 'reports.columns.revenue', tax: 'reports.columns.tax', imported_bills: 'reports.columns.imported_bills',
  label: 'reports.columns.labelProduct', sku: 'reports.columns.sku', discount: 'reports.columns.discount', staff: 'reports.columns.staff', discounted_bills: 'reports.columns.discounted_bills', discount_value: 'reports.columns.discount_value', discount_rate: 'reports.columns.discount_rate',
  method: 'reports.columns.method', refund_count: 'reports.columns.refund_count', refund_amount: 'reports.columns.refund_amount', collected_count: 'reports.columns.collected_count', collected_amount: 'reports.columns.collected_amount', refund_value: 'reports.columns.refund_value', net_amount: 'reports.columns.net_amount',
  shift_id: 'reports.columns.shift_id', cashier: 'reports.columns.cashier', terminal: 'reports.columns.terminal', opening_cash: 'reports.columns.opening_cash', cash_sales: 'reports.columns.cash_sales', cash_refunds: 'reports.columns.cash_refunds', expected_cash: 'reports.columns.expected_cash', counted_cash: 'reports.columns.counted_cash', variance: 'reports.columns.variance', card_sales: 'reports.columns.card_sales', card_refunds: 'reports.columns.card_refunds', check_sales: 'reports.columns.check_sales', check_refunds: 'reports.columns.check_refunds', other_sales: 'reports.columns.other_sales', other_refunds: 'reports.columns.other_refunds', status: 'reports.columns.status',
  supplier: 'reports.columns.supplier', po_count: 'reports.columns.po_count', ordered_value: 'reports.columns.ordered_value', received_quantity: 'reports.columns.received_quantity', received_value: 'reports.columns.received_value', outstanding_quantity: 'reports.columns.outstanding_quantity', outstanding_value: 'reports.columns.outstanding_value', draft_count: 'reports.columns.draft_count', sent_count: 'reports.columns.sent_count', partial_count: 'reports.columns.partial_count', received_count: 'reports.columns.received_count', cancelled_count: 'reports.columns.cancelled_count',
  receipt_date: 'reports.columns.receipt_date', po_number: 'reports.columns.po_number', receipt_count: 'reports.columns.receipt_count', receipt_cost: 'reports.columns.receipt_cost', over_received: 'reports.columns.over_received', product: 'reports.columns.product', variant: 'reports.columns.variant', total_receipt_cost: 'reports.columns.total_receipt_cost', weighted_average_received_unit_cost: 'reports.columns.weighted_average_received_unit_cost', current_moving_average_cost: 'reports.columns.current_moving_average_cost', on_hand: 'reports.columns.on_hand', unit_cost: 'reports.columns.unit_cost', cost_value: 'reports.columns.cost_value', unit_price: 'reports.columns.unit_price', retail_value: 'reports.columns.retail_value', movement: 'reports.columns.movement', change: 'reports.columns.change', reason: 'reports.columns.reason',
}

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function cell(value: string | number | null, money: boolean, format: (value: string | number) => string, missing: string): string {
  if (value === null || value === undefined) return missing
  if (money) return format(Number(value))
  return String(value)
}

/**
 * CSV of exactly what is on screen: same columns, same rows, unformatted
 * numbers so a spreadsheet can total them. Built from the report the server
 * returned, so an export can never disagree with the table above it.
 */
function toCsv(report: ReportTable): string {
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [report.columns.map((column) => escape(column.label)).join(',')]
  for (const row of report.rows) {
    lines.push(report.columns.map((column) => escape(row[column.key])).join(','))
  }
  if (report.totals) {
    lines.push(report.columns.map((column) => escape(report.totals?.[column.key])).join(','))
  }
  return lines.join('\n')
}

function download(report: ReportTable) {
  const blob = new Blob([toCsv(report)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${report.id}-${report.range.from}-to-${report.range.to}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsView() {
  const { money, dateLocale, pack } = useAppRegion()
  const t = useT()
  const [catalog, setCatalog] = useState<ReportCatalog | null>(null)
  const [group, setGroup] = useState<Group>('sales')
  const [kind, setKind] = useState<ReportKind>('sales-by-day')
  const [from, setFrom] = useState(isoDaysAgo(29))
  const [to, setTo] = useState(isoDaysAgo(0))
  const [includeImported, setIncludeImported] = useState(true)

  const [report, setReport] = useState<ReportTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setCatalog(await getAuthenticatedReportCatalog())
      } catch {
        setCatalog(null)
      }
    })()
  }, [])

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      setReport(
        await getAuthenticatedReport({ kind, from, to, includeImported: includeImported ? 'true' : 'false' }),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('reports.error'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch the report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, from, to, includeImported])

  useEffect(() => {
    void run()
  }, [run])

  const inGroup = useMemo(
    () => (catalog?.reports ?? []).filter((entry) => entry.group === group),
    [catalog, group],
  )

  function selectGroup(next: Group) {
    setGroup(next)
    const first = (catalog?.reports ?? []).find((entry) => entry.group === next)
    if (first) setKind(first.kind)
  }

  const groupItems = GROUPS.map((value) => ({ value, label: t(`reports.groups.${value}` as MessageKey) }))
  const reportCopy = (kindValue: string) => REPORT_COPY[kindValue as ReportKind]
  const formatReportDate = (value: string) => new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: pack.timeZone }).format(new Date(`${value}T00:00:00`))
  const reportTitle = report?.id ? reportCopy(report.id)?.title : undefined
  const reportDescription = report?.id ? reportCopy(report.id)?.description : undefined

  return (
    <>
      <PageHead
        title={t('reports.title')}
        sub={t('reports.subtitle')}
        actions={
          <button
            className="btn btn-grad"
            type="button"
            disabled={!report || report.rows.length === 0}
            onClick={() => report && download(report)}
          >
            <Download size={15} /> {t('reports.exportCsv')}
          </button>
        }
      />

      <Card>
        <CardHead title={t('reports.choose')} right={<Seg items={groupItems} active={group} onSelect={selectGroup} ariaLabel={t('reports.groupLabel')} />} />
        <CardPad style={{ paddingTop: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {inGroup.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                className={entry.kind === kind ? 'btn btn-sm btn-grad' : 'btn btn-sm btn-ghost'}
                onClick={() => setKind(entry.kind)}
              >
                {REPORT_COPY[entry.kind] ? t(REPORT_COPY[entry.kind].title) : entry.title}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <SectionLabel>{t('reports.from')}</SectionLabel>
              <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <SectionLabel>{t('reports.to')}</SectionLabel>
              <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={includeImported}
                onChange={(event) => setIncludeImported(event.target.checked)}
              />
              {t('reports.includeImported')}
            </label>
          </div>
        </CardPad>
      </Card>

      <Card>
        {loading ? (
          <CardPad>
            <LoadingState label={t('reports.running')} rows={6} />
          </CardPad>
        ) : error ? (
          <CardPad>
            <ErrorState message={error} onRetry={() => void run()} />
          </CardPad>
        ) : !report ? null : (
          <>
            <CardHead
              title={reportTitle ? t(reportTitle) : report.title}
              sub={`${reportDescription ? t(reportDescription) : report.description} · ${formatReportDate(report.range.from)} – ${formatReportDate(report.range.to)}`}
            />
            {report.unavailable.length > 0 && (
              <CardPad style={{ paddingTop: 0, paddingBottom: 4 }}>
                {report.unavailable.map((entry) => (
                  <p key={entry.what} style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 6 }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>{entry.what}:</strong> {entry.reason}
                    </span>
                  </p>
                ))}
              </CardPad>
            )}
            {report.rows.length === 0 ? (
              <CardPad>
                <EmptyState
                  title={t('reports.emptyTitle')}
                  body={t('reports.emptyBody')}
                />
              </CardPad>
            ) : (
              <DataTable
                cols={report.columns.map((column) => REPORT_COLUMN_KEYS[column.key] ? t(REPORT_COLUMN_KEYS[column.key]) : column.label)}
              >
                {report.rows.map((row, index) => (
                  <tr key={index}>
                    {report.columns.map((column) => (
                      <td key={column.key}>
                        {cell(row[column.key] ?? null, column.money, money, t('reports.missing'))}
                      </td>
                    ))}
                  </tr>
                ))}
                {report.totals && (
                  <tr style={{ fontWeight: 600 }}>
                    {report.columns.map((column) => (
                      <td key={column.key}>
                        {report.totals?.[column.key] === undefined
                          ? ''
                          : cell(report.totals[column.key] ?? null, column.money, money, t('reports.missing'))}
                      </td>
                    ))}
                  </tr>
                )}
              </DataTable>
            )}
          </>
        )}
      </Card>
    </>
  )
}
