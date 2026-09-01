'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_FAILURE_COPY =
  "Couldn't send the bill email. The bill is saved. Try emailing it again from Bill history."

export interface ReceiptLine {
  variantId: string
  quantity: number
  unitPrice: string
  lineTotal: string
  name?: string
}

export interface ReceiptSale {
  id: string
  createdAt: string
  subtotal: string
  discountAmount: string
  taxAmount: string
  totalAmount: string
  cashReceived: string | null
  changeDue: string
  lines: ReceiptLine[]
  payments?: {
    method: 'cash' | 'card' | 'check' | 'upi' | 'credit'
    direction: 'payment' | 'refund'
    amount: string
    referenceCode: string | null
  }[]
}

type ReceiptPayment = NonNullable<ReceiptSale['payments']>[number]

const PAYMENT_LABELS: Record<ReceiptPayment['method'], string> = {
  cash: 'Cash',
  card: 'Card',
  check: 'Check',
  upi: 'UPI',
  credit: 'Credit',
}

const INR = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Server money strings are printed as-is when they aren't parseable numbers —
 *  the receipt never substitutes a computed figure for a server one. */
function money(value: string): string {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? `${INR.format(parsed)}` : value
}

function formatStamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Receipt({ sale, businessName }: { sale: ReceiptSale; businessName: string }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const printFn = useReactToPrint({ contentRef })
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('80')
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const payments = sale.payments ?? []

  async function handleEmailReceipt() {
    setIsSending(true)
    setEmailStatus(null)
    const headers = await authHeaders()

    // Real backend call: POST /sales/:id/resend-receipt (03-05) resolves the
    // target email (the entered address, or the sale's on-file customer
    // email if left blank) and awaits an actual sendReceiptEmail() call. The
    // copy below reflects that call's REAL outcome, never a fabricated one.
    const { data, error } = await apiClient.POST('/sales/{saleId}/resend-receipt', {
      params: { path: { saleId: sale.id } },
      body: email.trim() ? { email: email.trim() } : {},
      headers,
    })

    setIsSending(false)

    if (error || !data) {
      setEmailStatus(EMAIL_FAILURE_COPY)
      return
    }

    setEmailStatus(`Bill sent to ${data.email}.`)
  }

  return (
    <section aria-label="Completed bill" className="rounded-xl border bg-card p-4 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Bill confirmed</p>
          <h2 className="font-heading text-xl font-semibold">Bill #{sale.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">₹{sale.totalAmount} recorded by the server.</p>
        </div>
        <span className="rounded-full bg-[#E8F7F0] px-3 py-1 text-sm font-semibold text-[#047857]">Completed</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex min-h-11 overflow-hidden rounded-md border" aria-label="Bill paper width" style={{ borderColor: '#CBD5E1' }}>
          {(['58', '80'] as const).map((width) => (
            <button
              key={width}
              type="button"
              aria-pressed={paperWidth === width}
              onClick={() => setPaperWidth(width)}
              className="px-3 text-sm font-medium"
              style={{ background: paperWidth === width ? '#E6FFFB' : '#FFFFFF', color: paperWidth === width ? '#0F766E' : '#475569' }}
            >
              {width} mm
            </button>
          ))}
        </div>
        <Button type="button" onClick={() => printFn()} style={{ minHeight: 44 }}>
          Print / Save PDF
        </Button>
        <a
          href={`/app/documents?saleId=${encodeURIComponent(sale.id)}`}
          className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium"
          style={{ borderColor: '#CBD5E1', color: '#0F766E' }}
        >
          Open Tax Invoice
        </a>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter customer email"
          style={{ minHeight: 44, maxWidth: 240 }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleEmailReceipt}
          disabled={isSending}
          style={{ minHeight: 44 }}
        >
          Email bill
        </Button>
      </div>
      {emailStatus && (
        <p className="mt-2 text-sm" aria-live="polite" style={{ color: '#64748B' }}>
          {emailStatus}
        </p>
      )}
      <div className="mt-4 border-t pt-3 text-sm" style={{ borderColor: '#E2E8F0' }}>
        <p className="font-semibold text-slate-700">Payment recorded</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {payments.map((payment, index) => (
            <span key={`${payment.method}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {PAYMENT_LABELS[payment.method]} ₹{payment.amount}
              {payment.referenceCode ? ` · ${payment.referenceCode}` : ''}
            </span>
          ))}
        </div>
        {Number(sale.changeDue) > 0 ? (
          <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-lg font-semibold text-amber-900">
            Return ₹{money(sale.changeDue)} change
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        WhatsApp bill delivery is unavailable for this store. Print or email the confirmed bill instead.
      </p>

      {/* Off-screen, natural-scale, 80mm-print-ready container: same sr-only
          pattern as Phase 2's label-sheet container (frontend/app/app/inventory/labels/page.tsx).
          Kept in the DOM at all times so contentRef always has content to print. */}
      <div className="sr-only">
        <div ref={contentRef} className={`receipt-print receipt-print--${paperWidth}`}>
          <div className="receipt-store">{businessName}</div>
          <div className="receipt-sub">Tax Invoice</div>
          <div className="receipt-rule-strong" />
          <div className="receipt-meta">
            <span>Bill #{sale.id.slice(0, 8)}</span>
            <span>{formatStamp(sale.createdAt)}</span>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-cols">
            <span>ITEM</span>
            <span>AMOUNT (INR)</span>
          </div>
          <div className="receipt-rule-dashed" />
          {sale.lines.map((line) => (
            <div key={line.variantId} className="receipt-item">
              <div className="receipt-item-name">{line.name ?? line.variantId}</div>
              <div className="receipt-item-calc">
                <span>
                  {line.quantity} × {money(line.unitPrice)}
                </span>
                <span className="receipt-amount">{money(line.lineTotal)}</span>
              </div>
            </div>
          ))}
          <div className="receipt-rule-dashed" />
          <div className="receipt-row">
            <span>Subtotal</span>
            <span className="receipt-amount">{money(sale.subtotal)}</span>
          </div>
          <div className="receipt-row">
            <span>Discount</span>
            <span className="receipt-amount">-{money(sale.discountAmount)}</span>
          </div>
          <div className="receipt-row">
            <span>GST</span>
            <span className="receipt-amount">{money(sale.taxAmount)}</span>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-total">
            <span>TOTAL</span>
            <span className="receipt-amount">{money(sale.totalAmount)}</span>
          </div>
          <div className="receipt-rule-strong" />
          {payments.map((payment, index) => (
            <div key={`${payment.method}-${index}`} className="receipt-row">
              <span>
                {PAYMENT_LABELS[payment.method]}
                {payment.referenceCode ? ` · ${payment.referenceCode}` : ''}
              </span>
              <span className="receipt-amount">{money(payment.amount)}</span>
            </div>
          ))}
          {sale.cashReceived ? (
            <>
              <div className="receipt-row"><span>Cash received</span><span className="receipt-amount">{money(sale.cashReceived)}</span></div>
              <div className="receipt-row"><span>Change returned</span><span className="receipt-amount">{money(sale.changeDue)}</span></div>
            </>
          ) : null}
          <div className="receipt-rule-dashed" />
          <div className="receipt-foot">Thank you for shopping with us</div>
        </div>
      </div>
    </section>
  )
}
