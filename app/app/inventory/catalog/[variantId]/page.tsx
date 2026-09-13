'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { UNITS, allowsFractionalQuantity, unitSuffix } from '@/lib/units'
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT, type MessageKey } from '@/lib/i18n/i18n'
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

function variantAttributes(variant: Variant) {
  return [variant.size, variant.color, variant.material].filter(Boolean).join(' / ') || '-'
}

function movementTypeLabel(t: ReturnType<typeof useT>, type: StockMovement['movementType']) {
  return t(`inventory.detail.${type}` as MessageKey)
}

export default function VariantDetailPage() {
  const t = useT()
  const { dateLocale } = useAppRegion()
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
      setLoadError(t('inventory.detail.genericLoadError'))
      return
    }

    const foundProduct = data.find((p) => p.variants.some((v) => v.id === variantId)) ?? null
    const foundVariant = foundProduct?.variants.find((v) => v.id === variantId) ?? null

    setIsLoading(false)

    if (!foundProduct || !foundVariant) {
      setLoadError(t('inventory.detail.productNotFound'))
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
    // t is intentionally omitted: changing locale must not refetch this variant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId])

  const loadHistory = useCallback(async () => {
    setHistoryError(null)

    const headers = await authHeaders()
    const { data, error } = await apiClient.GET('/stock-movements', {
      params: { query: { variantId } },
      headers,
    })

    if (error || !data) {
      setHistoryError(t('inventory.detail.genericLoadError'))
      return
    }

    setHistory(data)
    // t is intentionally omitted: changing locale must not refetch history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setSupplierLinkError(cause instanceof Error ? cause.message : t('inventory.detail.supplierError'))
    }
    // t is intentionally omitted: changing locale must not refetch supplier links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setLinkFormError(t('inventory.detail.supplierChoose'))
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setLinkFormError(t('inventory.detail.leadTimeError'))
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
      setLinkFormError(cause instanceof Error ? cause.message : t('inventory.detail.supplierError'))
    } finally {
      setIsSavingLink(false)
    }
  }

  async function handleUnlink(link: SupplierProduct) {
    try {
      await deleteAuthenticatedSupplierProduct(variantId, link.id)
      await loadSupplierLinks()
    } catch (cause) {
      setSupplierLinkError(cause instanceof Error ? cause.message : t('inventory.detail.supplierError'))
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
      setEditError(t('inventory.newProduct.validationTax', { variant: '' }))
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
      setEditError(t('inventory.detail.genericSaveError'))
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
    if (error) { setEditError(t('inventory.detail.productStatusError')); return }
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
      setReceiveError(t('inventory.detail.movementError'))
      return
    }

    setReceiveOpen(false)
    setSuccessMessage(t('inventory.detail.successReceive', { quantity: receiveQty, variant: variantAttributes(variant) }))
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
      setAdjustError(t('inventory.detail.quantityZero'))
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
      setAdjustError(response?.status === 403 ? t('inventory.detail.cashierAdjust') : apiMessage ?? t('inventory.detail.movementError'))
      return
    }

    setAdjustOpen(false)
    setSuccessMessage(t('inventory.detail.successAdjustment', { variant: variantAttributes(variant) }))
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
      setTransferError(t('inventory.detail.quantityZero'))
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
      setTransferError(t('inventory.detail.movementError'))
      return
    }

    setTransferOpen(false)
    setSuccessMessage(t('inventory.detail.successTransfer', { variant: variantAttributes(variant) }))
    setTransferQty('')
    await Promise.all([loadVariant(), loadHistory()])
  }

  const isLowStock = variant ? variant.currentStock <= variant.reorderThreshold : false

  if (isLoading) {
    return (
      <>
        <PageHead title={t('inventory.detail.variantsTab')} />
        <Card>
          <LoadingState label={t('inventory.detail.loadingVariant')} />
        </Card>
      </>
    )
  }

  if (loadError || !product || !variant) {
    return (
      <>
        <PageHead title={t('inventory.detail.variantsTab')} />
        <Card>
          <ErrorState message={loadError ?? t('inventory.detail.genericLoadError')} onRetry={() => void loadVariant()} />
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
            <Badge tone={product.isActive ? 'green' : 'grey'}>{product.isActive ? t('inventory.detail.active') : t('inventory.detail.inactive')}</Badge>
            <button className="btn" onClick={() => void toggleProductStatus()}>{product.isActive ? t('inventory.detail.markInactive') : t('inventory.detail.reactivate')}</button>
            <button className="btn btn-pri" disabled={!variant.trackInventory} onClick={() => setReceiveOpen(true)}>
              {t('inventory.detail.receiveStock')}
            </button>
            <button className="btn" disabled={!variant.trackInventory} onClick={() => setAdjustOpen(true)}>
              {t('inventory.detail.adjustStock')}
            </button>
            <button className="btn" disabled={!variant.trackInventory} onClick={() => setTransferOpen(true)}>
              {t('inventory.detail.transferStock')}
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
            {unitSuffix(variant.unitOfMeasure) || t('inventory.units.piece')} {t('inventory.detail.inStock')}
          </span>
        </CardPad>
      </Card>

      <Card>
        <CardPad style={{ paddingBottom: 0 }}>
          <Tabs items={[
            { label: t('inventory.detail.variantsTab'), value: 'variants' as const },
            { label: t('inventory.detail.stockHistoryTab'), value: 'history' as const },
            { label: t('inventory.detail.suppliersTab'), value: 'suppliers' as const },
          ]} active={tab} onSelect={setTab} ariaLabel={t('inventory.detail.variantDetails')} />
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
                <Fld id="detail-size" label={t('inventory.newProduct.sizePack')}>
                  <input id="detail-size" value={variant.size ?? ''} disabled />
                </Fld>
                <Fld id="detail-color" label={t('inventory.newProduct.color')}>
                  <input id="detail-color" value={variant.color ?? ''} disabled />
                </Fld>
                <Fld id="detail-material" label={t('inventory.newProduct.material')}>
                  <input id="detail-material" value={variant.material ?? ''} disabled />
                </Fld>
              </div>

              {variant.identityLocked && (
                <p className="t-sub" style={{ fontSize: 11.5, marginTop: 8 }}>
                  {t('inventory.detail.identityLocked')}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                <Fld id="edit-barcode" label={t('inventory.detail.barcode')}>
                  <input
                    id="edit-barcode"
                    inputMode="numeric"
                    maxLength={14}
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    placeholder={t('inventory.newProduct.barcodePlaceholder')}
                  />
                </Fld>
                <Fld id="edit-unit" label={t('inventory.detail.soldBy')}>
                  <select id="edit-unit" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                    {UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {t(`inventory.units.${unit.value}` as MessageKey)}
                      </option>
                    ))}
                  </select>
                </Fld>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                <Fld id="edit-mrp" label={t('inventory.detail.mrp')}>
                  <input id="edit-mrp" type="number" min="0" step="0.01" required value={editMrp} onChange={(e) => setEditMrp(e.target.value)} />
                </Fld>
                <Fld id="edit-price" label={unitSuffix(editUnit) ? t('inventory.newProduct.pricePer', { unit: unitSuffix(editUnit) }) : t('inventory.catalog.cols.price')}>
                  <input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </Fld>
                <Fld id="edit-tax-rate" label={t('inventory.newProduct.gstRate')}>
                  <input
                    id="edit-tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editTaxRatePercent}
                    onChange={(e) => setEditTaxRatePercent(e.target.value)}
                    placeholder={t('inventory.newProduct.gstRatePlaceholder')}
                  />
                </Fld>
                <Fld id="edit-reorder-threshold" label={t('inventory.detail.reorderAt')}>
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
                <summary className="t-strong" style={{ cursor: 'pointer' }}>{t('inventory.newProduct.moreVariantDetails')}</summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
                  <Fld id="edit-cost-price" label={t('inventory.detail.costPrice')}><input id="edit-cost-price" type="number" min="0" step="0.01" value={editCostPrice} onChange={(e) => setEditCostPrice(e.target.value)} placeholder={t('inventory.newProduct.optional')} /></Fld>
                  <Fld id="edit-expiry-date" label={t('inventory.detail.expiryDate')}><input id="edit-expiry-date" type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} /></Fld>
                  <Fld id="edit-purchase-unit" label={t('inventory.detail.purchaseUnit')}><input id="edit-purchase-unit" value={editPurchaseUnit} onChange={(e) => setEditPurchaseUnit(e.target.value)} placeholder={t('inventory.newProduct.purchaseUnit')} /></Fld>
                  <Fld id="edit-purchase-pack-size" label={t('inventory.detail.purchasePackSize')}><input id="edit-purchase-pack-size" type="number" min="0.001" step="0.001" value={editPurchasePackSize} onChange={(e) => setEditPurchasePackSize(e.target.value)} placeholder={t('inventory.newProduct.optional')} /></Fld>
                  <Fld id="edit-hsn-sac" label={t('inventory.detail.hsnSac')}><input id="edit-hsn-sac" inputMode="numeric" value={editHsnSac} onChange={(e) => setEditHsnSac(e.target.value)} placeholder={t('inventory.newProduct.optional')} /></Fld>
                </div>
                <label style={{ display: 'flex', gap: 8, marginTop: 10 }}><input type="checkbox" checked={editTrackInventory} onChange={(e) => setEditTrackInventory(e.target.checked)} /> {t('inventory.detail.trackInventory')}</label>
                <label style={{ display: 'flex', gap: 8, marginTop: 8, opacity: editTrackInventory ? 1 : 0.55 }}><input type="checkbox" checked={editAllowNegativeStock} disabled={!editTrackInventory} onChange={(e) => setEditAllowNegativeStock(e.target.checked)} /> {t('inventory.detail.allowNegative')}</label>
              </details>

              <button type="submit" className="btn btn-pri" disabled={isSavingEdit} style={{ marginTop: 10 }}>
                {isSavingEdit ? t('inventory.detail.saving') : t('inventory.detail.save')}
              </button>
            </form>
          </CardPad>
        )}

        {tab === 'suppliers' && (
          <CardPad>
            <CardHead
              title={t('inventory.detail.suppliersTab')}
              sub={supplierProducts
                ? supplierProducts.length === 1
                  ? t('inventory.detail.linkedOne')
                  : t('inventory.detail.linkedMany', { count: supplierProducts.length })
                : t('inventory.detail.loadingVariant')}
              right={
                <button className="btn btn-sm btn-pri" onClick={openLinkCreate}>
                  {t('inventory.detail.addSupplier')}
                </button>
              }
            />
            {supplierLinkError && <ErrorState message={supplierLinkError} onRetry={() => void loadSupplierLinks()} />}
            {!supplierLinkError && supplierProducts && supplierProducts.length === 0 && (
              <EmptyState
                icon={<Badge tone="grey">-</Badge>}
                title={t('inventory.detail.noSuppliers')}
                body={t('inventory.detail.noSuppliersBody')}
                action={
                  <button className="btn btn-pri" onClick={openLinkCreate}>
                    {t('inventory.detail.addSupplier')}
                  </button>
                }
              />
            )}
            {!supplierLinkError && supplierProducts && supplierProducts.length > 0 && (
              <DataTable cols={[t('inventory.detail.supplier'), t('inventory.detail.leadTime'), t('inventory.detail.costPrice'), t('inventory.detail.supplierSku'), t('inventory.detail.minOrder'), t('inventory.detail.primary'), t('inventory.detail.actions')]} minWidth={780}>
                {supplierProducts.map((link) => (
                  <tr key={link.id}>
                    <td className="t-strong">{link.supplierName}</td>
                    <td className="num">{link.leadTimeDays === 1 ? t('inventory.detail.daysOne') : t('inventory.detail.daysMany', { count: link.leadTimeDays })}</td>
                    <td className="num t-sub">{link.unitCost ? `₹${link.unitCost}` : '-'}</td>
                    <td className="t-sub">{link.supplierSku ?? '-'}</td>
                    <td className="num t-sub">{link.minOrderQty ?? '-'}</td>
                    <td>{link.isPrimary && <Badge tone="green">{t('inventory.detail.primary')}</Badge>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => openLinkEdit(link)}>
                          {t('inventory.detail.edit')}
                        </button>
                        <button className="btn btn-sm" onClick={() => void handleUnlink(link)}>
                          {t('inventory.detail.unlink')}
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
            {!historyError && history.length === 0 && <p className="t-sub">{t('inventory.detail.noHistoryBody')}</p>}
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
                      <Badge tone="grey">{movementTypeLabel(t, movement.movementType)}</Badge>
                      <span style={{ fontWeight: 700 }}>
                        {movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}
                      </span>
                      {movement.reasonCode && <span className="t-sub">{t(`inventory.detail.reasons.${movement.reasonCode === 'shrinkage_theft' ? 'shrinkageTheft' : movement.reasonCode === 'count_correction' ? 'countCorrection' : movement.reasonCode}` as MessageKey)}</span>}
                    </div>
                    <span className="t-sub">{new Date(movement.createdAt).toLocaleString(dateLocale)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        )}
      </Card>

      {receiveOpen && (
        <Modal
          title={t('inventory.detail.receiveTitle')}
          onClose={() => setReceiveOpen(false)}
          footer={
            <button type="submit" form="receive-form" className="btn btn-pri" disabled={isReceiving}>
              {isReceiving ? t('inventory.detail.receiving') : t('inventory.detail.receiveStock')}
            </button>
          }
        >
          <form id="receive-form" onSubmit={handleReceiveSubmit}>
            {receiveError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {receiveError}
              </div>
            )}
            <Fld id="receive-qty" label={t('inventory.detail.quantity')}>
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
          title={t('inventory.detail.adjustTitle')}
          onClose={() => setAdjustOpen(false)}
          footer={
            <button type="submit" form="adjust-form" className="btn btn-pri" disabled={isAdjusting}>
              {isAdjusting ? t('inventory.detail.adjusting') : t('inventory.detail.adjustStock')}
            </button>
          }
        >
          <form id="adjust-form" onSubmit={handleAdjustSubmit}>
            {adjustError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {adjustError}
              </div>
            )}
            <Fld id="adjust-qty" label={t('inventory.detail.quantity')}>
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
            <Fld id="adjust-reason" label={t('inventory.detail.reason')}>
              <select
                id="adjust-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value as ReasonCode)}
              >
                <option value="damage">{t('inventory.detail.reasons.damage')}</option>
                <option value="shrinkage_theft">{t('inventory.detail.reasons.shrinkageTheft')}</option>
                <option value="count_correction">{t('inventory.detail.reasons.countCorrection')}</option>
                <option value="other">{t('inventory.detail.reasons.other')}</option>
              </select>
            </Fld>
            {adjustReason === 'other' && (
              <Fld id="adjust-note" label={t('inventory.detail.movementNote')}>
                <input
                  id="adjust-note"
                  required
                  placeholder={t('inventory.detail.movementNotePlaceholder')}
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
          title={editingLink ? t('inventory.detail.editSupplierTitle', { name: editingLink.supplierName }) : t('inventory.detail.addSupplier')}
          onClose={() => setLinkFormOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setLinkFormOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="supplier-link-form" disabled={isSavingLink}>
                {isSavingLink ? t('inventory.detail.saving') : editingLink ? t('inventory.detail.save') : t('inventory.detail.addSupplier')}
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
              <Fld id="link-supplier" label={t('inventory.detail.supplier')}>
                <select id="link-supplier" value={linkSupplierId} onChange={(e) => setLinkSupplierId(e.target.value)} required>
                  <option value="" disabled>
                    {t('inventory.detail.supplierChoose')}
                  </option>
                  {(suppliers ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </Fld>
            )}

            <Fld id="link-lead" label={`${t('inventory.detail.leadTime')} (${t('inventory.detail.daysLabel')})`}>
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
              {t('inventory.detail.leadTimeHelp')}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Fld id="link-cost" label={`${t('inventory.detail.costPrice')} (₹)`}>
                <input
                  id="link-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={linkUnitCost}
                  onChange={(e) => setLinkUnitCost(e.target.value)}
                />
              </Fld>
              <Fld id="link-sku" label={t('inventory.detail.supplierSku')}>
                <input id="link-sku" value={linkSupplierSku} onChange={(e) => setLinkSupplierSku(e.target.value)} />
              </Fld>
            </div>

            <Fld id="link-moq" label={t('inventory.detail.minimumOrder')}>
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
              {t('inventory.detail.primarySupplierForProduct')}
            </label>
          </form>
        </Modal>
      )}

      {transferOpen && (
        <Modal
          title={t('inventory.detail.transferTitle')}
          onClose={() => setTransferOpen(false)}
          footer={
            <button type="submit" form="transfer-form" className="btn btn-pri" disabled={isTransferring}>
              {isTransferring ? t('inventory.detail.transferring') : t('inventory.detail.transferStock')}
            </button>
          }
        >
          <form id="transfer-form" onSubmit={handleTransferSubmit}>
            {transferError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {transferError}
              </div>
            )}
            <Fld id="transfer-qty" label={t('inventory.detail.quantity')}>
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
