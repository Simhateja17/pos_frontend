'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getAuthenticatedSale, type Sale } from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, CardPad, DataTable, KpiRow, PageHead, type BadgeTone, type KpiItem } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

const PAYMENT_LABELS: Record<Sale['payments'][number]['method'], string> = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  upi: 'UPI',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  completed: 'green',
  paid: 'green',
  refunded: 'blue',
  cancelled: 'red',
  voided: 'red',
}

function titleFor(sale: Sale): string {
  return `Bill ${sale.id.slice(0, 8).toUpperCase()}`
}

export function SaleDetailView({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSale(await getAuthenticatedSale(saleId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That sale is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [saleId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <>
        <PageHead title="Bill details" actions={<Link className="btn" href="/app/orders"><ArrowLeft size={15} /> Sales / Bills</Link>} />
        <Card><LoadingState label="Loading bill details" /></Card>
      </>
    )
  }

  if (error || !sale) {
    return (
      <>
        <PageHead title="Bill details" actions={<Link className="btn" href="/app/orders"><ArrowLeft size={15} /> Sales / Bills</Link>} />
        <Card><ErrorState message={error ?? 'That bill is unavailable right now.'} onRetry={() => void load()} /></Card>
      </>
    )
  }

  const itemCount = sale.lines.reduce((sum, line) => sum + line.quantity, 0)
  const statusTone = STATUS_TONE[sale.status.toLowerCase()] ?? 'grey'
  const metrics: KpiItem[] = [
    { label: 'Status', value: <Badge tone={statusTone}>{sale.status}</Badge>, meta: 'Server status' },
    { label: 'Recorded', value: dateTime.format(new Date(sale.createdAt)), meta: 'Server timestamp' },
    { label: 'Items', value: String(itemCount), meta: `${sale.lines.length} line${sale.lines.length === 1 ? '' : 's'}` },
    { label: 'Total', value: money.format(Number(sale.totalAmount)), meta: 'Server total', lead: true },
  ]

  return (
    <>
      <PageHead
        title={titleFor(sale)}
        sub={`Persisted bill ${sale.id}`}
        actions={<Link className="btn" href="/app/orders"><ArrowLeft size={15} /> Sales / Bills</Link>}
      />

      <KpiRow items={metrics} cols={4} />

      <div className="split-2">
        <Card>
          <CardHead title="Bill lines" sub="Line items and amounts returned by the server" />
          {sale.lines.length === 0 ? (
            <EmptyState title="No line items recorded" body="This bill has no persisted line items." />
          ) : (
            <DataTable cols={['Variant', 'Qty', 'Unit price', 'Discount', 'Taxable', { label: 'Line total', align: 'right' }]} minWidth={720}>
              {sale.lines.map((line) => (
                <tr key={line.id}>
                  <td className="t-mono t-sub" title={line.variantId}>{line.variantId}</td>
                  <td className="num">{line.quantity}</td>
                  <td className="num">{money.format(Number(line.unitPrice))}</td>
                  <td className="num">{Number(line.discountAmount) > 0 ? `−${money.format(Number(line.discountAmount))}` : '-'}</td>
                  <td>{line.isTaxable ? 'Yes' : 'No'}</td>
                  <td className="num t-strong" style={{ textAlign: 'right' }}>{money.format(Number(line.lineTotal))}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <Card>
          <CardHead title="Payment records" sub="Tender rows persisted for this sale" />
          {sale.payments.length === 0 ? (
            <EmptyState title="No payments recorded" body="The server returned no payment rows for this sale." />
          ) : (
            <DataTable cols={['Method', 'Direction', 'Reference', { label: 'Amount', align: 'right' }]} minWidth={520}>
              {sale.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{PAYMENT_LABELS[payment.method]}</td>
                  <td><Badge tone={payment.direction === 'refund' ? 'blue' : 'green'}>{payment.direction}</Badge></td>
                  <td className="t-mono t-sub">{payment.referenceCode ?? '-'}</td>
                  <td className="num t-strong" style={{ textAlign: 'right' }}>{money.format(Number(payment.amount))}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>
      </div>

      <Card>
        <CardHead title="Amount summary" sub="Authoritative totals from the persisted sale" />
        <CardPad>
          <div style={{ display: 'grid', gap: 10, maxWidth: 520, marginLeft: 'auto' }}>
            <SummaryRow label="Subtotal" value={sale.subtotal} />
            <SummaryRow label="Discount" value={`-${sale.discountAmount}`} />
            <SummaryRow label="Tax" value={sale.taxAmount} />
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
              <SummaryRow label="Total" value={sale.totalAmount} strong />
            </div>
          </div>
        </CardPad>
      </Card>
    </>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: strong ? 16 : 13.5, fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span className="num">{money.format(Number(value))}</span>
    </div>
  )
}
