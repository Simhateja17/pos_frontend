'use client'

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedTaxInvoiceForSale, type TaxDocument } from '@/lib/api/authenticated-client'
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
    method: 'cash' | 'card' | 'check' | 'upi'
    direction: 'payment' | 'refund'
    amount: string
    referenceCode: string | null
  }[]
}

type CustomerSuggestion = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

type ReturnResponse = {
  saleId: string
  returnReferenceId: string
  refundTotal: string
  creditNoteId: string
  creditNoteNumber: string
  idempotent: boolean
}

const LOOKUP_TABS = [
  { label: 'By receipt number', value: 'receipt' as const },
  { label: 'By customer', value: 'customer' as const },
]

const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."
const NO_MATCH =
  'No matching bill found. Check the bill number or try searching by customer instead.'

async function responseError(response: Response | undefined, fallback: string) {
  if (!response) return fallback
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
  const requestedShiftId = searchParams.get('shiftId')
  const [shiftId, setShiftId] = useState<string | null>(requestedShiftId)
  const [lookupTab, setLookupTab] = useState<'receipt' | 'customer'>('receipt')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [matches, setMatches] = useState<Sale[]>([])
  const [sale, setSale] = useState<Sale | null>(null)
  const [taxInvoice, setTaxInvoice] = useState<TaxDocument | null>(null)
  const [isLoadingTaxInvoice, setIsLoadingTaxInvoice] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successAmount, setSuccessAmount] = useState<string | null>(null)
  const [creditNote, setCreditNote] = useState<{ id: string; number: string } | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [returnReferenceId, setReturnReferenceId] = useState<string>(() => crypto.randomUUID())
  const skipNextCustomerSuggestionFetch = useRef(false)

  useEffect(() => {
    if (requestedShiftId) {
      setShiftId(requestedShiftId)
      return
    }
    void authHeaders()
      .then((headers) => apiClient.GET('/shifts/current', { headers }))
      .then((result) => setShiftId(result.data?.shift?.id ?? null))
      .catch(() => setShiftId(null))
  }, [requestedShiftId])

  useEffect(() => {
    const query = customerSearch.trim()
    if (lookupTab !== 'customer' || query.length < 2) {
      skipNextCustomerSuggestionFetch.current = false
      setCustomerSuggestions([])
      setIsLoadingSuggestions(false)
      return
    }

    // Selecting a suggestion fills the field with the full customer name and
    // immediately performs the sale lookup. Do not start a second suggestion
    // request for that programmatic field update.
    if (skipNextCustomerSuggestionFetch.current) {
      skipNextCustomerSuggestionFetch.current = false
      setCustomerSuggestions([])
      setIsLoadingSuggestions(false)
      return
    }

    let active = true
    const timer = window.setTimeout(() => {
      setIsLoadingSuggestions(true)
      void authHeaders()
        .then((headers) => apiClient.GET('/customers', { params: { query: { search: query } }, headers }))
        .then((result) => {
          if (!active) return
          setCustomerSuggestions(result.error ? [] : (result.data ?? []))
        })
        .catch(() => {
          if (active) setCustomerSuggestions([])
        })
        .finally(() => {
          if (active) setIsLoadingSuggestions(false)
        })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [customerSearch, lookupTab])

  useEffect(() => {
    if (!sale) {
      setTaxInvoice(null)
      return
    }
    let active = true
    setIsLoadingTaxInvoice(true)
    void getAuthenticatedTaxInvoiceForSale(sale.id)
      .then((invoice) => {
        if (active) setTaxInvoice(invoice)
      })
      .catch(() => {
        if (active) setTaxInvoice(null)
      })
      .finally(() => {
        if (active) setIsLoadingTaxInvoice(false)
      })
    return () => {
      active = false
    }
  }, [sale])

  const selectedLines = useMemo(
    () =>
      sale?.lines
        .filter((line) => (quantities[line.id] ?? 0) > 0)
        .map((line) => ({
          saleLineItemId: line.id,
          quantity: quantities[line.id],
          amount: (() => {
            const invoiceLine = taxInvoice?.lines.find((candidate) => candidate.saleLineItemId === line.id)
            return invoiceLine
              ? (Number(invoiceLine.lineTotal) / Number(invoiceLine.quantity)) * quantities[line.id]
              : (Number(line.lineTotal) / line.quantity) * quantities[line.id]
          })(),
        })) ?? [],
    [quantities, sale, taxInvoice],
  )
  const refundTotal = selectedLines.reduce((sum, line) => sum + line.amount, 0)
  const originalPayments =
    sale?.payments.filter((payment) => payment.direction === 'payment') ?? []
  const originalMethods = [...new Set(originalPayments.map((payment) => payment.method))]
  const effectiveReason = reason === 'Other return reason' ? customReason.trim() : reason

  function selectSale(selected: Sale) {
    setSale(selected)
    setSuccessAmount(null)
    setCreditNote(null)
    setIsConfirmationOpen(false)
    setError(null)
    setTaxInvoice(null)
    setReturnReferenceId(crypto.randomUUID())
    setQuantities(Object.fromEntries(selected.lines.map((line) => [line.id, 0])))
    setReason('')
    setCustomReason('')
  }

  async function lookup(query: { receiptNumber?: string; customerSearch?: string }, customerName?: string) {
    setIsLoading(true)
    setLookupMessage(
      query.customerSearch
        ? `Looking up sales history for ${customerName ?? query.customerSearch}…`
        : `Looking up bill ${query.receiptNumber ?? ''}…`,
    )
    setError(null)
    setHasSearched(true)
    setSale(null)
    setMatches([])
    setCustomerSuggestions([])
    try {
      const headers = await authHeaders()
      const result = await apiClient.GET('/sales', { params: { query }, headers })
      if (result.error) {
        setError(await responseError(result.response, LOAD_ERROR))
        return
      }
      const found = result.data as Sale[]
      setMatches(found)
      if (found.length === 1) selectSale(found[0])
    } catch {
      setError(LOAD_ERROR)
    } finally {
      setIsLoading(false)
      setLookupMessage(null)
    }
  }

  function selectCustomerSuggestion(customer: CustomerSuggestion) {
    const lookupValue = customer.phone ?? customer.email ?? customer.name ?? ''
    const displayValue = customer.name ?? lookupValue
    skipNextCustomerSuggestionFetch.current = displayValue !== customerSearch
    setCustomerSearch(displayValue)
    setCustomerSuggestions([])
    if (lookupValue) void lookup({ customerSearch: lookupValue }, displayValue)
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
    if (!sale || !shiftId || !effectiveReason || selectedLines.length === 0 || originalPayments.length === 0) return
    setError(null)
    setIsConfirmationOpen(true)
  }

  async function processRefund() {
    if (!sale || !shiftId || !effectiveReason || selectedLines.length === 0 || originalPayments.length === 0) return
    setIsSubmitting(true)
    setError(null)
    const headers = await authHeaders()
    const result = await apiClient.POST('/returns', {
      body: {
        returnReferenceId,
        saleId: sale.id,
        shiftId,
        reason: effectiveReason,
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
    setCreditNote(response.creditNoteId && response.creditNoteNumber ? { id: response.creditNoteId, number: response.creditNoteNumber } : null)
    setIsConfirmationOpen(false)
    // The reference identifies one logical return attempt. Keep it for
    // network retries, but rotate it after a confirmed commit so a cashier
    // can process a second partial return against the same sale.
    setReturnReferenceId(crypto.randomUUID())
    setQuantities(Object.fromEntries(sale.lines.map((line) => [line.id, 0])))
    setReason('')
  }

  return (
    <>
      <PageHead
        title="Returns & Exchange"
        sub="Locate the bill, choose only the items being returned, and refund the original tender."
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
          <button className="btn btn-sm" type="button" onClick={() => router.push('/app/shifts')}>
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
        <CardHead title="Bill lookup" sub="Search by bill number or by the customer attached to the sale." />
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
                placeholder="Bill number"
                ariaLabel="Bill number"
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
              <div style={{ position: 'relative', flex: 1 }}>
                <SearchField
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Customer name, phone, or email"
                  ariaLabel="Customer name, phone, or email"
                  flex
                />
                {(isLoadingSuggestions || customerSuggestions.length > 0) && (
                  <div
                    role="listbox"
                    aria-label="Customer suggestions"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      maxHeight: 280,
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: 'var(--surface)',
                      boxShadow: '0 10px 24px rgba(26, 39, 68, .12)',
                    }}
                  >
                    {isLoadingSuggestions && (
                      <div role="status" style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)' }}>
                        Searching customers…
                      </div>
                    )}
                    {customerSuggestions.map((customer) => {
                      const displayName = customer.name ?? customer.phone ?? customer.email ?? 'Unnamed customer'
                      const details = [customer.phone, customer.email].filter(Boolean).join(' · ')
                      return (
                        <button
                          key={customer.id}
                          type="button"
                          role="option"
                          aria-label={`${displayName}${details ? `, ${details}` : ''}`}
                          onClick={() => selectCustomerSuggestion(customer)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 12px',
                            border: 0,
                            borderBottom: '1px solid var(--border)',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{displayName}</span>
                          {details && <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--muted)' }}>{details}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button className="btn btn-pri" type="submit" disabled={!customerSearch.trim() || isLoading}>
                Search
              </button>
            </form>
          )}

          {isLoading && lookupMessage && (
            <p
              role="status"
              aria-live="polite"
              aria-busy="true"
              style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)' }}
            >
              {lookupMessage}
            </p>
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
          <CardHead
            title="Select items to return"
            sub={taxInvoice ? `Tax Invoice ${taxInvoice.documentNumber}` : isLoadingTaxInvoice ? 'Loading Tax Invoice…' : `Bill ${sale.id}`}
          />
            <CardPad>
              <DataTable cols={['Return', 'Item', 'Original qty', 'Return qty', { label: 'Estimated refund incl. GST', align: 'right' }]}>
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
              {isLoadingTaxInvoice ? (
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>Loading the immutable Tax Invoice snapshot…</p>
              ) : !taxInvoice ? (
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--warning)' }}>
                  The Tax Invoice snapshot could not be loaded. The server will recalculate and confirm the refund amount before recording it.
                </p>
              ) : null}

              <div
                style={{
                  marginTop: 18,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 16,
                  background: 'var(--bg)',
                }}
              >
                <label style={{ display: 'block', marginBottom: 14 }}>
                  <span style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                    Reason for return
                  </span>
                  <select
                    className="fld-select"
                    value={reason}
                    onChange={(event) => {
                      const nextReason = event.target.value
                      setReason(nextReason)
                      if (nextReason !== 'Other return reason') setCustomReason('')
                    }}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Customer changed their mind">Customer changed their mind</option>
                    <option value="Wrong item or size">Wrong item or size</option>
                    <option value="Damaged or defective item">Damaged or defective item</option>
                    <option value="Incorrect item billed">Incorrect item billed</option>
                    <option value="Other return reason">Other</option>
                  </select>
                </label>
                {reason === 'Other return reason' && (
                  <label style={{ display: 'block', marginTop: -2, marginBottom: 14 }}>
                    <span style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                      Describe the reason
                    </span>
                    <textarea
                      className="fld-input"
                      aria-label="Describe the reason"
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value)}
                      placeholder="Tell us why this item is being returned"
                      minLength={2}
                      maxLength={500}
                      rows={3}
                      required
                      style={{ width: '100%', minHeight: 78, resize: 'vertical' }}
                    />
                    <span style={{ display: 'block', marginTop: 5, fontSize: 11.5, color: 'var(--muted)' }}>
                      This note is saved with the return audit trail.
                    </span>
                  </label>
                )}
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
                      !effectiveReason ||
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
            {creditNote ? (
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-2)' }}>
                Credit note <Link href={`/app/documents/${creditNote.id}`} style={{ fontWeight: 700 }}>{creditNote.number}</Link> is linked to the original Tax Invoice.
              </p>
            ) : null}
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-2)' }}>
              Return processed. Start a new sale to complete the exchange.
            </p>
            <button
              className="btn btn-pri"
              type="button"
              style={{ marginTop: 14 }}
              onClick={() => router.push(sale.customerId ? `/app/billing?customerId=${sale.customerId}` : '/app/billing')}
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
            Refund ₹{money(refundTotal)} for {taxInvoice ? `Tax Invoice ${taxInvoice.documentNumber}` : `bill ${sale.id}`}? This sends the selected {selectedLines.length} line
            {selectedLines.length === 1 ? '' : 's'} to the server for validation, reverses the original tender (
            {originalMethods.join(', ')}), records “{effectiveReason}”, and returns approved units to stock.
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
