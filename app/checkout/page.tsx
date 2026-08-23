'use client'

import { Suspense, useCallback, useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'
import Link from 'next/link'
import { ScanLine, ShoppingCart } from 'lucide-react'
import { Card, CardHead, CardPad, DataTable, PageHead, SectionLabel } from '@/components/couture/ui'
import { EmptyState } from '@/components/couture/states'
import { CartLineRow, type CartLine } from '@/components/checkout/cart-line-row'
import {
  PaymentMethodGrid,
  type TenderMethod,
  type TenderRow,
} from '@/components/checkout/payment-method-grid'
import { ManagerApprovalModal } from '@/components/checkout/manager-approval-modal'
import { Receipt, type ReceiptSale } from '@/components/checkout/receipt'
import { useConnectivity } from '@/lib/offline/connectivity'
import { enqueueSale, countPending } from '@/lib/offline/queue'
import { startSyncEngine } from '@/lib/offline/sync'

type Variant = {
  id: string
  productId: string
  sku: string
  barcode: string | null
  unitOfMeasure: string
  size: string | null
  color: string | null
  material: string | null
  price: string
  isTaxable: boolean
  taxRatePercent: string | null
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

type Availability = {
  stores: Array<{ storeId: string; storeName: string; quantity: string; isOwnStore: boolean }>
}

type Customer = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

type SaleResponse = {
  id: string
  createdAt: string
  subtotal: string
  discountAmount: string
  taxAmount: string
  totalAmount: string
  cashReceived: string | null
  changeDue: string
  businessName?: string | null
  lines: { variantId: string; productName?: string | null; quantity: number; unitPrice: string; lineTotal: string }[]
  payments?: {
    method: TenderMethod
    direction: 'payment' | 'refund'
    amount: string
    referenceCode: string | null
  }[]
}

const SCAN_PLACEHOLDER = 'Scan barcode or search by name…'
const CART_EMPTY_HEADING = 'Cart is empty'
const CART_EMPTY_BODY = 'Scan a barcode or search a product above to start a sale.'
const CLEAR_CART_CONFIRM = (n: number) =>
  `Clear cart: Remove all ${n} items from this sale? This can't be undone.`
const TAX_DISCLOSURE =
  'This is a pre-charge estimate from the current cart. The server validates price, discounts, tax, stock, tender, and the final total when you charge.'
const GENERIC_CHARGE_FAILURE =
  'Something went wrong completing this sale. Nothing was charged. Try again.'
const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."

function variantAttributes(v: Variant): string {
  return [v.size, v.color, v.material].filter(Boolean).join(' / ') || '-'
}

function money(n: number): string {
  return n.toFixed(2)
}

const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

/** Display-only currency formatting. Server figures remain authoritative. */
function inr(n: number | string): string {
  return inrFormat.format(Number(n))
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
  cashReceived?: string
  customer?: { id?: string; name?: string; phone?: string; email?: string }
  receiptEmail?: string
}

type OpenShiftEntry = {
  id: string
  staffId: string
  terminalId: string | null
  closedAt: string | null
  terminalName: string | null
}

function CheckoutPageInner() {
  const searchParams = useSearchParams()
  const customerIdParam = searchParams.get('customerId')

  const [loadError, setLoadError] = useState<string | null>(null)

  /**
   * Which shift this bill charges against is derived from the server, not a
   * URL param: nothing ever populated one, so Billing always read as "no
   * open shift" even with a shift open on the register. Mirrors the same
   * paired-counter pattern shifts-view.tsx uses: a cashier handover continues
   * the counter's open shift, regardless of which staff member opened it.
   */
  const [openShiftsForStaff, setOpenShiftsForStaff] = useState<OpenShiftEntry[]>([])
  const activeShift =
    openShiftsForStaff.length === 1 ? openShiftsForStaff[0] : null
  const hasMultipleOpenShifts = openShiftsForStaff.length > 1
  const shiftId = activeShift?.id ?? null

  const loadActiveShift = useCallback(async () => {
    try {
      const [context, shiftsResult, deviceResult] = await Promise.all([
        getAuthenticatedAppContext(),
        apiClient.GET('/shifts', { headers: await authHeaders() }),
        apiClient.GET('/terminals/device', { headers: await authHeaders() }),
      ])
      const mine = context.staff.id
      setTaxRatePercent(Number(context.store?.combinedTaxRatePercent ?? 0))
      setTaxTreatment(context.store?.taxTreatment ?? 'cgst_sgst')
      const shifts = (shiftsResult.data as OpenShiftEntry[] | undefined) ?? []
      const currentTerminalId = deviceResult.data?.terminal?.id
      setOpenShiftsForStaff(
        shifts.filter((s) => s.closedAt === null && (currentTerminalId ? s.terminalId === currentTerminalId : s.staffId === mine)),
      )
    } catch {
      // The banner already covers "no shift": a failed lookup reads the
      // same way (Charge stays disabled) rather than a separate error state.
    }
  }, [])

  useEffect(() => {
    void loadActiveShift()
  }, [loadActiveShift])

  // Scan / search
  const [scanQuery, setScanQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchHit[]>([])
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [availabilityByVariant, setAvailabilityByVariant] = useState<Record<string, Availability>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartLine[]>([])

  /**
   * OFFLINE-01: the idempotency key for THIS bill, minted once when the bill
   * begins and held until it is charged or explicitly cleared.
   *
   * This must not be generated at submit time. If it were, a double-click or a
   * user-initiated retry after a timeout would mint a second id, the server
   * would see two distinct sales, and migration 0018's unique index could not
   * detect the duplicate: the whole guarantee would be defeated by the client.
   * Reset only in onChargeSuccess() and handleClearCart().
   */
  const [cartSaleId, setCartSaleId] = useState<string>(() => crypto.randomUUID())
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
  const [activeCustomerSearchIndex, setActiveCustomerSearchIndex] = useState(-1)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')

  // Payment
  const [tenderMethods, setTenderMethods] = useState<TenderMethod[]>([])
  const [tenderRows, setTenderRows] = useState<TenderRow[]>([])
  const [splitEnabled, setSplitEnabled] = useState(false)

  // Charge
  const [chargeError, setChargeError] = useState<string | null>(null)
  const [isCharging, setIsCharging] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [pendingSaleBody, setPendingSaleBody] = useState<PendingSaleBody | null>(null)

  // Post-charge receipt (CHECK-06). Stays visible until the cashier starts a
  // new sale (typing in the scan field or adding a new cart line clears it).
  const [completedSale, setCompletedSale] = useState<ReceiptSale | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [taxRatePercent, setTaxRatePercent] = useState(0)
  const [taxTreatment, setTaxTreatment] = useState<'cgst_sgst' | 'igst'>('cgst_sgst')

  // OFFLINE-01: connectivity + outbox state.
  const { isOnline } = useConnectivity()
  const [queuedCount, setQueuedCount] = useState(0)
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null)

  const refreshQueueCount = useCallback(async () => {
    try {
      setQueuedCount(await countPending())
    } catch {
      // IndexedDB unavailable (private mode). Offline queuing is degraded, and
      // the Charge button stays disabled while offline rather than pretending.
    }
  }, [])

  useEffect(() => {
    void refreshQueueCount()
    const stop = startSyncEngine(() => void refreshQueueCount())
    return stop
  }, [refreshQueueCount])

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
  const lineBases = cart.map((line) => Number(line.unitPrice) * line.quantity - Number(line.discountAmount || '0'))
  const discountedLineBases = lineBases.map((lineBase) =>
    subtotal > 0 ? lineBase - (cartDiscount * lineBase) / subtotal : lineBase,
  )
  // Display/payment preparation mirrors the server Decimal calculation, but
  // the server remains authoritative and recomputes from persisted prices.
  const taxEstimate = Math.round(
    cart.reduce((sum, line, index) => {
      if (!line.isTaxable) return sum
      const configuredRate = line.taxRatePercent === null || line.taxRatePercent === undefined
        ? taxRatePercent
        : Number(line.taxRatePercent)
      return sum + discountedLineBases[index] * (configuredRate / 100)
    }, 0) * 100,
  ) / 100
  const estimatedCgst = taxTreatment === 'cgst_sgst' ? Math.round((taxEstimate / 2) * 100) / 100 : 0
  const estimatedSgst = taxTreatment === 'cgst_sgst' ? Math.round((taxEstimate - estimatedCgst) * 100) / 100 : 0
  const preChargeEstimate = discountedSubtotal + taxEstimate

  const paymentSum = tenderRows.reduce((sum, r) => sum + Number(r.amount || '0'), 0)

  // Single-method mode: the one tender row always covers the whole bill, so
  // if the cart total changes after the method was picked (another item
  // added, a discount applied), the amount tracks it rather than going
  // stale and tripping the payment-sum check.
  useEffect(() => {
    if (splitEnabled || tenderRows.length !== 1) return
    const total = preChargeEstimate.toFixed(2)
    if (tenderRows[0].amount === total) return
    setTenderRows((rows) => (rows[0] ? [{ ...rows[0], amount: total }] : rows))
  }, [splitEnabled, preChargeEstimate, tenderRows])

  async function runSearch(query: string) {
    setSearchError(null)
    setActiveSearchIndex(-1)
    // Starting to scan/search for the next sale clears the prior receipt.
    setCompletedSale(null)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const headers = await authHeaders()
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
    // An exact SKU *or* manufacturer barcode adds straight to the cart: a
    // supermarket cashier scans the maker's EAN, not our own printed SKU.
    const trimmed = query.trim()
    const exactSkuMatch = hits.filter((h) => h.variant.sku === trimmed || h.variant.barcode === trimmed)
    if (exactSkuMatch.length === 1) {
      selectSearchHit(exactSkuMatch[0])
    }
  }

  function selectSearchHit(hit: SearchHit) {
    addToCart(hit)
    setScanQuery('')
    setSearchResults([])
    setActiveSearchIndex(-1)
  }

  function handleProductSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (searchResults.length > 0 && event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSearchIndex((current) => (current < 0 ? 0 : (current + 1) % searchResults.length))
      return
    }
    if (searchResults.length > 0 && event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSearchIndex((current) => (current <= 0 ? searchResults.length - 1 : current - 1))
      return
    }
    if (event.key === 'Escape') {
      setSearchResults([])
      setActiveSearchIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const hit = activeSearchIndex >= 0 ? searchResults[activeSearchIndex] : undefined
      if (hit) {
        selectSearchHit(hit)
      } else {
        void runSearch(scanQuery)
      }
    }
  }

  function addToCart(hit: SearchHit) {
    // Adding a new cart line starts the next sale: clear the prior receipt.
    setCompletedSale(null)
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
          unitOfMeasure: hit.variant.unitOfMeasure,
          quantity: 1,
          discountAmount: '0.00',
          isTaxable: hit.variant.isTaxable,
          taxRatePercent: hit.variant.taxRatePercent,
        },
      ]
    })
  }

  async function checkAvailability(variantId: string) {
    setAvailabilityLoading(variantId)
    const { data, error } = await apiClient.GET('/variants/{variantId}/availability', {
      params: { path: { variantId } },
      headers: await authHeaders(),
    })
    setAvailabilityLoading(null)
    if (error || !data) {
      setSearchError('Could not check the other shops right now.')
      return
    }
    setAvailabilityByVariant((current) => ({ ...current, [variantId]: data }))
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
      // Abandoning this bill starts a new one: a later, unrelated bill must
      // not reuse the discarded bill's idempotency key.
      setCartSaleId(crypto.randomUUID())
    }
  }

  async function runCustomerSearch(query: string) {
    setCustomerSearchQuery(query)
    setActiveCustomerSearchIndex(-1)
    if (!query.trim()) {
      setCustomerSearchResults([])
      return
    }
    const headers = await authHeaders()
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
    setActiveCustomerSearchIndex(-1)
  }

  function handleCustomerSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (customerSearchResults.length > 0 && event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveCustomerSearchIndex((current) => (current < 0 ? 0 : (current + 1) % customerSearchResults.length))
      return
    }
    if (customerSearchResults.length > 0 && event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveCustomerSearchIndex((current) => (current <= 0 ? customerSearchResults.length - 1 : current - 1))
      return
    }
    if (event.key === 'Escape') {
      setCustomerSearchResults([])
      setActiveCustomerSearchIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const customer = activeCustomerSearchIndex >= 0 ? customerSearchResults[activeCustomerSearchIndex] : undefined
      if (customer) selectCustomer(customer)
    }
  }

  function clearCustomer() {
    setCustomer(null)
    setIsReturningCustomer(false)
  }

  function toggleTenderMethod(method: TenderMethod) {
    // Reads current state directly rather than nesting a setTenderRows call
    // inside setTenderMethods's updater: React Strict Mode double-invokes
    // updater functions to check purity, and since the nested call had a
    // side effect (dispatching its own state update), that doubling made
    // every tap add two rows instead of one.
    const alreadySelected = tenderMethods.includes(method)

    // Off split mode, one tap picks exactly one method: tapping the same
    // tile again clears it, tapping a different tile replaces it. This is
    // what keeps a single payment down to one tile + one input, instead of
    // both piling up looking like duplicate entries.
    if (!splitEnabled) {
      setTenderMethods(alreadySelected ? [] : [method])
      setTenderRows(
        alreadySelected
          ? []
          // A single method covers the whole bill by definition: default
          // the amount to the current total instead of making the cashier
          // retype a number that's already on screen.
          : [{ method, amount: preChargeEstimate.toFixed(2) }],
      )
      return
    }

    if (alreadySelected) {
      setTenderMethods(tenderMethods.filter((m) => m !== method))
      setTenderRows(tenderRows.filter((r) => r.method !== method))
      return
    }
    setTenderMethods([...tenderMethods, method])
    setTenderRows([...tenderRows, { method, amount: '' }])
  }

  function handleToggleSplit(enabled: boolean) {
    setSplitEnabled(enabled)
    // Switching modes with a selection in place is ambiguous (which method
    // survives?): clearing it is simpler and safer than guessing.
    setTenderMethods([])
    setTenderRows([])
  }

  function handleTenderRowChange(index: number, row: TenderRow) {
    setTenderRows((rows) => rows.map((r, i) => (i === index ? row : r)))
  }

  function handleAddTenderRow() {
    const availableMethods: TenderMethod[] = ['cash', 'card', 'upi']
    const next = availableMethods.find((m) => !tenderRows.some((r) => r.method === m))
    if (!next) return
    setTenderMethods([...tenderMethods, next])
    setTenderRows([...tenderRows, { method: next, amount: '' }])
  }

  function handleRemoveTenderRow(index: number) {
    const removed = tenderRows[index]
    setTenderRows(tenderRows.filter((_, i) => i !== index))
    if (removed) {
      setTenderMethods(tenderMethods.filter((m) => m !== removed.method))
    }
  }

  async function submitSale(body: PendingSaleBody, extraHeaders?: Record<string, string>) {
    const headers = await authHeaders()
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
      setChargeError(
        hasMultipleOpenShifts
          ? 'You have shifts open on more than one counter. Close the extra one before taking a sale.'
          : 'No open shift. Open a shift before taking a sale.',
      )
      return
    }
    if (cart.length === 0) return

    // Step 7: client-side payment-sum pre-check, defense-in-depth mirror of PAY-02.
    const total = preChargeEstimate
    const diff = paymentSum - total
    if (Math.abs(diff) > 0.001) {
      const direction = diff > 0 ? 'over' : 'under'
      setChargeError(
        `Tender entries must match the current cart estimate (₹${money(total)}). Currently ₹${money(paymentSum)}, ₹${money(Math.abs(diff))} ${direction}. The server confirms the final total at charge.`,
      )
      return
    }

    const cashRow = tenderRows.find((row) => row.method === 'cash')
    if (cashRow?.cashReceived) {
      const received = Number(cashRow.cashReceived)
      const allocated = Number(cashRow.amount)
      if (!Number.isFinite(received) || received < allocated) {
        setChargeError(`Enter cash received of at least ₹${money(allocated)} so Ambel can calculate the change.`)
        return
      }
    }

    const body: PendingSaleBody = {
      // Stable for the life of this bill: see cartSaleId's declaration. A
      // retry of the same bill MUST reuse this id so the server recognises it
      // as a replay rather than a second sale.
      clientSaleId: cartSaleId,
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
      cashReceived: cashRow ? Number(cashRow.cashReceived).toFixed(2) : undefined,
      customer: buildCustomerPayload(),
    }

    setPendingSaleBody(body)

    // OFFLINE-01: when the server is unreachable the sale is queued locally
    // instead of failing at the counter. The same clientSaleId is replayed on
    // sync, so the server records it exactly once (migration 0018).
    if (!isOnline) {
      try {
        await enqueueSale({
          clientSaleId: cartSaleId,
          body,
          estimatedTotal: preChargeEstimate.toFixed(2),
        })
        await refreshQueueCount()
        setQueuedMessage(
          `Sale queued offline: ${inr(preChargeEstimate)}. It syncs automatically when the connection returns. The final total is confirmed by the server at that point.`,
        )
        setCart([])
        setCartDiscountMode('none')
        setCartDiscountValue('')
        setCartSaleId(crypto.randomUUID())
        setTenderRows([])
        setTenderMethods([])
        setSplitEnabled(false)
        return
      } catch {
        setChargeError(
          'This device cannot store offline sales, so the sale was not taken. Restore the connection before charging.',
        )
        return
      }
    }

    setIsCharging(true)
    const { data, error, response } = await submitSale(body)
    setIsCharging(false)

    if (!error && data) {
      onChargeSuccess(data as SaleResponse)
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

  function onChargeSuccess(sale: SaleResponse) {
    setSuccessMessage(`Sale complete: ₹${sale.totalAmount} charged and recorded by the server.`)

    // Keep the cart name as a compatibility fallback for older backends; new
    // sale responses also carry the server-resolved product name. The Total
    // paid figure and every other money field on the receipt still come
    // directly from `sale`, never recomputed (Pitfall 2).
    const cartByVariantId = new Map(cart.map((l) => [l.variantId, l]))
    setCompletedSale({
      id: sale.id,
      createdAt: sale.createdAt,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      totalAmount: sale.totalAmount,
      cashReceived: sale.cashReceived,
      changeDue: sale.changeDue,
      payments: sale.payments ?? [],
      lines: sale.lines.map((line) => ({
        ...line,
        name: cartByVariantId.get(line.variantId)?.name ?? line.productName ?? undefined,
      })),
    })
    setBusinessName(sale.businessName ?? businessName)

    setCart([])
    setCartDiscountMode('none')
    setCartDiscountValue('')
    // This bill is committed; the next bill needs its own idempotency key.
    setCartSaleId(crypto.randomUUID())
    setCustomer(null)
    setIsReturningCustomer(false)
    setTenderMethods([])
    setTenderRows([])
    setSplitEnabled(false)
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
    // Manager approval is a one-sale session, not a cashier handover. Close
    // the durable audit row immediately after the sale attempt.
    const baseHeaders = await authHeaders()
    await apiClient.POST('/terminal/pin/logout', {
      headers: { ...(baseHeaders ?? {}), 'X-Operator-Token': operatorToken },
    })
    if (!error && data) {
      setShowApprovalModal(false)
      onChargeSuccess(data as SaleResponse)
      return
    }
    setShowApprovalModal(false)
    setChargeError(GENERIC_CHARGE_FAILURE)
  }

  return (
    <>
      <PageHead
        title="Billing"
        sub={
          shiftId
            ? 'Scan products, collect tender, then let the server confirm the sale.'
            : hasMultipleOpenShifts
              ? 'You have more than one shift open'
              : 'No open shift for this terminal'
        }
        actions={
          isOnline ? (
            <span className="badge b-green">
              <span className="dot-g" /> Online
            </span>
          ) : (
            <span className="badge b-amber">
              <span className="dot-a" /> Offline, sales are queued
            </span>
          )
        }
      />

      {!isOnline && (
        <Card style={{ borderColor: '#F3DFB8', background: 'var(--warning-soft)' }}>
          <CardPad style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="flag improve">OFFLINE</span>
            <span style={{ fontSize: 13, color: '#8a6410' }}>
              No connection to the server. Sales are recorded on this device and sync automatically when the
              connection returns. Tax and the final total are confirmed by the server at sync.
            </span>
          </CardPad>
        </Card>
      )}

      {queuedCount > 0 && (
        <Card>
          <CardPad style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="badge b-blue">{queuedCount} queued</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {queuedCount === 1 ? 'A sale is' : 'Sales are'} waiting to sync.
            </span>
            <Link className="btn btn-sm" href="/app/offline-sync" style={{ marginLeft: 'auto' }}>
              Review queue
            </Link>
          </CardPad>
        </Card>
      )}

      {queuedMessage && (
        <Card style={{ borderColor: '#BBE9D4', background: 'var(--success-soft)' }}>
          <CardPad style={{ fontSize: 13, color: '#0f8f63' }}>{queuedMessage}</CardPad>
        </Card>
      )}

      {!shiftId && (
        <Card style={{ borderColor: '#F3DFB8', background: 'var(--warning-soft)' }}>
          <CardPad style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="flag improve">ACTION</span>
            <span style={{ fontSize: 13, color: '#8a6410' }}>
              {hasMultipleOpenShifts
                ? 'You have shifts open on more than one counter. Close the extra one before taking a sale.'
                : 'No open shift for this terminal. Open a shift before taking a sale.'}
            </span>
            <Link className="btn btn-sm" href="/app/shifts" style={{ marginLeft: 'auto' }}>
              {hasMultipleOpenShifts ? 'Manage shifts' : 'Open register'}
            </Link>
          </CardPad>
        </Card>
      )}

      {successMessage && (
        <Card style={{ borderColor: '#BBE9D4', background: 'var(--success-soft)' }}>
          <CardPad style={{ fontSize: 13, color: '#0f8f63' }}>{successMessage}</CardPad>
        </Card>
      )}

      {completedSale && (
        <div className="gap-block">
          <Receipt sale={completedSale} businessName={businessName} />
        </div>
      )}

      {loadError && (
        <Card style={{ borderColor: '#F6D4D4', background: 'var(--danger-soft)' }}>
          <CardPad style={{ fontSize: 13, color: '#cf3030' }}>{loadError}</CardPad>
        </Card>
      )}

      {/* Widened aside via the custom property, not an inline grid-template: an
          inline template would outrank the .split-2 mobile breakpoint and keep
          the 420px payment column alongside the cart on a phone. */}
      <div className="split-2" style={{ '--split-aside': '420px' } as CSSProperties}>
        {/* ---------------- Cart column ---------------- */}
        <div style={{ minWidth: 0 }}>
          <Card className="card-pad">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="search" style={{ maxWidth: 'none', flex: 1 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={scanQuery}
                  aria-label={SCAN_PLACEHOLDER}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={searchResults.length > 0}
                  aria-controls="billing-product-search-results"
                  aria-activedescendant={activeSearchIndex >= 0 ? `billing-product-result-${searchResults[activeSearchIndex]?.variant.id}` : undefined}
                  onChange={(e) => {
                    setScanQuery(e.target.value)
                    runSearch(e.target.value)
                  }}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder={SCAN_PLACEHOLDER}
                />
              </div>
              <button className="btn" type="button" onClick={() => runSearch(scanQuery)}>
                <ScanLine size={15} /> Scan
              </button>
            </div>

            {searchError && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--danger)' }} role="alert">
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div id="billing-product-search-results" className="res-box" role="listbox" aria-label="Product search results" style={{ marginTop: 10 }}>
                {searchResults.map((hit, index) => (
                  <div
                    key={hit.variant.id}
                    id={`billing-product-result-${hit.variant.id}`}
                    role="option"
                    aria-selected={activeSearchIndex === index}
                    tabIndex={0}
                    onMouseEnter={() => setActiveSearchIndex(index)}
                    onClick={() => selectSearchHit(hit)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        selectSearchHit(hit)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '9px 4px',
                      borderBottom: '1px solid var(--border-soft)',
                      cursor: 'pointer',
                      background: activeSearchIndex === index ? 'var(--brand-soft)' : undefined,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="t-strong">{hit.productName}</div>
                      <div className="t-sub t-mono">
                        {hit.variant.sku} · {variantAttributes(hit.variant)} · {hit.variant.currentStock} here
                      </div>
                      {availabilityByVariant[hit.variant.id] ? (
                        <div className="t-sub" style={{ marginTop: 4 }}>
                          {availabilityByVariant[hit.variant.id].stores
                            .filter((store) => !store.isOwnStore && Number(store.quantity) > 0)
                            .map((store) => `${store.storeName}: ${store.quantity}`)
                            .join(' · ') || 'No other shop has stock'}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {hit.variant.currentStock <= 0 ? (
                        <button className="btn btn-sm" type="button" onClick={(event) => { event.stopPropagation(); void checkAvailability(hit.variant.id) }} disabled={availabilityLoading === hit.variant.id}>
                          {availabilityLoading === hit.variant.id ? 'Checking…' : 'Other shops'}
                        </button>
                      ) : null}
                      <button className="btn btn-sm" type="button" onClick={(event) => { event.stopPropagation(); selectSearchHit(hit) }}>
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHead
              title={`Cart · ${cart.length} item${cart.length === 1 ? '' : 's'}`}
              right={
                cart.length > 0 ? (
                  <button className="btn btn-sm" type="button" onClick={handleClearCart} style={{ color: 'var(--danger)' }}>
                    Clear
                  </button>
                ) : null
              }
            />

            {cart.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart size={24} strokeWidth={1.8} />}
                title={CART_EMPTY_HEADING}
                body={CART_EMPTY_BODY}
              />
            ) : (
              <DataTable cols={['Item', 'Qty', 'Price', 'Discount', 'Total', '']} minWidth={720}>
                {cart.map((line) => (
                  <CartLineRow
                    key={line.variantId}
                    line={line}
                    onQuantityChange={handleQuantityChange}
                    onDiscountChange={handleDiscountChange}
                    onRemove={handleRemove}
                    disabled={isCharging}
                  />
                ))}
              </DataTable>
            )}

            <CardPad style={{ borderTop: '1px solid var(--border-soft)' }}>
              <SectionLabel>Whole-bill discount</SectionLabel>
              {cartDiscountMode === 'none' ? (
                <button className="btn btn-sm btn-ghost" type="button" onClick={() => setCartDiscountMode('percent')}>
                  Discount entire sale
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    className="fld-select"
                    aria-label="Discount type"
                    value={cartDiscountMode}
                    onChange={(e) => setCartDiscountMode(e.target.value as 'percent' | 'amount')}
                  >
                    <option value="percent">%</option>
                    <option value="amount">₹</option>
                  </select>
                  <input
                    className="fld-input num"
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label="Discount value"
                    value={cartDiscountValue}
                    onChange={(e) => setCartDiscountValue(e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <button
                    className="btn btn-sm btn-ghost"
                    type="button"
                    onClick={() => {
                      setCartDiscountMode('none')
                      setCartDiscountValue('')
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </CardPad>
          </Card>
        </div>

        {/* ---------------- Summary column ---------------- */}
        <div>
          <Card className="card-pad">
            <SectionLabel style={{ margin: 0 }}>Customer</SectionLabel>
            {customer ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 12 }}>
                  <div className="tb-ava" style={{ width: 42, height: 42 }}>
                    {(customer.name ?? 'C').trim().slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="t-strong" style={{ fontSize: 15 }}>
                      {isReturningCustomer ? 'Returning customer' : (customer.name ?? 'Customer attached')}
                    </div>
                    <div className="t-sub">{customer.phone ?? customer.email ?? 'No contact on file'}</div>
                  </div>
                </div>
                <button className="btn btn-sm" type="button" onClick={clearCustomer} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                  Remove customer
                </button>
              </>
            ) : (
              <>
                <div className="t-sub" style={{ marginTop: 6 }}>Walk-in customer</div>
                <input
                  className="fld-input"
                  style={{ width: '100%', marginTop: 8, height: 38 }}
                  value={customerSearchQuery}
                  aria-label="Search customers"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={customerSearchResults.length > 0}
                  aria-controls="billing-customer-search-results"
                  aria-activedescendant={activeCustomerSearchIndex >= 0 ? `billing-customer-result-${customerSearchResults[activeCustomerSearchIndex]?.id}` : undefined}
                  onChange={(e) => runCustomerSearch(e.target.value)}
                  onKeyDown={handleCustomerSearchKeyDown}
                  placeholder="Search by phone, email, or name…"
                />
                {customerSearchResults.length > 0 && (
                  <div id="billing-customer-search-results" className="res-box" role="listbox" aria-label="Customer search results" style={{ marginTop: 8 }}>
                    {customerSearchResults.map((c, index) => (
                      <button
                        key={c.id}
                        id={`billing-customer-result-${c.id}`}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        onMouseEnter={() => setActiveCustomerSearchIndex(index)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 4px',
                          background: activeCustomerSearchIndex === index ? 'var(--brand-soft)' : 'none',
                          border: 0,
                          borderBottom: '1px solid var(--border-soft)',
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                        aria-selected={activeCustomerSearchIndex === index}
                      >
                        <span className="t-strong">{c.name ?? 'Unnamed'}</span>
                        <span className="t-sub"> · {c.phone ?? c.email ?? ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!showNewCustomerForm ? (
                  <button className="btn btn-sm btn-ghost" type="button" onClick={() => setShowNewCustomerForm(true)} style={{ marginTop: 8 }}>
                    + New customer
                  </button>
                ) : (
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    <input className="fld-input" style={{ height: 38 }} value={newCustomerName} aria-label="Customer name" onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Name" />
                    <input className="fld-input" style={{ height: 38 }} value={newCustomerPhone} aria-label="Customer phone" onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone" />
                    <input className="fld-input" style={{ height: 38 }} value={newCustomerEmail} aria-label="Customer email" onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="Email" />
                  </div>
                )}
              </>
            )}
          </Card>

          <Card className="card-pad">
            <SectionLabel>Bill summary</SectionLabel>

            <div className="sum-row">
              <span>Subtotal</span>
              <span className="num">{inr(subtotal)}</span>
            </div>
            <div className="sum-row">
              <span>Discount</span>
              <span className="num" style={{ color: Number(cartDiscount) > 0 ? 'var(--success)' : undefined }}>
                {Number(cartDiscount) > 0 ? `−${inr(cartDiscount)}` : inr(cartDiscount)}
              </span>
            </div>
            {taxTreatment === 'cgst_sgst' ? (
              <>
                <div className="sum-row">
                  <span>CGST (item rates)</span>
                  <span className="num">{inr(estimatedCgst)}</span>
                </div>
                <div className="sum-row">
                  <span>SGST (item rates)</span>
                  <span className="num">{inr(estimatedSgst)}</span>
                </div>
              </>
            ) : (
              <div className="sum-row">
                <span>IGST (item rates)</span>
                <span className="num">{inr(taxEstimate)}</span>
              </div>
            )}
            <div className="sum-row">
              <span>Tax total</span>
              <span className="num">{inr(taxEstimate)}</span>
            </div>
            <div className="sum-row">
              <span>Final total</span>
              <span className="t-sub">Confirmed by server</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '12px 0 4px',
                borderTop: '1px solid var(--border-soft)',
                marginTop: 6,
              }}
            >
              <b style={{ fontSize: 15 }}>Current cart estimate</b>
              <b className="num" style={{ fontSize: 22, color: 'var(--brand-1)' }}>
                {inr(preChargeEstimate)}
              </b>
            </div>

            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{TAX_DISCLOSURE}</p>

            <SectionLabel style={{ marginTop: 14 }}>
              Payment method{' '}
              <span style={{ color: 'var(--muted-2)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>tap to select</span>
            </SectionLabel>

            <PaymentMethodGrid
              selected={tenderMethods}
              onToggle={toggleTenderMethod}
              rows={tenderRows}
              onRowChange={handleTenderRowChange}
              onAddRow={handleAddTenderRow}
              onRemoveRow={handleRemoveTenderRow}
              splitEnabled={splitEnabled}
              onToggleSplit={handleToggleSplit}
              disabled={isCharging}
            />

            {chargeError && (
              <div role="alert" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--danger-soft)', color: '#cf3030', fontSize: 12.5 }}>
                {chargeError}
              </div>
            )}

            <button
              className="btn btn-grad"
              type="button"
              onClick={handleCharge}
              disabled={isCharging || cart.length === 0 || !shiftId}
              aria-busy={isCharging}
              style={{ width: '100%', height: 46, marginTop: 12, justifyContent: 'center', fontSize: 15 }}
            >
              {isCharging ? 'Charging sale…' : isOnline ? `Charge ${inr(preChargeEstimate)}` : `Queue ${inr(preChargeEstimate)} offline`}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
              {isOnline
                ? 'Live connection · the server confirms the final total before the sale is recorded'
                : 'Queued on this device · the server confirms the final total when the connection returns'}
            </div>
          </Card>
        </div>
      </div>

      <ManagerApprovalModal
        open={showApprovalModal}
        onApproved={handleApproved}
        onCancel={() => setShowApprovalModal(false)}
      />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  )
}
