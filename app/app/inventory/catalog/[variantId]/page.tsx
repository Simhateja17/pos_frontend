'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { UNITS, allowsFractionalQuantity, unitSuffix } from '@/lib/units'
import {
  type Supplier,
  type SupplierProduct,
  getAuthenticatedSuppliers,
  getAuthenticatedSupplierProducts,
  createAuthenticatedSupplierProduct,
  updateAuthenticatedSupplierProduct,
  deleteAuthenticatedSupplierProduct,
} from '@/lib/api/authenticated-client'

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
  mrp: string | null
  listPrice: string | null
  movingAverageCost: string | null
  hsnSac: string | null
  purchaseUnit: string | null
  purchasePackSize: string | null
  trackInventory: boolean
  allowNegativeStock: boolean
  expiryDate: string | null
  taxRatePercent: string | null
  reorderThreshold: number
  identityLocked: boolean
  currentStock: number
  createdAt: string
}

type Product = {
  id: string
  name: string
  isActive: boolean
  category: string | null
  createdAt: string
  variants: Variant[]
}

type StockMovement = {
  id: string
  variantId: string
  movementType: 'sale' | 'receive' | 'adjustment' | 'return' | 'transfer'
  quantityDelta: number
  reasonCode: 'damage' | 'shrinkage_theft' | 'count_correction' | 'other' | null
  reasonNote: string | null
  createdBy: string | null
  createdAt: string
}

type ReasonCode = 'damage' | 'shrinkage_theft' | 'count_correction' | 'other'
type DetailTab = 'variants' | 'history' | 'suppliers'

const DETAIL_TABS: readonly { label: string; value: DetailTab }[] = [
  { label: 'Variants', value: 'variants' },
  { label: 'Stock history', value: 'history' },
  { label: 'Suppliers', value: 'suppliers' },
]

const SUPPLIER_LINK_EMPTY_STATE =
  'No suppliers linked to this product yet. Add one so its lead time feeds the reorder suggestion for this item.'

const IDENTITY_LOCK_NOTICE =
  "Size, color, and material can't be changed once stock has moved for this variant. Price and reorder threshold can still be edited anytime."
const CASHIER_ADJUST_ERROR = 'Only managers and owners can adjust stock.'
const GENERIC_MOVEMENT_ERROR = 'Something went wrong recording this stock movement. Try again.'
const HISTORY_EMPTY_STATE = 'No stock movements yet. Receive stock to get started.'
const LOAD_ERROR = "Couldn't load this variant. Check your connection and try again."

const REASON_LABELS: Record<ReasonCode, string> = {
  damage: 'Damage',
  shrinkage_theft: 'Shrinkage / theft',
  count_correction: 'Count correction',
  other: 'Other',
}

function variantAttributes(variant: Variant) {
  return [variant.size, variant.color, variant.material].filter(Boolean).join(' / ') || '-'
}

function movementTypeLabel(type: StockMovement['movementType']) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function VariantDetailPage() {
  const params = useParams<{ variantId: string }>()
  const variantId = params.variantId

  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [tab, setTab] = useState<DetailTab>('variants')
  const [history, setHistory] = useState<StockMovement[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [editPrice, setEditPrice] = useState('')
  const [editMrp, setEditMrp] = useState('')
  const [editCostPrice, setEditCostPrice] = useState('')
  const [editHsnSac, setEditHsnSac] = useState('')
  const [editPurchaseUnit, setEditPurchaseUnit] = useState('')
  const [editPurchasePackSize, setEditPurchasePackSize] = useState('')
  const [editExpiryDate, setEditExpiryDate] = useState('')
  const [editTrackInventory, setEditTrackInventory] = useState(true)
  const [editAllowNegativeStock, setEditAllowNegativeStock] = useState(false)
  const [editTaxRatePercent, setEditTaxRatePercent] = useState('')
  const [editReorderThreshold, setEditReorderThreshold] = useState('')
  const [editBarcode, setEditBarcode] = useState('')
  const [editUnit, setEditUnit] = useState('piece')
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveError, setReceiveError] = useState<string | null>(null)
  const [isReceiving, setIsReceiving] = useState(false)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState<ReasonCode>('damage')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferQty, setTransferQty] = useState('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[] | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)
  const [supplierLinkError, setSupplierLinkError] = useState<string | null>(null)

  const [linkFormOpen, setLinkFormOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SupplierProduct | null>(null)
  const [linkSupplierId, setLinkSupplierId] = useState('')
  const [linkLeadTimeDays, setLinkLeadTimeDays] = useState('7')
  const [linkUnitCost, setLinkUnitCost] = useState('')
  const [linkSupplierSku, setLinkSupplierSku] = useState('')
  const [linkMinOrderQty, setLinkMinOrderQty] = useState('')
  const [linkIsPrimary, setLinkIsPrimary] = useState(false)
  const [linkFormError, setLinkFormError] = useState<string | null>(null)
  const [isSavingLink, setIsSavingLink] = useState(false)

  const loadVariant = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.GET('/products', { headers })

    if (error || !data) {
      setIsLoading(false)
      setLoadError(LOAD_ERROR)
      return
    }

    const foundProduct = data.find((p) => p.variants.some((v) => v.id === variantId)) ?? null
    const foundVariant = foundProduct?.variants.find((v) => v.id === variantId) ?? null

    setIsLoading(false)

    if (!foundProduct || !foundVariant) {
      setLoadError(LOAD_ERROR)
      return
    }

    setProduct(foundProduct)
    setVariant(foundVariant)
    setEditPrice(foundVariant.price)
    setEditMrp(foundVariant.mrp ?? '')
    setEditCostPrice(foundVariant.movingAverageCost ?? '')
    setEditHsnSac(foundVariant.hsnSac ?? '')
    setEditPurchaseUnit(foundVariant.purchaseUnit ?? '')
    setEditPurchasePackSize(foundVariant.purchasePackSize ?? '')
    setEditExpiryDate(foundVariant.expiryDate ?? '')
    setEditTrackInventory(foundVariant.trackInventory)
    setEditAllowNegativeStock(foundVariant.allowNegativeStock)
    setEditTaxRatePercent(foundVariant.taxRatePercent ?? '')
    setEditReorderThreshold(String(foundVariant.reorderThreshold))
    setEditBarcode(foundVariant.barcode ?? '')
    setEditUnit(foundVariant.unitOfMeasure)
  }, [variantId])

  const loadHistory = useCallback(async () => {
    setHistoryError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.GET('/stock-movements', {
      params: { query: { variantId } },
      headers,
    })

    if (error || !data) {
      setHistoryError(LOAD_ERROR)
      return
    }

    setHistory(data)
  }, [variantId])

  const loadSupplierLinks = useCallback(async () => {
    setSupplierLinkError(null)
    try {
      const [links, allSuppliers] = await Promise.all([
        getAuthenticatedSupplierProducts(variantId),
        getAuthenticatedSuppliers(),
      ])
      setSupplierProducts(links)
      setSuppliers(allSuppliers)
    } catch (cause) {
      setSupplierLinkError(cause instanceof Error ? cause.message : 'Suppliers for this product are unavailable right now.')
    }
  }, [variantId])

  useEffect(() => {
    loadVariant()
    loadHistory()
    void loadSupplierLinks()
  }, [loadVariant, loadHistory, loadSupplierLinks])

  function openLinkCreate() {
    setEditingLink(null)
    setLinkSupplierId('')
    setLinkLeadTimeDays('7')
    setLinkUnitCost('')
    setLinkSupplierSku('')
    setLinkMinOrderQty('')
    setLinkIsPrimary((supplierProducts ?? []).length === 0)
    setLinkFormError(null)
    setLinkFormOpen(true)
  }

  function openLinkEdit(link: SupplierProduct) {
    setEditingLink(link)
    setLinkSupplierId(link.supplierId)
    setLinkLeadTimeDays(String(link.leadTimeDays))
    setLinkUnitCost(link.unitCost ?? '')
    setLinkSupplierSku(link.supplierSku ?? '')
    setLinkMinOrderQty(link.minOrderQty ? String(link.minOrderQty) : '')
    setLinkIsPrimary(link.isPrimary)
    setLinkFormError(null)
    setLinkFormOpen(true)
  }

  async function handleLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLinkFormError(null)

    const leadTimeDays = Number(linkLeadTimeDays)
    if (!editingLink && !linkSupplierId) {
      setLinkFormError('Choose a supplier.')
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setLinkFormError('Lead time must be a whole number of days, at least 1.')
      return
    }

    const body = {
      isPrimary: linkIsPrimary,
      leadTimeDays,
      unitCost: linkUnitCost.trim() ? Number(linkUnitCost) : undefined,
      supplierSku: linkSupplierSku.trim() || undefined,
      minOrderQty: linkMinOrderQty.trim() ? Number(linkMinOrderQty) : undefined,
    }

    setIsSavingLink(true)
    try {
      if (editingLink) {
        await updateAuthenticatedSupplierProduct(variantId, editingLink.id, body)
      } else {
        await createAuthenticatedSupplierProduct(variantId, { ...body, supplierId: linkSupplierId })
      }
      setLinkFormOpen(false)
      await loadSupplierLinks()
    } catch (cause) {
      setLinkFormError(cause instanceof Error ? cause.message : 'That supplier could not be saved.')
    } finally {
      setIsSavingLink(false)
    }
  }

  async function handleUnlink(link: SupplierProduct) {
    try {
      await deleteAuthenticatedSupplierProduct(variantId, link.id)
      await loadSupplierLinks()
    } catch (cause) {
      setSupplierLinkError(cause instanceof Error ? cause.message : 'That supplier link could not be removed.')
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !variant) return

    setEditError(null)
    setIsSavingEdit(true)

    const taxRatePercent = editTaxRatePercent.trim() ? Number(editTaxRatePercent) : null
    if (
      taxRatePercent !== null &&
      (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 100)
    ) {
      setEditError('Item tax rate must be between 0 and 100%.')
      setIsSavingEdit(false)
      return
    }

    const headers = await authHeaders()
    const { error } = await apiClient.PATCH('/products/{productId}/variants/{variantId}', {
      params: { path: { productId: product.id, variantId: variant.id } },
      body: {
        price: Number(editPrice),
        mrp: Number(editMrp),
        costPrice: editCostPrice.trim() ? Number(editCostPrice) : null,
        hsnSac: editHsnSac.trim() || null,
        purchaseUnit: editPurchaseUnit.trim() || null,
        purchasePackSize: editPurchasePackSize.trim() ? Number(editPurchasePackSize) : null,
        expiryDate: editExpiryDate || null,
        trackInventory: editTrackInventory,
        allowNegativeStock: editTrackInventory && editAllowNegativeStock,
        reorderThreshold: Number(editReorderThreshold),
        // Null clears a mis-typed code; undefined would leave it untouched.
        barcode: editBarcode.trim() || null,
        unitOfMeasure: editUnit as (typeof UNITS)[number]['value'],
        ...(taxRatePercent === null ? {} : { taxRatePercent }),
      },
      headers,
    })

    setIsSavingEdit(false)

    if (error) {
      setEditError(GENERIC_MOVEMENT_ERROR)
      return
    }

    await loadVariant()
  }

  async function toggleProductStatus() {
    if (!product) return
    const headers = await authHeaders()
    const { error } = await apiClient.PATCH('/products/{productId}', {
      params: { path: { productId: product.id } }, body: { isActive: !product.isActive }, headers,
    })
    if (error) { setEditError('Product status could not be changed. Try again.'); return }
    await loadVariant()
  }

  async function handleReceiveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!variant) return

    setReceiveError(null)
    setIsReceiving(true)

    const headers = await authHeaders()
    const { error } = await apiClient.POST('/stock-movements', {
      body: {
        variantId: variant.id,
        movementType: 'receive',
        quantityDelta: Number(receiveQty),
      },
      headers,
    })

    setIsReceiving(false)

    if (error) {
      setReceiveError(GENERIC_MOVEMENT_ERROR)
      return
    }

    setReceiveOpen(false)
    setSuccessMessage(`Stock received: ${receiveQty} units added to ${variantAttributes(variant)}`)
    setReceiveQty('')
    await Promise.all([loadVariant(), loadHistory()])
  }

  async function handleAdjustSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!variant) return

    setAdjustError(null)

    // WR-06: mirror CreateStockMovementSchema's "quantityDelta must not be
    // zero" refine client-side so a 0 entry gets a field-specific message
    // instead of the generic error (0 passes HTML5 required validation).
    if (Number(adjustQty) === 0) {
      setAdjustError('Quantity cannot be zero')
      return
    }

    setIsAdjusting(true)

    const headers = await authHeaders()
    const { error, response } = await apiClient.POST('/stock-movements', {
      body: {
        variantId: variant.id,
        movementType: 'adjustment',
        quantityDelta: Number(adjustQty),
        reasonCode: adjustReason,
        reasonNote: adjustReason === 'other' ? adjustNote : undefined,
      },
      headers,
    })

    setIsAdjusting(false)

    if (error) {
      const apiMessage = (error as { error?: string } | undefined)?.error
      setAdjustError(response?.status === 403 ? CASHIER_ADJUST_ERROR : apiMessage ?? GENERIC_MOVEMENT_ERROR)
      return
    }

    setAdjustOpen(false)
    setSuccessMessage(`Adjustment recorded: ${variantAttributes(variant)} updated`)
    setAdjustQty('')
    setAdjustReason('damage')
    setAdjustNote('')
    await Promise.all([loadVariant(), loadHistory()])
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!variant) return

    setTransferError(null)

    // WR-06: mirror CreateStockMovementSchema's "quantityDelta must not be
    // zero" refine client-side so a 0 entry gets a field-specific message
    // instead of the generic error (0 passes HTML5 required validation).
    if (Number(transferQty) === 0) {
      setTransferError('Quantity cannot be zero')
      return
    }

    setIsTransferring(true)

    const headers = await authHeaders()
    const { error } = await apiClient.POST('/stock-movements', {
      body: {
        variantId: variant.id,
        movementType: 'transfer',
        quantityDelta: Number(transferQty),
      },
      headers,
    })

    setIsTransferring(false)

    if (error) {
      setTransferError(GENERIC_MOVEMENT_ERROR)
      return
    }

    setTransferOpen(false)
    setSuccessMessage(`Transfer recorded: ${variantAttributes(variant)} updated`)
    setTransferQty('')
    await Promise.all([loadVariant(), loadHistory()])
  }

  const isLowStock = variant ? variant.currentStock <= variant.reorderThreshold : false

  if (isLoading) {
    return (
      <>
        <PageHead title="Variant" />
        <Card>
          <LoadingState label="Loading variant" />
        </Card>
      </>
    )
  }

  if (loadError || !product || !variant) {
    return (
      <>
        <PageHead title="Variant" />
        <Card>
          <ErrorState message={loadError ?? LOAD_ERROR} onRetry={() => void loadVariant()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={product.name}
        sub={`${variantAttributes(variant)} · SKU ${variant.sku}`}
        actions={
          <>
            <Badge tone={product.isActive ? 'green' : 'grey'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
            <button className="btn" onClick={() => void toggleProductStatus()}>{product.isActive ? 'Mark inactive' : 'Reactivate'}</button>
            <button className="btn btn-pri" disabled={!variant.trackInventory} onClick={() => setReceiveOpen(true)}>
              Receive stock
            </button>
            <button className="btn" disabled={!variant.trackInventory} onClick={() => setAdjustOpen(true)}>
              Adjust stock
            </button>
            <button className="btn" disabled={!variant.trackInventory} onClick={() => setTransferOpen(true)}>
              Transfer stock
            </button>
          </>
        }
      />

      {successMessage && (
        <Card>
          <CardPad style={{ color: 'var(--brand-1)', fontSize: 13 }}>{successMessage}</CardPad>
        </Card>
      )}

      <Card>
        <CardPad>
          <span
            style={{
              fontFamily: 'var(--display)',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
              color: isLowStock ? 'var(--warn)' : 'var(--brand-1)',
            }}
          >
            {variant.currentStock}
          </span>
          <span className="t-sub" style={{ marginLeft: 8 }}>
            {unitSuffix(variant.unitOfMeasure) || 'units'} in stock
          </span>
        </CardPad>
      </Card>

      <Card>
        <CardPad style={{ paddingBottom: 0 }}>
          <Tabs items={DETAIL_TABS} active={tab} onSelect={setTab} ariaLabel="Variant detail sections" />
        </CardPad>

        {tab === 'variants' && (
          <CardPad>
            <form onSubmit={handleEditSubmit}>
              {editError && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <Fld id="detail-size" label="Size">
                  <input id="detail-size" value={variant.size ?? ''} disabled />
                </Fld>
                <Fld id="detail-color" label="Color">
                  <input id="detail-color" value={variant.color ?? ''} disabled />
                </Fld>
                <Fld id="detail-material" label="Material">
                  <input id="detail-material" value={variant.material ?? ''} disabled />
                </Fld>
              </div>

              {variant.identityLocked && (
                <p className="t-sub" style={{ fontSize: 11.5, marginTop: 8 }}>
                  {IDENTITY_LOCK_NOTICE}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                <Fld id="edit-barcode" label="Barcode">
                  <input
                    id="edit-barcode"
                    inputMode="numeric"
                    maxLength={14}
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    placeholder="Scan or type, or leave blank if none"
                  />
                </Fld>
                <Fld id="edit-unit" label="Sold by">
                  <select id="edit-unit" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                    {UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </Fld>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                <Fld id="edit-mrp" label="MRP">
                  <input id="edit-mrp" type="number" min="0" step="0.01" required value={editMrp} onChange={(e) => setEditMrp(e.target.value)} />
                </Fld>
                <Fld id="edit-price" label={unitSuffix(editUnit) ? `Price per ${unitSuffix(editUnit)}` : 'Price'}>
                  <input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </Fld>
                <Fld id="edit-tax-rate" label="Item tax rate (%)">
                  <input
                    id="edit-tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editTaxRatePercent}
                    onChange={(e) => setEditTaxRatePercent(e.target.value)}
                    placeholder="Set item rate"
                  />
                </Fld>
                <Fld id="edit-reorder-threshold" label="Reorder threshold">
                  <input
                    id="edit-reorder-threshold"
                    type="number"
                    min="0"
                    step={allowsFractionalQuantity(editUnit) ? '0.001' : '1'}
                    required
                    value={editReorderThreshold}
                    onChange={(e) => setEditReorderThreshold(e.target.value)}
                  />
                </Fld>
              </div>

              <details style={{ marginTop: 12 }}>
                <summary className="t-strong" style={{ cursor: 'pointer' }}>Optional purchasing and stock details</summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
                  <Fld id="edit-cost-price" label="Cost price"><input id="edit-cost-price" type="number" min="0" step="0.01" value={editCostPrice} onChange={(e) => setEditCostPrice(e.target.value)} placeholder="Optional" /></Fld>
                  <Fld id="edit-expiry-date" label="Expiry date"><input id="edit-expiry-date" type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} /></Fld>
                  <Fld id="edit-purchase-unit" label="Purchase unit"><input id="edit-purchase-unit" value={editPurchaseUnit} onChange={(e) => setEditPurchaseUnit(e.target.value)} placeholder="Carton, case, bag…" /></Fld>
                  <Fld id="edit-purchase-pack-size" label="Units per purchase pack"><input id="edit-purchase-pack-size" type="number" min="0.001" step="0.001" value={editPurchasePackSize} onChange={(e) => setEditPurchasePackSize(e.target.value)} placeholder="Optional" /></Fld>
                  <Fld id="edit-hsn-sac" label="HSN/SAC"><input id="edit-hsn-sac" inputMode="numeric" value={editHsnSac} onChange={(e) => setEditHsnSac(e.target.value)} placeholder="Optional" /></Fld>
                </div>
                <label style={{ display: 'flex', gap: 8, marginTop: 10 }}><input type="checkbox" checked={editTrackInventory} onChange={(e) => setEditTrackInventory(e.target.checked)} /> Track inventory</label>
                <label style={{ display: 'flex', gap: 8, marginTop: 8, opacity: editTrackInventory ? 1 : 0.55 }}><input type="checkbox" checked={editAllowNegativeStock} disabled={!editTrackInventory} onChange={(e) => setEditAllowNegativeStock(e.target.checked)} /> Allow selling when stock reaches zero</label>
              </details>

              <button type="submit" className="btn btn-pri" disabled={isSavingEdit} style={{ marginTop: 10 }}>
                {isSavingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </CardPad>
        )}

        {tab === 'suppliers' && (
          <CardPad>
            <CardHead
              title="Suppliers"
              sub={supplierProducts ? `${supplierProducts.length} linked` : 'Loading…'}
              right={
                <button className="btn btn-sm btn-pri" onClick={openLinkCreate}>
                  Add supplier
                </button>
              }
            />
            {supplierLinkError && <ErrorState message={supplierLinkError} onRetry={() => void loadSupplierLinks()} />}
            {!supplierLinkError && supplierProducts && supplierProducts.length === 0 && (
              <EmptyState
                icon={<Badge tone="grey">-</Badge>}
                title="No suppliers linked"
                body={SUPPLIER_LINK_EMPTY_STATE}
                action={
                  <button className="btn btn-pri" onClick={openLinkCreate}>
                    Add supplier
                  </button>
                }
              />
            )}
            {!supplierLinkError && supplierProducts && supplierProducts.length > 0 && (
              <DataTable cols={['Supplier', 'Lead time', 'Cost', 'Supplier SKU', 'Min order', '', '']} minWidth={780}>
                {supplierProducts.map((link) => (
                  <tr key={link.id}>
                    <td className="t-strong">{link.supplierName}</td>
                    <td className="num">{link.leadTimeDays} days</td>
                    <td className="num t-sub">{link.unitCost ? `₹${link.unitCost}` : '-'}</td>
                    <td className="t-sub">{link.supplierSku ?? '-'}</td>
                    <td className="num t-sub">{link.minOrderQty ?? '-'}</td>
                    <td>{link.isPrimary && <Badge tone="green">Primary</Badge>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => openLinkEdit(link)}>
                          Edit
                        </button>
                        <button className="btn btn-sm" onClick={() => void handleUnlink(link)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </CardPad>
        )}

        {tab === 'history' && (
          <CardPad>
            {historyError && <ErrorState message={historyError} onRetry={() => void loadHistory()} />}
            {!historyError && history.length === 0 && <p className="t-sub">{HISTORY_EMPTY_STATE}</p>}
            {!historyError && history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((movement) => (
                  <div
                    key={movement.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge tone="grey">{movementTypeLabel(movement.movementType)}</Badge>
                      <span style={{ fontWeight: 700 }}>
                        {movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}
                      </span>
                      {movement.reasonCode && <span className="t-sub">{REASON_LABELS[movement.reasonCode]}</span>}
                    </div>
                    <span className="t-sub">{new Date(movement.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        )}
      </Card>

      {receiveOpen && (
        <Modal
          title="Receive stock"
          onClose={() => setReceiveOpen(false)}
          footer={
            <button type="submit" form="receive-form" className="btn btn-pri" disabled={isReceiving}>
              {isReceiving ? 'Saving…' : 'Receive stock'}
            </button>
          }
        >
          <form id="receive-form" onSubmit={handleReceiveSubmit}>
            {receiveError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {receiveError}
              </div>
            )}
            <Fld id="receive-qty" label="Quantity">
              <input
                id="receive-qty"
                type="number"
                min={0}
                step={allowsFractionalQuantity(variant.unitOfMeasure) ? 0.001 : 1}
                required
                autoFocus
                style={{ fontSize: 28, fontWeight: 700, textAlign: 'center' }}
                value={receiveQty}
                onChange={(e) => setReceiveQty(e.target.value)}
              />
            </Fld>
          </form>
        </Modal>
      )}

      {adjustOpen && (
        <Modal
          title="Adjust stock"
          onClose={() => setAdjustOpen(false)}
          footer={
            <button type="submit" form="adjust-form" className="btn btn-pri" disabled={isAdjusting}>
              {isAdjusting ? 'Saving…' : 'Adjust stock'}
            </button>
          }
        >
          <form id="adjust-form" onSubmit={handleAdjustSubmit}>
            {adjustError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {adjustError}
              </div>
            )}
            <Fld id="adjust-qty" label="Quantity">
              <input
                id="adjust-qty"
                type="number"
                step={allowsFractionalQuantity(variant.unitOfMeasure) ? 0.001 : 1}
                required
                autoFocus
                style={{ fontSize: 28, fontWeight: 700, textAlign: 'center' }}
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </Fld>
            <Fld id="adjust-reason" label="Reason">
              <select
                id="adjust-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value as ReasonCode)}
              >
                <option value="damage">Damage</option>
                <option value="shrinkage_theft">Shrinkage / theft</option>
                <option value="count_correction">Count correction</option>
                <option value="other">Other</option>
              </select>
            </Fld>
            {adjustReason === 'other' && (
              <Fld id="adjust-note" label="Notes">
                <input
                  id="adjust-note"
                  required
                  placeholder="Describe the reason for this adjustment"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
              </Fld>
            )}
          </form>
        </Modal>
      )}

      {linkFormOpen && (
        <Modal
          title={editingLink ? `Edit ${editingLink.supplierName}` : 'Add supplier'}
          onClose={() => setLinkFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setLinkFormOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="supplier-link-form" disabled={isSavingLink}>
                {isSavingLink ? 'Saving…' : editingLink ? 'Save changes' : 'Add supplier'}
              </button>
            </>
          }
        >
          <form id="supplier-link-form" onSubmit={handleLinkSubmit}>
            {linkFormError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {linkFormError}
              </div>
            )}

            {!editingLink && (
              <Fld id="link-supplier" label="Supplier">
                <select id="link-supplier" value={linkSupplierId} onChange={(e) => setLinkSupplierId(e.target.value)} required>
                  <option value="" disabled>
                    Choose a supplier
                  </option>
                  {(suppliers ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </Fld>
            )}

            <Fld id="link-lead" label="Lead time (days)">
              <input
                id="link-lead"
                type="number"
                min={1}
                step={1}
                value={linkLeadTimeDays}
                onChange={(e) => setLinkLeadTimeDays(e.target.value)}
              />
            </Fld>
            <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              How many days this supplier takes to deliver this specific product. The primary supplier's lead time
              feeds this product's reorder suggestion.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="link-cost" label="Unit cost (₹)">
                <input
                  id="link-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={linkUnitCost}
                  onChange={(e) => setLinkUnitCost(e.target.value)}
                />
              </Fld>
              <Fld id="link-sku" label="Supplier's SKU">
                <input id="link-sku" value={linkSupplierSku} onChange={(e) => setLinkSupplierSku(e.target.value)} />
              </Fld>
            </div>

            <Fld id="link-moq" label="Minimum order quantity">
              <input
                id="link-moq"
                type="number"
                min={1}
                step={1}
                value={linkMinOrderQty}
                onChange={(e) => setLinkMinOrderQty(e.target.value)}
              />
            </Fld>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
              <input type="checkbox" checked={linkIsPrimary} onChange={(e) => setLinkIsPrimary(e.target.checked)} />
              Primary supplier for this product
            </label>
          </form>
        </Modal>
      )}

      {transferOpen && (
        <Modal
          title="Transfer stock"
          onClose={() => setTransferOpen(false)}
          footer={
            <button type="submit" form="transfer-form" className="btn btn-pri" disabled={isTransferring}>
              {isTransferring ? 'Saving…' : 'Transfer stock'}
            </button>
          }
        >
          <form id="transfer-form" onSubmit={handleTransferSubmit}>
            {transferError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {transferError}
              </div>
            )}
            <Fld id="transfer-qty" label="Quantity">
              <input
                id="transfer-qty"
                type="number"
                step={allowsFractionalQuantity(variant.unitOfMeasure) ? 0.001 : 1}
                required
                autoFocus
                style={{ fontSize: 28, fontWeight: 700, textAlign: 'center' }}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
              />
            </Fld>
          </form>
        </Modal>
      )}
    </>
  )
}
