'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CartLineRow, type CartLine } from '@/components/checkout/cart-line-row'
import {
  PaymentMethodGrid,
  type TenderMethod,
  type TenderRow,
} from '@/components/checkout/payment-method-grid'
import { ManagerApprovalModal } from '@/components/checkout/manager-approval-modal'

type Variant = {
  id: string
  productId: string
  sku: string
  size: string | null
  color: string | null
  material: string | null
  price: string
  currentStock: number
}

type Product = {
  id: string
  name: string
  variants: Variant[]
}

type SearchHit = {
  variant: Variant
  productName: string
}

type Customer = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

const SCAN_PLACEHOLDER = 'Scan barcode or search by name…'
const CART_EMPTY_HEADING = 'Cart is empty'
const CART_EMPTY_BODY = 'Scan a barcode or search a product above to start a sale.'
const CLEAR_CART_CONFIRM = (n: number) =>
  `Clear cart: Remove all ${n} items from this sale? This can't be undone.`
const TAX_DISCLOSURE =
  'Tax computed at the rate configured for this store — not a compliance or nexus determination.'
const GENERIC_CHARGE_FAILURE =
  'Something went wrong completing this sale. Nothing was charged — try again.'
const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function variantAttributes(v: Variant): string {
  return [v.size, v.color, v.material].filter(Boolean).join(' / ') || '—'
}

function money(n: number): string {
  return n.toFixed(2)
}

interface PendingSaleBody {
  clientSaleId: string
  shiftId: string
  lines: {
    variantId: string
    quantity: number
    discountPercent?: string
    discountAmount?: string
  }[]
  cartDiscountPercent?: string
  cartDiscountAmount?: string
  payments: { method: TenderMethod; amount: string; referenceCode?: string }[]
  customer?: { id?: string; name?: string; phone?: string; email?: string }
  receiptEmail?: string
}

function CheckoutPageInner() {
  const searchParams = useSearchParams()
  const shiftId = searchParams.get('shiftId')
  const customerIdParam = searchParams.get('customerId')

  const [loadError, setLoadError] = useState<string | null>(null)

  // Scan / search
  const [scanQuery, setScanQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchHit[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartDiscountMode, setCartDiscountMode] = useState<'none' | 'percent' | 'amount'>('none')
  const [cartDiscountValue, setCartDiscountValue] = useState('')

  // Customer
  const [customer, setCustomer] = useState<{
    id?: string
    name?: string
    phone?: string
    email?: string
  } | null>(null)
  const [isReturningCustomer, setIsReturningCustomer] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([])
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')

  // Payment
  const [tenderMethods, setTenderMethods] = useState<TenderMethod[]>([])
  const [tenderRows, setTenderRows] = useState<TenderRow[]>([])

  // Charge
  const [chargeError, setChargeError] = useState<string | null>(null)
  const [isCharging, setIsCharging] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [pendingSaleBody, setPendingSaleBody] = useState<PendingSaleBody | null>(null)

  // D-12: pre-attach an existing customer id from the query param on mount.
  useEffect(() => {
    if (customerIdParam) {
      setCustomer({ id: customerIdParam })
      setIsReturningCustomer(true)
    }
  }, [customerIdParam])

  const subtotal = cart.reduce(
    (sum, l) => sum + Number(l.unitPrice) * l.quantity - Number(l.discountAmount || '0'),
    0,
  )
  const cartDiscount =
    cartDiscountMode === 'percent'
      ? (subtotal * Number(cartDiscountValue || '0')) / 100
      : cartDiscountMode === 'amount'
        ? Number(cartDiscountValue || '0')
        : 0
  const discountedSubtotal = Math.max(0, subtotal - cartDiscount)
  // Client-side total is display-only UX feedback — the server (computeCheckout)
  // is the sole source of truth for the actual charged amount; tax estimate here
  // is a simple flat display placeholder, never sent to the server.
  const totalDisplay = discountedSubtotal

  const paymentSum = tenderRows.reduce((sum, r) => sum + Number(r.amount || '0'), 0)

  async function runSearch(query: string) {
    setSearchError(null)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/products', {
      params: { query: { search: query } },
      headers,
    })
    if (error || !data) {
      setSearchError(LOAD_ERROR)
      return
    }
    const hits: SearchHit[] = []
    for (const product of data as Product[]) {
      for (const variant of product.variants) {
        hits.push({ variant, productName: product.name })
      }
    }
    setSearchResults(hits)

    // CHECK-01: an exact-sku match adds directly to the cart without requiring
    // the cashier to click a result row.
    const exactSkuMatch = hits.filter((h) => h.variant.sku === query.trim())
    if (exactSkuMatch.length === 1) {
      addToCart(exactSkuMatch[0])
      setScanQuery('')
      setSearchResults([])
    }
  }

  function addToCart(hit: SearchHit) {
    setCart((current) => {
      const existing = current.find((l) => l.variantId === hit.variant.id)
      if (existing) {
        return current.map((l) =>
          l.variantId === hit.variant.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [
        ...current,
        {
          variantId: hit.variant.id,
          sku: hit.variant.sku,
          name: hit.productName,
          attributes: variantAttributes(hit.variant),
          unitPrice: hit.variant.price,
          quantity: 1,
          discountAmount: '0.00',
          isTaxable: true,
        },
      ]
    })
  }

  function handleQuantityChange(variantId: string, quantity: number) {
    setCart((current) =>
      current.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    )
  }

  function handleDiscountChange(variantId: string, discountAmount: string) {
    setCart((current) =>
      current.map((l) => (l.variantId === variantId ? { ...l, discountAmount } : l)),
    )
  }

  function handleRemove(variantId: string) {
    setCart((current) => current.filter((l) => l.variantId !== variantId))
  }

  function handleClearCart() {
    if (cart.length === 0) return
    if (window.confirm(CLEAR_CART_CONFIRM(cart.length))) {
      setCart([])
      setCartDiscountMode('none')
      setCartDiscountValue('')
    }
  }

  async function runCustomerSearch(query: string) {
    setCustomerSearchQuery(query)
    if (!query.trim()) {
      setCustomerSearchResults([])
      return
    }
    const headers = await authHeader()
    const { data } = await apiClient.GET('/customers', {
      params: { query: { search: query } },
      headers,
    })
    setCustomerSearchResults(data ?? [])
  }

  function selectCustomer(c: Customer) {
    setCustomer({ id: c.id, name: c.name ?? undefined, phone: c.phone ?? undefined, email: c.email ?? undefined })
    setIsReturningCustomer(false)
    setCustomerSearchQuery('')
    setCustomerSearchResults([])
  }

  function clearCustomer() {
    setCustomer(null)
    setIsReturningCustomer(false)
  }

  function toggleTenderMethod(method: TenderMethod) {
    setTenderMethods((current) => {
      if (current.includes(method)) {
        setTenderRows((rows) => rows.filter((r) => r.method !== method))
        return current.filter((m) => m !== method)
      }
      setTenderRows((rows) => [...rows, { method, amount: '' }])
      return [...current, method]
    })
  }

  function handleTenderRowChange(index: number, row: TenderRow) {
    setTenderRows((rows) => rows.map((r, i) => (i === index ? row : r)))
  }

  function handleAddTenderRow() {
    const availableMethods: TenderMethod[] = ['cash', 'card', 'check']
    const next = availableMethods.find((m) => !tenderRows.some((r) => r.method === m))
    if (!next) return
    setTenderMethods((current) => [...current, next])
    setTenderRows((rows) => [...rows, { method: next, amount: '' }])
  }

  function handleRemoveTenderRow(index: number) {
    setTenderRows((rows) => {
      const removed = rows[index]
      if (removed) {
        setTenderMethods((methods) => methods.filter((m) => m !== removed.method))
      }
      return rows.filter((_, i) => i !== index)
    })
  }

  async function submitSale(body: PendingSaleBody, extraHeaders?: Record<string, string>) {
    const headers = await authHeader()
    return apiClient.POST('/sales', {
      body,
      headers: { ...(headers ?? {}), ...(extraHeaders ?? {}) },
    })
  }

  function buildCustomerPayload() {
    if (customer?.id) return { id: customer.id }
    if (showNewCustomerForm && (newCustomerPhone.trim() || newCustomerEmail.trim())) {
      return {
        name: newCustomerName.trim() || undefined,
        phone: newCustomerPhone.trim() || undefined,
        email: newCustomerEmail.trim() || undefined,
      }
    }
    return undefined
  }

  async function handleCharge() {
    setChargeError(null)
    setSuccessMessage(null)

    if (!shiftId) {
      setChargeError('No open shift. Open a shift before taking a sale.')
      return
    }
    if (cart.length === 0) return

    // Step 7: client-side payment-sum pre-check, defense-in-depth mirror of PAY-02.
    const total = totalDisplay
    const diff = paymentSum - total
    if (Math.abs(diff) > 0.001) {
      const direction = diff > 0 ? 'over' : 'under'
      setChargeError(
        `Payments must add up to the exact total ($${money(total)}). Currently $${money(paymentSum)} — $${money(Math.abs(diff))} ${direction}.`,
      )
      return
    }

    const body: PendingSaleBody = {
      clientSaleId: crypto.randomUUID(),
      shiftId,
      lines: cart.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
        discountAmount: Number(l.discountAmount || '0') > 0 ? l.discountAmount : undefined,
      })),
      cartDiscountPercent: cartDiscountMode === 'percent' ? cartDiscountValue : undefined,
      cartDiscountAmount: cartDiscountMode === 'amount' ? cartDiscountValue : undefined,
      payments: tenderRows.map((r) => ({
        method: r.method,
        amount: Number(r.amount || '0').toFixed(2),
        referenceCode: r.referenceCode,
      })),
      customer: buildCustomerPayload(),
    }

    setPendingSaleBody(body)
    setIsCharging(true)
    const { data, error, response } = await submitSale(body)
    setIsCharging(false)

    if (!error && data) {
      onChargeSuccess(data.totalAmount)
      return
    }

    const errorBody = error as { error?: string; code?: string } | undefined
    if (response?.status === 403 && errorBody?.code === 'discount_approval_required') {
      setShowApprovalModal(true)
      return
    }
    if (response?.status === 400) {
      setChargeError(errorBody?.error ?? GENERIC_CHARGE_FAILURE)
      return
    }
    setChargeError(GENERIC_CHARGE_FAILURE)
  }

  function onChargeSuccess(totalAmount: string) {
    setSuccessMessage(`Sale complete — $${totalAmount} charged.`)
    setCart([])
    setCartDiscountMode('none')
    setCartDiscountValue('')
    setCustomer(null)
    setIsReturningCustomer(false)
    setTenderMethods([])
    setTenderRows([])
    setPendingSaleBody(null)
    setChargeError(null)
  }

  async function handleApproved(operatorToken: string) {
    if (!pendingSaleBody) {
      setShowApprovalModal(false)
      return
    }
    const { data, error } = await submitSale(pendingSaleBody, {
      'X-Operator-Token': operatorToken,
    })
    if (!error && data) {
      setShowApprovalModal(false)
      onChargeSuccess(data.totalAmount)
      return
    }
    setShowApprovalModal(false)
    setChargeError(GENERIC_CHARGE_FAILURE)
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1
        style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}
        className="mb-6"
      >
        Checkout
      </h1>

      {!shiftId && (
        <Alert className="mb-4">
          <AlertDescription>
            No open shift for this terminal. Open a shift before taking a sale.
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        {/* Cart column */}
        <div>
          <Input
            value={scanQuery}
            onChange={(e) => {
              setScanQuery(e.target.value)
              runSearch(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runSearch(scanQuery)
              }
            }}
            placeholder={SCAN_PLACEHOLDER}
            className="mb-2"
            style={{ minHeight: 44 }}
          />

          {searchError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {searchResults.length > 0 && (
            <div className="mb-4 flex flex-col gap-1 rounded-md border p-2" style={{ borderColor: '#E2E8F0' }}>
              {searchResults.map((hit) => (
                <div key={hit.variant.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    {hit.productName} — {variantAttributes(hit.variant)} · {hit.variant.sku}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToCart(hit)}
                    style={{ minHeight: 44 }}
                  >
                    + Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700 }}>
              Cart
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-sm"
                style={{ color: '#DC2626' }}
              >
                Clear cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-md border p-8 text-center" style={{ borderColor: '#E2E8F0' }}>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700 }}>
                {CART_EMPTY_HEADING}
              </p>
              <p className="mt-2 text-sm" style={{ color: '#64748B' }}>
                {CART_EMPTY_BODY}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Line total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((line) => (
                  <CartLineRow
                    key={line.variantId}
                    line={line}
                    onQuantityChange={handleQuantityChange}
                    onDiscountChange={handleDiscountChange}
                    onRemove={handleRemove}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4">
            {cartDiscountMode === 'none' ? (
              <button
                type="button"
                onClick={() => setCartDiscountMode('percent')}
                className="text-sm"
                style={{ color: '#0058BA' }}
              >
                Discount entire sale
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={cartDiscountMode}
                  onChange={(e) => setCartDiscountMode(e.target.value as 'percent' | 'amount')}
                  className="rounded-md border p-2"
                  style={{ minHeight: 44 }}
                >
                  <option value="percent">%</option>
                  <option value="amount">$</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cartDiscountValue}
                  onChange={(e) => setCartDiscountValue(e.target.value)}
                  style={{ maxWidth: 120, minHeight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCartDiscountMode('none')
                    setCartDiscountValue('')
                  }}
                  className="text-sm"
                  style={{ color: '#64748B' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary column */}
        <div className="flex flex-col gap-6">
          {/* Customer panel */}
          <div className="rounded-md border p-4" style={{ borderColor: '#E2E8F0' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700 }} className="mb-2">
              Customer
            </h2>
            {customer ? (
              <div>
                <p style={{ fontWeight: 700 }}>
                  {isReturningCustomer ? 'Returning customer' : customer.name ?? 'Customer attached'}
                </p>
                {customer.phone && <p className="text-sm" style={{ color: '#64748B' }}>{customer.phone}</p>}
                {customer.email && <p className="text-sm" style={{ color: '#64748B' }}>{customer.email}</p>}
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="mt-2 text-sm"
                  style={{ color: '#0058BA' }}
                >
                  Remove customer
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm" style={{ color: '#64748B' }}>
                  Walk-in customer
                </p>
                <Input
                  value={customerSearchQuery}
                  onChange={(e) => runCustomerSearch(e.target.value)}
                  placeholder="Search by phone, email, or name…"
                  style={{ minHeight: 44 }}
                />
                {customerSearchResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {customerSearchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="rounded-md border p-2 text-left text-sm"
                        style={{ borderColor: '#E2E8F0', minHeight: 44 }}
                      >
                        {c.name ?? 'Unnamed'} — {c.phone ?? c.email ?? ''}
                      </button>
                    ))}
                  </div>
                )}
                {!showNewCustomerForm ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(true)}
                    className="mt-2 text-sm"
                    style={{ color: '#0058BA' }}
                  >
                    New customer
                  </button>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Name"
                      style={{ minHeight: 44 }}
                    />
                    <Input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone"
                      style={{ minHeight: 44 }}
                    />
                    <Input
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="Email"
                      style={{ minHeight: 44 }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment */}
          <PaymentMethodGrid
            selected={tenderMethods}
            onToggle={toggleTenderMethod}
            rows={tenderRows}
            onRowChange={handleTenderRowChange}
            onAddRow={handleAddTenderRow}
            onRemoveRow={handleRemoveTenderRow}
          />

          {/* Bill summary */}
          <div className="rounded-md border p-4" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex justify-between py-1">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                }}
              >
                Subtotal
              </span>
              <span>${money(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                }}
              >
                Discount
              </span>
              <span>${money(cartDiscount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                }}
              >
                Sales tax
              </span>
              <span>Calculated at charge</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: '#E2E8F0' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                }}
              >
                Total due
              </span>
              <span
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: '#0058BA',
                }}
              >
                ${money(totalDisplay)}
              </span>
            </div>
            <p className="mt-3 text-xs" style={{ color: '#64748B' }}>
              {TAX_DISCLOSURE}
            </p>
          </div>

          {chargeError && (
            <Alert variant="destructive">
              <AlertDescription>{chargeError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            onClick={handleCharge}
            disabled={isCharging || cart.length === 0 || !shiftId}
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF', minHeight: 44 }}
          >
            {`Charge $${money(totalDisplay)}`}
          </Button>
        </div>
      </div>

      <ManagerApprovalModal
        open={showApprovalModal}
        onApproved={handleApproved}
        onCancel={() => setShowApprovalModal(false)}
      />

      {loadError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  )
}
