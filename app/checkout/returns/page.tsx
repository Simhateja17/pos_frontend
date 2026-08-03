'use client'

import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Card, CardHead, CardPad, Checkbox, DataTable, Modal, PageHead, SearchField, Tabs } from '@/components/couture/ui'
import { EmptyState } from '@/components/couture/states'

type Sale = {
  id: string
  customerId: string | null
  totalAmount: string
  createdAt: string
  lines: {
    id: string
    variantId: string
    quantity: number
    unitPrice: string
    lineTotal: string
  }[]
  payments: {
    method: 'cash' | 'card' | 'check'
    direction: 'payment' | 'refund'
    amount: string
    referenceCode: string | null
  }[]
}

type ReturnResponse = {
  saleId: string
  refundTotal: string
}

const LOOKUP_TABS = [
  { label: 'By receipt number', value: 'receipt' as const },
  { label: 'By customer', value: 'customer' as const },
]

const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."
const NO_MATCH =
  'No matching sale found. Check the receipt number or try searching by customer instead.'

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.clone().json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

function money(value: number | string) {
  return Number(value).toFixed(2)
}

function ReturnsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shiftId = searchParams.get('shiftId')
  const [lookupTab, setLookupTab] = useState<'receipt' | 'customer'>('receipt')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [matches, setMatches] = useState<Sale[]>([])
  const [sale, setSale] = useState<Sale | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successAmount, setSuccessAmount] = useState<string | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  const selectedLines = useMemo(
    () =>
      sale?.lines
        .filter((line) => (quantities[line.id] ?? 0) > 0)
        .map((line) => ({
          saleLineItemId: line.id,
          quantity: quantities[line.id],
          amount: (Number(line.lineTotal) / line.quantity) * quantities[line.id],
        })) ?? [],
    [quantities, sale],
  )
  const refundTotal = selectedLines.reduce((sum, line) => sum + line.amount, 0)
  const originalPayments =
    sale?.payments.filter((payment) => payment.direction === 'payment') ?? []
  const originalMethods = [...new Set(originalPayments.map((payment) => payment.method))]

  function selectSale(selected: Sale) {
    setSale(selected)
    setSuccessAmount(null)
    setIsConfirmationOpen(false)
    setError(null)
    setQuantities(Object.fromEntries(selected.lines.map((line) => [line.id, 0])))
  }

  async function lookup(query: { receiptNumber?: string; customerSearch?: string }) {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setSale(null)
    setMatches([])
    const headers = await authHeader()
    const result = await apiClient.GET('/sales', { params: { query }, headers })
    setIsLoading(false)
    if (result.error) {
      setError(LOAD_ERROR)
      return
    }
    const found = result.data as Sale[]
    setMatches(found)
    if (found.length === 1) selectSale(found[0])
  }

  function updateQuantity(lineId: string, maximum: number, next: number) {
    setQuantities((current) => ({
      ...current,
      [lineId]: Math.max(0, Math.min(maximum, Math.floor(next || 0))),
    }))
  }

  function buildRefundPayments() {
    const positivePayments = originalPayments.filter((payment) => Number(payment.amount) > 0)
    const paidTotal = positivePayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    let assigned = 0
    return positivePayments.map((payment, index) => {
      const isLast = index === positivePayments.length - 1
      const amount = isLast
        ? refundTotal - assigned
        : Math.round((refundTotal * Number(payment.amount) * 100) / paidTotal) / 100
      assigned += amount
      return {
        method: payment.method,
        amount: money(amount),
        ...(payment.referenceCode ? { referenceCode: payment.referenceCode } : {}),
      }
    })
  }

  function requestRefund(event: FormEvent) {
    event.preventDefault()
    if (!sale || !shiftId || selectedLines.length === 0 || originalPayments.length === 0) return
    setError(null)
    setIsConfirmationOpen(true)
  }

  async function processRefund() {
    if (!sale || !shiftId || selectedLines.length === 0 || originalPayments.length === 0) return
    setIsSubmitting(true)
    setError(null)
    const headers = await authHeader()
    const result = await apiClient.POST('/returns', {
      body: {
        saleId: sale.id,
        shiftId,
        lines: selectedLines.map(({ saleLineItemId, quantity }) => ({
          saleLineItemId,
          quantity,
        })),
        refundPayments: buildRefundPayments(),
      },
      headers,
    })
    setIsSubmitting(false)
    if (result.error) {
      setError(await responseError(result.response, 'Could not process this refund.'))
      return
    }
    const response = (await result.response?.clone().json()) as ReturnResponse | undefined
    if (!response?.refundTotal) {
      setError('The refund was accepted, but its confirmed amount could not be read. Check the sale before retrying.')
      return
    }
    setSuccessAmount(response.refundTotal)
    setIsConfirmationOpen(false)
  }

  return (
    <>
      <PageHead
        title="Returns & Exchange"
        sub="Locate the receipt, choose only the items being returned, and refund the original tender."
      />

      {!shiftId && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 18,
            background: 'var(--warning-soft)',
            color: '#8f5f0c',
            fontSize: 13,
          }}
        >
          <span>An open shift is required before a return can be processed.</span>
          <button className="btn btn-sm" type="button" onClick={() => router.push('/shifts')}>
            Open a shift
          </button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 18,
            background: 'var(--danger-soft)',
            color: '#8f2323',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <Card>
        <CardHead title="Sale lookup" sub="Search by receipt number or by the customer attached to the sale." />
        <CardPad>
          <Tabs items={LOOKUP_TABS} active={lookupTab} onSelect={setLookupTab} ariaLabel="Search sales by" />

          {lookupTab === 'receipt' ? (
            <form
              style={{ display: 'flex', gap: 10, marginTop: 16 }}
              onSubmit={(event) => {
                event.preventDefault()
                if (receiptNumber.trim()) void lookup({ receiptNumber: receiptNumber.trim() })
              }}
            >
              <SearchField
                value={receiptNumber}
                onChange={setReceiptNumber}
                placeholder="Receipt number"
                ariaLabel="Receipt number"
                flex
              />
              <button className="btn btn-pri" type="submit" disabled={!receiptNumber.trim() || isLoading}>
                Search
              </button>
            </form>
          ) : (
            <form
              style={{ display: 'flex', gap: 10, marginTop: 16 }}
              onSubmit={(event) => {
                event.preventDefault()
                if (customerSearch.trim()) void lookup({ customerSearch: customerSearch.trim() })
              }}
            >
              <SearchField
                value={customerSearch}
                onChange={setCustomerSearch}
                placeholder="Customer name, phone, or email"
                ariaLabel="Customer name, phone, or email"
                flex
              />
              <button className="btn btn-pri" type="submit" disabled={!customerSearch.trim() || isLoading}>
                Search
              </button>
            </form>
          )}

          {hasSearched && !isLoading && matches.length === 0 && !error && (
            <p style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>{NO_MATCH}</p>
          )}
          {matches.length > 1 && !sale && (
            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10,
              }}
            >
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => selectSale(match)}
                  style={{
                    textAlign: 'left',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 14,
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'border-color .15s',
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>{match.id}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(match.createdAt).toLocaleString()} · ₹{money(match.totalAmount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardPad>
      </Card>

      {sale && (
        <form onSubmit={requestRefund}>
          <Card style={{ marginTop: 18 }}>
            <CardHead title="Select items to return" sub={`Receipt ${sale.id}`} />
            <CardPad>
              <DataTable cols={['Return', 'Item', 'Original qty', 'Return qty', { label: 'Estimated refund', align: 'right' }]}>
                {sale.lines.map((line) => {
                  const quantity = quantities[line.id] ?? 0
                  return (
                    <tr key={line.id}>
                      <td>
                        <div
                          role="checkbox"
                          aria-checked={quantity > 0}
                          tabIndex={0}
                          onClick={() => updateQuantity(line.id, line.quantity, quantity > 0 ? 0 : 1)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              updateQuantity(line.id, line.quantity, quantity > 0 ? 0 : 1)
                            }
                          }}
                          style={{ cursor: 'pointer', display: 'inline-flex' }}
                        >
                          <Checkbox on={quantity > 0} />
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{line.variantId}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>₹{money(line.unitPrice)} each</span>
                      </td>
                      <td>{line.quantity}</td>
                      <td>
                        <input
                          className="fld-input"
                          style={{ width: 70 }}
                          type="number"
                          min={0}
                          max={line.quantity}
                          value={quantity}
                          onChange={(event) => updateQuantity(line.id, line.quantity, Number(event.target.value))}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{money((Number(line.lineTotal) / line.quantity) * quantity)}
                      </td>
                    </tr>
                  )
                })}
              </DataTable>

              <div
                style={{
                  marginTop: 18,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 16,
                  background: 'var(--bg)',
                }}
              >
                <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  Refund tender: {originalMethods.join(', ') || 'unavailable'}. The server validates the original sale,
                  return entitlement, and final refund before anything is recorded.
                </p>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>
                      Selected-line estimate
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--danger)', marginTop: 4 }}>
                      ₹{money(refundTotal)}
                    </div>
                  </div>
                  <button
                    className="btn btn-pri"
                    type="submit"
                    disabled={
                      !shiftId ||
                      selectedLines.length === 0 ||
                      originalPayments.length === 0 ||
                      isSubmitting ||
                      Boolean(successAmount)
                    }
                  >
                    {isSubmitting ? 'Processing…' : 'Review refund'}
                  </button>
                </div>
              </div>
            </CardPad>
          </Card>
        </form>
      )}

      {successAmount && sale && (
        <Card style={{ marginTop: 18 }}>
          <CardPad style={{ background: 'var(--success-soft)', borderRadius: 'var(--r)' }}>
            <p style={{ fontWeight: 700, color: '#0f8f63', fontSize: 14 }}>
              Refund of ₹{successAmount} recorded by the server.
            </p>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-2)' }}>
              Return processed. Start a new sale to complete the exchange.
            </p>
            <button
              className="btn btn-pri"
              type="button"
              style={{ marginTop: 14 }}
              onClick={() => router.push(sale.customerId ? `/checkout?customerId=${sale.customerId}` : '/checkout')}
            >
              Start new sale
            </button>
          </CardPad>
        </Card>
      )}

      {isConfirmationOpen && sale && (
        <Modal
          title="Confirm refund request"
          onClose={() => setIsConfirmationOpen(false)}
          footer={
            <>
              <button className="btn" type="button" disabled={isSubmitting} onClick={() => setIsConfirmationOpen(false)}>
                Keep return open
              </button>
              <button
                className="btn btn-pri"
                type="button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                onClick={() => void processRefund()}
              >
                {isSubmitting ? 'Processing refund…' : 'Confirm refund request'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Refund ₹{money(refundTotal)} for invoice {sale.id}? This sends the selected {selectedLines.length} line
            {selectedLines.length === 1 ? '' : 's'} to the server for validation, reverses the original tender (
            {originalMethods.join(', ')}), and returns approved units to stock.
          </p>
        </Modal>
      )}
    </>
  )
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<EmptyState title="Loading returns…" />}>
      <ReturnsPageInner />
    </Suspense>
  )
}
