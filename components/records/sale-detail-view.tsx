'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getAuthenticatedSale, type Sale } from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, CardPad, DataTable, KpiRow, PageHead, type BadgeTone, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT } from '@/lib/i18n/i18n'

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: 'green',
  paid: 'green',
  refunded: 'blue',
  cancelled: 'red',
  voided: 'red',
}

function titleFor(t: ReturnType<typeof useT>, sale: Sale): string {
  return t('records.saleDetail.title', { number: sale.id.slice(0, 8).toUpperCase() })
}

function lineDisplay(t: ReturnType<typeof useT>, line: Sale['lines'][number]): { title: string; detail: string | null } {
  const variantDetail = [line.size, line.color, line.material].filter(Boolean).join(' / ')
  const detail = [variantDetail, line.sku].filter(Boolean).join(' · ')
  return {
    title: line.productName ?? t('records.saleDetail.productUnavailable'),
    detail: detail || null,
  }
}

function customerLabel(t: ReturnType<typeof useT>, sale: Sale): string {
  const customer = sale.customer
  return customer?.name
    ?? customer?.billingName
    ?? customer?.phone
    ?? customer?.email
    ?? (sale.customerId ? t('records.saleDetail.customerLinked') : t('records.saleDetail.walkIn'))
}

export function SaleDetailView({ saleId }: { saleId: string }) {
  const { money, dateLocale, appPath } = useAppRegion()
  const t = useT()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSale(await getAuthenticatedSale(saleId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('records.errors.saleLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch the sale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <>
        <PageHead title={t('records.saleDetail.billDetails')} actions={<Link className="btn" href={appPath('/app/orders')}><ArrowLeft size={15} /> {t('records.saleDetail.salesBills')}</Link>} />
        <Card><LoadingState label={t('records.saleDetail.loading')} /></Card>
      </>
    )
  }

  if (error || !sale) {
    return (
      <>
        <PageHead title={t('records.saleDetail.billDetails')} actions={<Link className="btn" href={appPath('/app/orders')}><ArrowLeft size={15} /> {t('records.saleDetail.salesBills')}</Link>} />
        <Card><ErrorState message={error ?? t('records.errors.saleLoad')} onRetry={() => void load()} /></Card>
      </>
    )
  }

  const itemCount = sale.lines.reduce((sum, line) => sum + line.quantity, 0)
  const statusTone = STATUS_TONE[sale.status.toLowerCase()] ?? 'grey'
  const customerContact = [sale.customer?.phone, sale.customer?.email].filter(Boolean).join(' · ')
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
  const metrics: KpiItem[] = [
    { label: t('records.saleDetail.status'), value: <Badge tone={statusTone}>{enumLabel(t, 'status', sale.status)}</Badge>, meta: t('records.saleDetail.serverStatus') },
    { label: t('records.saleDetail.recorded'), value: dateTime.format(new Date(sale.createdAt)), meta: t('records.saleDetail.serverTimestamp') },
    { label: t('records.saleDetail.items'), value: String(itemCount), meta: `${sale.lines.length} ${sale.lines.length === 1 ? t('records.saleDetail.itemOne') : t('records.saleDetail.itemMany')}` },
    { label: t('records.saleDetail.total'), value: money(Number(sale.totalAmount)), meta: t('records.saleDetail.serverTotal'), lead: true },
  ]

  return (
    <>
      <PageHead
        title={titleFor(t, sale)}
        sub={t('records.saleDetail.persistedBill', { id: sale.id })}
        actions={<Link className="btn" href={appPath('/app/orders')}><ArrowLeft size={15} /> {t('records.saleDetail.salesBills')}</Link>}
      />

      <KpiRow items={metrics} cols={4} />

      <Card>
        <CardHead title={t('records.saleDetail.customerCashier')} sub={t('records.saleDetail.peopleAttached')} />
        <CardPad>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <div>
              <div className="t-sub" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('records.saleDetail.customer')}</div>
              <div className="t-strong" style={{ marginTop: 6 }}>{customerLabel(t, sale)}</div>
              {customerContact ? <div className="t-sub" style={{ marginTop: 4 }}>{customerContact}</div> : null}
            </div>
            <div>
              <div className="t-sub" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('records.saleDetail.cashier')}</div>
              <div className="t-strong" style={{ marginTop: 6 }}>{sale.cashierName ?? t('records.saleDetail.notRecorded')}</div>
            </div>
          </div>
        </CardPad>
      </Card>

      <div className="split-2">
        <Card>
          <CardHead title={t('records.saleDetail.lineItems')} sub={t('records.saleDetail.lineItemsSub')} />
          {sale.lines.length === 0 ? (
            <EmptyState title={t('records.saleDetail.noLineItems')} body={t('records.saleDetail.noLineItemsBody')} />
          ) : (
            <DataTable cols={[t('records.saleDetail.cols.productSku'), t('records.saleDetail.cols.quantity'), t('records.saleDetail.cols.price'), t('records.saleDetail.discount'), t('records.saleDetail.tax'), t('records.saleDetail.cols.total')]} minWidth={720}>
              {sale.lines.map((line) => {
                const display = lineDisplay(t, line)
                return (
                  <tr key={line.id}>
                    <td title={line.variantId}>
                      <div className="t-strong">{display.title}</div>
                      {display.detail && <div className="t-sub" style={{ fontSize: 11 }}>{display.detail}</div>}
                    </td>
                    <td className="num">{line.quantity}</td>
                    <td className="num">{money(Number(line.unitPrice))}</td>
                    <td className="num">{Number(line.discountAmount) > 0 ? `−${money(Number(line.discountAmount))}` : '-'}</td>
                    <td>{line.isTaxable ? t('records.saleDetail.yes') : t('records.saleDetail.no')}</td>
                    <td className="num t-strong">{money(Number(line.lineTotal))}</td>
                  </tr>
                )
              })}
            </DataTable>
          )}
        </Card>

        <Card>
          <CardHead title={t('records.saleDetail.paymentRecords')} sub={t('records.saleDetail.paymentRecordsSub')} />
          {sale.payments.length === 0 ? (
            <EmptyState title={t('records.saleDetail.noPayments')} body={t('records.saleDetail.noPaymentsBody')} />
          ) : (
            <DataTable cols={[t('records.payments.cols.method'), t('records.saleDetail.direction'), t('records.saleDetail.reference'), t('records.payments.cols.amount')]} minWidth={520}>
              {sale.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{enumLabel(t, 'method', payment.method)}</td>
                  <td><Badge tone={payment.direction === 'refund' ? 'blue' : 'green'}>{payment.direction === 'refund' ? t('records.payments.refunded') : t('records.payments.payment')}</Badge></td>
                  <td className="t-mono t-sub">{payment.referenceCode ?? '-'}</td>
                  <td className="num t-strong">{money(Number(payment.amount))}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>
      </div>

      <Card>
        <CardHead title={t('records.saleDetail.amountSummary')} sub={t('records.saleDetail.authoritativeTotals')} />
        <CardPad>
          <div style={{ display: 'grid', gap: 10, maxWidth: 520, marginLeft: 'auto' }}>
            <SummaryRow label={t('records.saleDetail.subtotal')} value={sale.subtotal} />
            <SummaryRow label={t('records.saleDetail.discount')} value={`-${sale.discountAmount}`} />
            <SummaryRow label={t('records.saleDetail.tax')} value={sale.taxAmount} />
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
              <SummaryRow label={t('records.saleDetail.total')} value={sale.totalAmount} strong />
            </div>
          </div>
        </CardPad>
      </Card>
    </>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const { money } = useAppRegion()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: strong ? 16 : 13.5, fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span className="num">{money(Number(value))}</span>
    </div>
  )
}
