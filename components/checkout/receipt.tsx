'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_FAILURE_COPY =
  "Couldn't send the receipt email. The sale is saved — try emailing it again from the receipt lookup."

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
  lines: ReceiptLine[]
}

export function Receipt({ sale, businessName }: { sale: ReceiptSale; businessName: string }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const printFn = useReactToPrint({ contentRef })
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleEmailReceipt() {
    setIsSending(true)
    setEmailStatus(null)
    const headers = await authHeaders()

    // Real backend call — POST /sales/:id/resend-receipt (03-05) resolves the
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

    setEmailStatus(`Receipt sent to ${data.email}.`)
  }

  return (
    <section aria-label="Completed sale receipt" className="rounded-xl border bg-card p-4 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Sale confirmed</p>
          <h2 className="font-heading text-xl font-semibold">Receipt #{sale.id.slice(0, 8)}</h2>
          <p className="text-sm text-muted-foreground">₹{sale.totalAmount} recorded by the server.</p>
        </div>
        <span className="rounded-full bg-[#E8F7F0] px-3 py-1 text-sm font-semibold text-[#047857]">Completed</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => printFn()} style={{ minHeight: 44 }}>
          Print receipt
        </Button>
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
          Email receipt
        </Button>
      </div>
      {emailStatus && (
        <p className="mt-2 text-sm" aria-live="polite" style={{ color: '#64748B' }}>
          {emailStatus}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        WhatsApp receipt delivery is unavailable for this store. Print or email the confirmed receipt instead.
      </p>

      {/* Off-screen, natural-scale, 80mm-print-ready container — same sr-only
          pattern as Phase 2's label-sheet container (frontend/app/app/inventory/labels/page.tsx).
          Kept in the DOM at all times so contentRef always has content to print. */}
      <div className="sr-only">
        <div ref={contentRef} className="receipt-print">
          <div className="receipt-line receipt-bold">{businessName}</div>
          <div className="receipt-line">{new Date(sale.createdAt).toLocaleString()}</div>
          <div className="receipt-line">Receipt #{sale.id.slice(0, 8)}</div>
          <hr />
          {sale.lines.map((line) => (
            <div key={line.variantId} className="receipt-line">
              {line.quantity} x {line.name ?? line.variantId} — ${line.lineTotal}
            </div>
          ))}
          <hr />
          <div className="receipt-line receipt-bold">Subtotal: ${sale.subtotal}</div>
          <div className="receipt-line receipt-bold">Discount: ${sale.discountAmount}</div>
          <div className="receipt-line receipt-bold">Sales tax: ${sale.taxAmount}</div>
          <div className="receipt-total">Total paid: ${sale.totalAmount}</div>
        </div>
      </div>
    </section>
  )
}
