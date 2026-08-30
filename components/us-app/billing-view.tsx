'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { Check, Mail, Minus, Plus, Printer, Search, ShoppingCart } from 'lucide-react'
import {
  AuthenticatedRequestError,
  createAuthenticatedSale,
  getAuthenticatedCustomerMatches,
  getAuthenticatedProducts,
  getAuthenticatedShifts,
  resendAuthenticatedReceipt,
  type Customer,
  type Product,
  type Sale,
  type ShiftHistoryEntry,
  type Variant,
} from '@/lib/api/authenticated-client'
import { useUsAppContext } from './us-app-shell'
import { UsCard, UsCardBody, UsCardHeader, UsEmptyState, UsErrorState, UsInlineLoader, UsLoadingState, UsPageHead } from './states'
import { exactScannerMatches } from '@/lib/hardware/barcode-scanner'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

type CatalogVariant = { product: Product; variant: Variant }
type CartLine = CatalogVariant & { quantity: number }

function money(value: number | string) { return usd.format(Number(value)) }

function errorMessage(error: unknown) {
  return error instanceof AuthenticatedRequestError || error instanceof Error ? error.message : 'Checkout data is unavailable right now.'
}

export function UsBillingView() {
  const { context } = useUsAppContext()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [shifts, setShifts] = useState<ShiftHistoryEntry[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [search, setSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card')
  const [paymentReference, setPaymentReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [charging, setCharging] = useState(false)
  const [resending, setResending] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [receiptLines, setReceiptLines] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const focusScanner = useCallback(() => {
    scanInputRef.current?.focus()
  }, [])

  useEffect(() => {
    focusScanner()
    const captureScannerStart = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editing = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || Boolean(target?.isContentEditable)
      if (editing || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return
      if (document.querySelector('[role="dialog"]')) return
      event.preventDefault()
      setSearch(event.key)
      focusScanner()
    }
    window.addEventListener('keydown', captureScannerStart)
    return () => window.removeEventListener('keydown', captureScannerStart)
  }, [focusScanner])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextProducts, nextCustomers, nextShifts] = await Promise.all([
        getAuthenticatedProducts(),
        getAuthenticatedCustomerMatches(),
        getAuthenticatedShifts(),
      ])
      setProducts(nextProducts)
      setCustomers(nextCustomers)
      setShifts(nextShifts)
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomerLoading(true)
      void getAuthenticatedCustomerMatches(customerSearch.trim())
        .then(setCustomers)
        .catch((nextError) => setError(errorMessage(nextError)))
        .finally(() => setCustomerLoading(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [customerSearch])

  const catalog = useMemo<CatalogVariant[]>(() => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))), [products])
  const visibleCatalog = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return catalog
    return catalog.filter(({ product, variant }) => [product.name, product.category, variant.sku, variant.barcode, variant.size, variant.color, variant.material].some((value) => value?.toLowerCase().includes(needle)))
  }, [catalog, search])
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? null
  const openShift = shifts.find((shift) => shift.closedAt === null) ?? null
  const taxRate = Number(context?.store?.combinedTaxRatePercent ?? 0) / 100
  const subtotal = cart.reduce((sum, line) => sum + Number(line.variant.price) * line.quantity, 0)
  const estimatedTax = Number(cart.reduce((sum, line) => {
    if (!line.variant.isTaxable) return sum
    const itemRate = line.variant.taxRatePercent === null || line.variant.taxRatePercent === undefined
      ? taxRate
      : Number(line.variant.taxRatePercent) / 100
    return sum + Number(line.variant.price) * line.quantity * itemRate
  }, 0).toFixed(2))
  const estimatedTotal = Number((subtotal + estimatedTax).toFixed(2))

  function addToCart(item: CatalogVariant) {
    if (item.variant.currentStock <= 0) return
    setLastSale(null)
    setNotice(null)
    setCart((current) => {
      const existing = current.find((line) => line.variant.id === item.variant.id)
      if (existing) return current.map((line) => line.variant.id === item.variant.id ? { ...line, quantity: Math.min(line.quantity + 1, item.variant.currentStock) } : line)
      return [...current, { ...item, quantity: 1 }]
    })
    setSearch('')
    focusScanner()
  }

  function handleScanKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const value = search.trim()
    const matches = exactScannerMatches(catalog, value)
    if (matches.length === 1) {
      addToCart(matches[0])
      setNotice(`Added ${matches[0].product.name}. Scanner ready.`)
    } else {
      setError(matches.length > 1 ? 'More than one product uses that code.' : `No product found for “${value}”.`)
      focusScanner()
    }
  }

  function changeQuantity(variantId: string, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.variant.id !== variantId) return [line]
      const quantity = Math.min(line.variant.currentStock, line.quantity + delta)
      return quantity > 0 ? [{ ...line, quantity }] : []
    }))
  }

  async function charge() {
    if (!openShift || cart.length === 0) return
    setCharging(true)
    setError(null)
    setNotice(null)
    const linesAtCharge = [...cart]
    try {
      const sale = await createAuthenticatedSale({
        clientSaleId: crypto.randomUUID(),
        shiftId: openShift.id,
        lines: linesAtCharge.map((line) => ({ variantId: line.variant.id, quantity: line.quantity })),
        payments: [{ method: paymentMethod, amount: estimatedTotal.toFixed(2), ...(paymentReference.trim() ? { referenceCode: paymentReference.trim() } : {}) }],
        ...(selectedCustomer ? { customer: { id: selectedCustomer.id } } : {}),
        ...(receiptEmail.trim() ? { receiptEmail: receiptEmail.trim() } : {}),
      })
      setLastSale(sale)
      setReceiptLines(linesAtCharge)
      setCart([])
      setPaymentReference('')
      setNotice('Sale completed. The server returned an authoritative receipt record.')
      focusScanner()
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setCharging(false)
    }
  }

  async function resendReceipt() {
    if (!lastSale) return
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      const result = await resendAuthenticatedReceipt(lastSale.id, receiptEmail.trim() || undefined)
      setNotice(`Receipt sent to ${result.email}.`)
    } catch (nextError) {
      setError(errorMessage(nextError))
    } finally {
      setResending(false)
    }
  }

  if (loading) return <><UsPageHead title="Fast Checkout" sub="Real products, customers, shifts, and sales" /><UsLoadingState label="Loading checkout" rows={8} /></>
  if (error && products.length === 0) return <><UsPageHead title="Fast Checkout" sub="Real products, customers, shifts, and sales" /><UsCard><UsErrorState message={error} onRetry={() => void load()} /></UsCard></>

  return (
    <>
      <UsPageHead title="Fast Checkout" sub="Cash and card checkout against the selected International store" actions={<Link className="btn" href="/us/dashboard/orders">View orders</Link>} />
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {notice ? <div className="notice success" role="status" style={{ marginBottom: 14 }}>{notice}</div> : null}
      {!openShift ? <div className="notice" style={{ marginBottom: 14 }}>No open shift was returned for this tenant. A manager must open a shift on a register before a sale can be completed.</div> : null}

      <div className="grid cols-checkout">
        <UsCard>
          <UsCardHeader title="Product catalog" sub={`${catalog.length} variants returned by the live catalog`} right={<div className="search" style={{ maxWidth: 260 }}><Search className="search-icon" aria-hidden="true" /><input ref={scanInputRef} autoFocus className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={handleScanKeyDown} placeholder="Scan barcode or search…" aria-label="Scan barcode or search products" /></div>} />
          {visibleCatalog.length === 0 ? <UsEmptyState icon={<ShoppingCart size={24} />} title={catalog.length === 0 ? 'No products in this store' : 'No matching variants'} body={catalog.length === 0 ? 'Products must be created or imported before checkout can sell them.' : 'Try a different product name, SKU, or barcode.'} /> : (
            <div className="product-grid">
              {visibleCatalog.map((item) => {
                const variantLabel = [item.variant.sku, item.variant.size, item.variant.color, item.variant.material].filter(Boolean).join(' · ')
                return <button className="prod-card" type="button" key={item.variant.id} disabled={item.variant.currentStock <= 0} onClick={() => addToCart(item)} aria-label={`Add ${item.product.name} ${variantLabel}`}>
                  <div className="prod-swatch" />
                  <div className="prod-info"><b>{item.product.name}</b><span>{variantLabel || item.variant.unitOfMeasure} · {item.variant.currentStock} in stock</span><strong className="num">{money(item.variant.price)}</strong></div>
                </button>
              })}
            </div>
          )}
        </UsCard>

        <UsCard className="cart-flex">
          <UsCardHeader title="Cart" sub={selectedCustomer ? `Customer: ${selectedCustomer.name || selectedCustomer.email || 'Selected customer'}` : 'No customer attached'} right={openShift ? <span className="badge b-green">Shift open</span> : <span className="badge b-amber">Shift required</span>} />
          <div className="cart-items">
            {cart.length === 0 ? <UsEmptyState icon={<ShoppingCart size={24} />} title="Cart is empty" body="Choose a live catalog variant to start a sale." /> : cart.map((line) => <div className="cart-line" key={line.variant.id}><div className="cart-name"><b>{line.product.name}</b><span>{[line.variant.sku, line.variant.size, line.variant.color].filter(Boolean).join(' · ')}</span></div><div className="cart-right"><div className="qty-stepper"><button className="qty-btn" type="button" onClick={() => changeQuantity(line.variant.id, -1)} aria-label={`Remove one ${line.product.name}`}><Minus size={13} /></button><span className="qty-num">{line.quantity}</span><button className="qty-btn" type="button" onClick={() => changeQuantity(line.variant.id, 1)} disabled={line.quantity >= line.variant.currentStock} aria-label={`Add one ${line.product.name}`}><Plus size={13} /></button></div><span className="line-total num">{money(Number(line.variant.price) * line.quantity)}</span></div></div>)}
          </div>
          <div className="cart-foot">
            <div className="field" style={{ marginBottom: 10 }}><label htmlFor="us-customer-search">Customer lookup</label><input id="us-customer-search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Name, phone, or email" />{customerLoading ? <small><UsInlineLoader label="Looking up customers…" /></small> : null}<select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} aria-label="Select customer"><option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name || customer.email || customer.phone || customer.id}</option>)}</select></div>
            <div className="field" style={{ marginBottom: 10 }}><label htmlFor="us-receipt-email">Receipt email (optional)</label><input id="us-receipt-email" type="email" value={receiptEmail} onChange={(event) => setReceiptEmail(event.target.value)} placeholder="customer@example.com" /></div>
            <div className="total-row"><span>Subtotal</span><span className="num">{money(subtotal)}</span></div>
            <div className="total-row"><span>Estimated sales tax (item rates)</span><span className="num">{money(estimatedTax)}</span></div>
            <div className="total-row total-grand"><span>Estimated total</span><span className="num">{money(estimatedTotal)}</span></div>
            <div className="notice" style={{ marginTop: 10 }}>The backend recomputes tax, stock, and the final total when the sale is charged.</div>
            <div className="pay-grid"><button type="button" className={`btn btn-lg ${paymentMethod === 'card' ? 'btn-primary' : ''}`} onClick={() => setPaymentMethod('card')}><CreditCardIcon />Card</button><button type="button" className={`btn btn-lg ${paymentMethod === 'cash' ? 'btn-primary' : ''}`} onClick={() => setPaymentMethod('cash')}><DollarIcon />Cash</button></div>
            <div className="field" style={{ marginTop: 8 }}><label htmlFor="us-payment-reference">Payment reference (optional)</label><input id="us-payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder={paymentMethod === 'card' ? 'Terminal reference' : 'Cash note'} /></div>
            <button type="button" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 9 }} disabled={charging || !openShift || cart.length === 0} onClick={() => void charge()}>{charging ? <UsInlineLoader label="Charging…" /> : <><ShoppingCart size={16} />Charge {money(estimatedTotal)}</>}</button>
          </div>
        </UsCard>
      </div>

      {lastSale ? <UsCard style={{ marginTop: 14 }}><UsCardHeader title="Receipt" sub={`Sale ${lastSale.invoiceNumber || lastSale.id} · ${dateTime.format(new Date(lastSale.createdAt))}`} right={<span className="badge b-green"><Check size={12} />Completed</span>} /><UsCardBody><div className="grid cols-2"><div className="receipt-pre"><b>{lastSale.businessName || context?.tenant.businessName || 'International store'}</b><br />Sale {lastSale.invoiceNumber || lastSale.id}<br /><hr />{receiptLines.map((line) => <div key={line.variant.id}>{line.product.name} × {line.quantity} <span style={{ float: 'right' }}>{money(Number(line.variant.price) * line.quantity)}</span></div>)}<hr />Subtotal <span style={{ float: 'right' }}>{money(lastSale.subtotal)}</span><br />Sales tax <span style={{ float: 'right' }}>{money(lastSale.taxAmount)}</span><br /><b>Total <span style={{ float: 'right' }}>{money(lastSale.totalAmount)}</span></b></div><div><div className="field"><label htmlFor="us-resend-email">Send this receipt by email</label><input id="us-resend-email" type="email" value={receiptEmail} onChange={(event) => setReceiptEmail(event.target.value)} placeholder="Uses customer email when blank" /></div><div className="page-actions" style={{ marginTop: 12 }}><button type="button" className="btn" onClick={() => window.print()}><Printer size={14} />Print</button><button type="button" className="btn btn-primary" onClick={() => void resendReceipt()} disabled={resending}><Mail size={14} />{resending ? 'Sending…' : 'Send receipt'}</button></div></div></div></UsCardBody></UsCard> : null}
    </>
  )
}

function CreditCardIcon() { return <span aria-hidden="true" style={{ fontSize: 15 }}>▣</span> }
function DollarIcon() { return <span aria-hidden="true" style={{ fontSize: 15 }}>$</span> }
