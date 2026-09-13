'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'
import {
  type Supplier,
  type SupplierProductWithVariant,
  type Product,
  getAuthenticatedSupplier,
  updateAuthenticatedSupplier,
  getAuthenticatedSupplierProductsForSupplier,
  createAuthenticatedSupplierProduct,
  deleteAuthenticatedSupplierProduct,
  getAuthenticatedProducts,
} from '@/lib/api/authenticated-client'

type DetailTab = 'details' | 'products'

const DETAIL_TAB_IDS = ['details', 'products'] as const

function variantLabel(row: { size: string | null; color: string | null; material: string | null }) {
  return [row.size, row.color, row.material].filter(Boolean).join(' / ') || '-'
}

export default function SupplierDetailPage() {
  const t = useT()
  const { money, pack } = useAppRegion()
  const params = useParams<{ supplierId: string }>()
  const supplierId = params.supplierId

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('details')

  const [form, setForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    leadTimeDays: '7',
    paymentTerms: '',
  })
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)

  const [linkedProducts, setLinkedProducts] = useState<SupplierProductWithVariant[] | null>(null)
  const [linkedError, setLinkedError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[] | null>(null)
  const [pickerError, setPickerError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set())
  const [batchLeadTimeDays, setBatchLeadTimeDays] = useState('7')
  const [batchUnitCost, setBatchUnitCost] = useState('')
  const [batchMinOrderQty, setBatchMinOrderQty] = useState('')
  const [savingBatch, setSavingBatch] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getAuthenticatedSupplier(supplierId)
      setSupplier(data)
      setForm({
        name: data.name,
        contactName: data.contactName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        leadTimeDays: String(data.leadTimeDays),
        paymentTerms: data.paymentTerms ?? '',
      })
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : t('records.errors.supplierDetailLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch supplier data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId])

  const loadLinkedProducts = useCallback(async () => {
    setLinkedError(null)
    try {
      setLinkedProducts(await getAuthenticatedSupplierProductsForSupplier(supplierId))
    } catch (cause) {
      setLinkedError(cause instanceof Error ? cause.message : t('records.errors.supplierProductsLoad'))
    }
    // t is intentionally omitted: changing locale must not refetch linked products.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId])

  useEffect(() => {
    void load()
    void loadLinkedProducts()
  }, [load, loadLinkedProducts])

  async function handleDetailsSubmit(event: FormEvent) {
    event.preventDefault()
    setDetailsError(null)

    const leadTimeDays = Number(form.leadTimeDays)
    if (!form.name.trim()) {
      setDetailsError(t('records.errors.supplierNameRequired'))
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setDetailsError(t('records.errors.supplierLeadTimeInvalid'))
      return
    }

    setSavingDetails(true)
    try {
      await updateAuthenticatedSupplier(supplierId, {
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        leadTimeDays,
        paymentTerms: form.paymentTerms.trim() || undefined,
      })
      await load()
    } catch (cause) {
      setDetailsError(cause instanceof Error ? cause.message : t('records.errors.supplierSave'))
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleUnlink(row: SupplierProductWithVariant) {
    try {
      await deleteAuthenticatedSupplierProduct(row.variantId, row.id)
      await loadLinkedProducts()
    } catch (cause) {
      setLinkedError(cause instanceof Error ? cause.message : t('records.errors.supplierProductRemove'))
    }
  }

  async function openPicker() {
    setPickerError(null)
    setSelectedVariantIds(new Set())
    setCategoryFilter('all')
    setBatchLeadTimeDays('7')
    setBatchUnitCost('')
    setBatchMinOrderQty('')
    setBatchError(null)
    setPickerOpen(true)
    if (!allProducts) {
      try {
        setAllProducts(await getAuthenticatedProducts())
      } catch (cause) {
        setPickerError(cause instanceof Error ? cause.message : t('records.errors.catalogUnavailable'))
      }
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const product of allProducts ?? []) {
      if (product.category) set.add(product.category)
    }
    return Array.from(set).sort()
  }, [allProducts])

  const alreadyLinkedVariantIds = useMemo(
    () => new Set((linkedProducts ?? []).map((row) => row.variantId)),
    [linkedProducts],
  )

  const pickerRows = useMemo(() => {
    const rows: { variantId: string; productName: string; label: string; category: string | null }[] = []
    for (const product of allProducts ?? []) {
      if (categoryFilter !== 'all' && product.category !== categoryFilter) continue
      for (const variant of product.variants) {
        if (alreadyLinkedVariantIds.has(variant.id)) continue
        rows.push({
          variantId: variant.id,
          productName: product.name,
          label: variantLabel(variant),
          category: product.category,
        })
      }
    }
    return rows
  }, [allProducts, categoryFilter, alreadyLinkedVariantIds])

  const detailTabs = DETAIL_TAB_IDS.map((value) => ({
    value,
    label: value === 'details' ? t('records.supplierDetail.details') : t('records.supplierDetail.productsSupplied'),
  }))

  function toggleVariant(variantId: string) {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedVariantIds(new Set(pickerRows.map((row) => row.variantId)))
  }

  async function handleBatchSubmit(event: FormEvent) {
    event.preventDefault()
    setBatchError(null)

    const leadTimeDays = Number(batchLeadTimeDays)
    if (selectedVariantIds.size === 0) {
      setBatchError(t('records.errors.chooseProduct'))
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setBatchError(t('records.errors.supplierLeadTimeInvalid'))
      return
    }

    setSavingBatch(true)
    try {
      const body = {
        supplierId,
        leadTimeDays,
        unitCost: batchUnitCost.trim() ? Number(batchUnitCost) : undefined,
        minOrderQty: batchMinOrderQty.trim() ? Number(batchMinOrderQty) : undefined,
      }
      for (const variantId of selectedVariantIds) {
        await createAuthenticatedSupplierProduct(variantId, body)
      }
      setPickerOpen(false)
      await loadLinkedProducts()
    } catch (cause) {
      setBatchError(cause instanceof Error ? cause.message : t('records.errors.supplierLink'))
    } finally {
      setSavingBatch(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHead title={t('records.supplierDetail.title')} />
        <Card>
          <LoadingState label={t('records.supplierDetail.loading')} />
        </Card>
      </>
    )
  }

  if (loadError || !supplier) {
    return (
      <>
        <PageHead title={t('records.supplierDetail.title')} />
        <Card>
          <ErrorState message={loadError ?? t('records.errors.supplierDetailLoad')} onRetry={() => void load()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={supplier.name}
        sub={supplier.isActive ? t('records.supplierDetail.activeSupplier') : t('records.supplierDetail.inactiveSupplier')}
        actions={<Badge tone={supplier.isActive ? 'green' : 'grey'}>{supplier.isActive ? t('records.supplierDetail.active') : t('records.supplierDetail.inactive')}</Badge>}
      />

      <Card>
        <CardPad style={{ paddingBottom: 0 }}>
          <Tabs items={detailTabs} active={tab} onSelect={setTab} ariaLabel={t('records.supplierDetail.sections')} />
        </CardPad>

        {tab === 'details' && (
          <CardPad>
            <form onSubmit={handleDetailsSubmit}>
              {detailsError && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {detailsError}
                </div>
              )}

              <Fld id="detail-name" label={t('records.supplierDetail.supplierName')}>
                <input id="detail-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </Fld>

              <Fld id="detail-lead" label={t('records.supplierDetail.defaultLeadTime')}>
                <input
                  id="detail-lead"
                  type="number"
                  min={1}
                  step={1}
                  value={form.leadTimeDays}
                  onChange={(e) => setForm((p) => ({ ...p, leadTimeDays: e.target.value }))}
                />
              </Fld>
              <div style={{ marginTop: -7, marginBottom: 13, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                {t('records.supplierDetail.leadTimeHelp')}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Fld id="detail-contact" label={t('records.supplierDetail.contactName')}>
                  <input
                    id="detail-contact"
                    value={form.contactName}
                    onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  />
                </Fld>
                <Fld id="detail-phone" label={t('records.supplierDetail.phone')}>
                  <input
                    id="detail-phone"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Fld>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Fld id="detail-email" label={t('records.supplierDetail.email')}>
                  <input
                    id="detail-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </Fld>
                <Fld id="detail-terms" label={t('records.supplierDetail.paymentTerms')}>
                  <input
                    id="detail-terms"
                    value={form.paymentTerms}
                    onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                    placeholder={t('records.supplierDetail.paymentTermsPlaceholder')}
                  />
                </Fld>
              </div>

              <button type="submit" className="btn btn-pri" disabled={savingDetails} style={{ marginTop: 10 }}>
                {savingDetails ? t('records.supplierDetail.saving') : t('records.supplierDetail.save')}
              </button>
            </form>
          </CardPad>
        )}

        {tab === 'products' && (
          <CardPad>
            <CardHead
              title={t('records.supplierDetail.productsSupplied')}
              sub={linkedProducts ? t('records.supplierDetail.linkedCount', { count: linkedProducts.length }) : t('records.supplierDetail.loadingEllipsis')}
              right={
                <button className="btn btn-sm btn-pri" onClick={() => void openPicker()} type="button">
                  {t('records.supplierDetail.addProducts')}
                </button>
              }
            />
            {linkedError && <ErrorState message={linkedError} onRetry={() => void loadLinkedProducts()} />}
            {!linkedError && linkedProducts && linkedProducts.length === 0 && (
              <EmptyState
                icon={<Badge tone="grey">-</Badge>}
                title={t('records.supplierDetail.noProducts')}
                body={t('records.supplierDetail.noProductsBody')}
                action={
                  <button className="btn btn-pri" onClick={() => void openPicker()} type="button">
                    {t('records.supplierDetail.addProducts')}
                  </button>
                }
              />
            )}
            {!linkedError && linkedProducts && linkedProducts.length > 0 && (
              <DataTable cols={[t('records.supplierDetail.product'), t('records.supplierDetail.leadTime'), t('records.supplierDetail.cost'), t('records.supplierDetail.supplierSku'), t('records.supplierDetail.minOrder'), '', '']} minWidth={820}>
                {linkedProducts.map((row) => (
                  <tr key={row.id}>
                    <td className="t-strong">
                      {row.productName}
                      <div className="t-sub">{variantLabel(row)}</div>
                    </td>
                    <td className="num">{row.leadTimeDays === 1 ? t('records.suppliers.daysOne') : t('records.suppliers.days', { count: row.leadTimeDays })}</td>
                    <td className="num t-sub">{row.unitCost ? money(row.unitCost) : '-'}</td>
                    <td className="t-sub">{row.supplierSku ?? '-'}</td>
                    <td className="num t-sub">{row.minOrderQty ?? '-'}</td>
                    <td>{row.isPrimary && <Badge tone="green">{t('records.supplierDetail.primary')}</Badge>}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => void handleUnlink(row)} type="button">
                        {t('records.supplierDetail.remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </CardPad>
        )}
      </Card>

      {pickerOpen && (
        <Modal
          title={t('records.supplierDetail.addProductsTitle')}
          onClose={() => setPickerOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setPickerOpen(false)}>
                {t('records.supplierDetail.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="picker-form" disabled={savingBatch}>
                {savingBatch ? t('records.supplierDetail.adding') : t(selectedVariantIds.size === 1 ? 'records.supplierDetail.addOne' : 'records.supplierDetail.addMany', { count: selectedVariantIds.size })}
              </button>
            </>
          }
        >
          {pickerError && <ErrorState message={pickerError} onRetry={() => void openPicker()} />}
          {!pickerError && !allProducts && <LoadingState label={t('records.supplierDetail.loadingCatalog')} />}
          {!pickerError && allProducts && (
            <form id="picker-form" onSubmit={handleBatchSubmit}>
              {batchError && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {batchError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10 }}>
                <Fld id="picker-category" label={t('records.supplierDetail.category')}>
                  <select id="picker-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">{t('records.supplierDetail.allCategories')}</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Fld>
                <button type="button" className="btn btn-sm" onClick={selectAllVisible}>
                  {t('records.supplierDetail.selectAll', { count: pickerRows.length })}
                </button>
              </div>

              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  marginBottom: 13,
                }}
              >
                {pickerRows.length === 0 && (
                  <p className="t-sub" style={{ padding: 12 }}>
                    {t('records.supplierDetail.allLinked')}
                  </p>
                )}
                {pickerRows.map((row) => (
                  <label
                    key={row.variantId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--line)',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVariantIds.has(row.variantId)}
                      onChange={() => toggleVariant(row.variantId)}
                    />
                    <span style={{ fontWeight: 600 }}>{row.productName}</span>
                    <span className="t-sub">{row.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Fld id="batch-lead" label={t('records.supplierDetail.leadTimeDays')}>
                  <input
                    id="batch-lead"
                    type="number"
                    min={1}
                    step={1}
                    value={batchLeadTimeDays}
                    onChange={(e) => setBatchLeadTimeDays(e.target.value)}
                  />
                </Fld>
                <Fld id="batch-cost" label={t('records.supplierDetail.unitCost', { currency: pack.currencySymbol })}>
                  <input
                    id="batch-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={batchUnitCost}
                    onChange={(e) => setBatchUnitCost(e.target.value)}
                  />
                </Fld>
                <Fld id="batch-moq" label={t('records.supplierDetail.minOrderQty')}>
                  <input
                    id="batch-moq"
                    type="number"
                    min={1}
                    step={1}
                    value={batchMinOrderQty}
                    onChange={(e) => setBatchMinOrderQty(e.target.value)}
                  />
                </Fld>
              </div>
              <p className="t-sub" style={{ fontSize: 11.5, marginTop: 4 }}>
                {t('records.supplierDetail.batchHelp')}
              </p>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
