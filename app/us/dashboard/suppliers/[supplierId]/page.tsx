/*
 * US edition mirror of app/app/suppliers/[supplierId]/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Card, CardHead, CardPad, DataTable, Fld, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
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

const DETAIL_TABS: readonly { label: string; value: DetailTab }[] = [
  { label: 'Details', value: 'details' },
  { label: 'Products supplied', value: 'products' },
]

const LOAD_ERROR = "Couldn't load this supplier. Check your connection and try again."

function variantLabel(row: { size: string | null; color: string | null; material: string | null }) {
  return [row.size, row.color, row.material].filter(Boolean).join(' / ') || '-'
}

export default function SupplierDetailPage() {
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
      setLoadError(cause instanceof Error ? cause.message : LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  const loadLinkedProducts = useCallback(async () => {
    setLinkedError(null)
    try {
      setLinkedProducts(await getAuthenticatedSupplierProductsForSupplier(supplierId))
    } catch (cause) {
      setLinkedError(cause instanceof Error ? cause.message : 'Products for this supplier are unavailable right now.')
    }
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
      setDetailsError('Supplier name is required.')
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setDetailsError('Lead time must be a whole number of days, at least 1.')
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
      setDetailsError(cause instanceof Error ? cause.message : 'That supplier could not be saved.')
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleUnlink(row: SupplierProductWithVariant) {
    try {
      await deleteAuthenticatedSupplierProduct(row.variantId, row.id)
      await loadLinkedProducts()
    } catch (cause) {
      setLinkedError(cause instanceof Error ? cause.message : 'That product could not be removed.')
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
        setPickerError(cause instanceof Error ? cause.message : 'Your catalog is unavailable right now.')
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
      setBatchError('Choose at least one product.')
      return
    }
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1) {
      setBatchError('Lead time must be a whole number of days, at least 1.')
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
      setBatchError(cause instanceof Error ? cause.message : 'Some products could not be linked. Try again.')
    } finally {
      setSavingBatch(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHead title="Supplier" />
        <Card>
          <LoadingState label="Loading supplier" />
        </Card>
      </>
    )
  }

  if (loadError || !supplier) {
    return (
      <>
        <PageHead title="Supplier" />
        <Card>
          <ErrorState message={loadError ?? LOAD_ERROR} onRetry={() => void load()} />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={supplier.name}
        sub={supplier.isActive ? 'Active supplier' : 'Inactive supplier'}
        actions={<Badge tone={supplier.isActive ? 'green' : 'grey'}>{supplier.isActive ? 'Active' : 'Inactive'}</Badge>}
      />

      <Card>
        <CardPad style={{ paddingBottom: 0 }}>
          <Tabs items={DETAIL_TABS} active={tab} onSelect={setTab} ariaLabel="Supplier detail sections" />
        </CardPad>

        {tab === 'details' && (
          <CardPad>
            <form onSubmit={handleDetailsSubmit}>
              {detailsError && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {detailsError}
                </div>
              )}

              <Fld id="detail-name" label="Supplier name">
                <input id="detail-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </Fld>

              <Fld id="detail-lead" label="Default lead time (days)">
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
                Used only for products bought from this supplier that don't have their own lead time set on the
                Products supplied tab.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Fld id="detail-contact" label="Contact name">
                  <input
                    id="detail-contact"
                    value={form.contactName}
                    onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  />
                </Fld>
                <Fld id="detail-phone" label="Phone">
                  <input
                    id="detail-phone"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Fld>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Fld id="detail-email" label="Email">
                  <input
                    id="detail-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </Fld>
                <Fld id="detail-terms" label="Payment terms">
                  <input
                    id="detail-terms"
                    value={form.paymentTerms}
                    onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                    placeholder="e.g. Net 30"
                  />
                </Fld>
              </div>

              <button type="submit" className="btn btn-pri" disabled={savingDetails} style={{ marginTop: 10 }}>
                {savingDetails ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </CardPad>
        )}

        {tab === 'products' && (
          <CardPad>
            <CardHead
              title="Products supplied"
              sub={linkedProducts ? `${linkedProducts.length} linked` : 'Loading…'}
              right={
                <button className="btn btn-sm btn-pri" onClick={() => void openPicker()}>
                  Add products
                </button>
              }
            />
            {linkedError && <ErrorState message={linkedError} onRetry={() => void loadLinkedProducts()} />}
            {!linkedError && linkedProducts && linkedProducts.length === 0 && (
              <EmptyState
                icon={<Badge tone="grey">-</Badge>}
                title="No products linked"
                body="Add the products you buy from this supplier, filtered by category or picked one at a time."
                action={
                  <button className="btn btn-pri" onClick={() => void openPicker()}>
                    Add products
                  </button>
                }
              />
            )}
            {!linkedError && linkedProducts && linkedProducts.length > 0 && (
              <DataTable cols={['Product', 'Lead time', 'Cost', 'Supplier SKU', 'Min order', '', '']} minWidth={820}>
                {linkedProducts.map((row) => (
                  <tr key={row.id}>
                    <td className="t-strong">
                      {row.productName}
                      <div className="t-sub">{variantLabel(row)}</div>
                    </td>
                    <td className="num">{row.leadTimeDays} days</td>
                    <td className="num t-sub">{row.unitCost ? `₹${row.unitCost}` : '-'}</td>
                    <td className="t-sub">{row.supplierSku ?? '-'}</td>
                    <td className="num t-sub">{row.minOrderQty ?? '-'}</td>
                    <td>{row.isPrimary && <Badge tone="green">Primary</Badge>}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => void handleUnlink(row)}>
                        Remove
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
          title="Add products"
          onClose={() => setPickerOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setPickerOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="picker-form" disabled={savingBatch}>
                {savingBatch ? 'Adding…' : `Add ${selectedVariantIds.size || ''} product${selectedVariantIds.size === 1 ? '' : 's'}`}
              </button>
            </>
          }
        >
          {pickerError && <ErrorState message={pickerError} onRetry={() => void openPicker()} />}
          {!pickerError && !allProducts && <LoadingState label="Loading catalog" />}
          {!pickerError && allProducts && (
            <form id="picker-form" onSubmit={handleBatchSubmit}>
              {batchError && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {batchError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10 }}>
                <Fld id="picker-category" label="Category">
                  <select id="picker-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Fld>
                <button type="button" className="btn btn-sm" onClick={selectAllVisible}>
                  Select all shown ({pickerRows.length})
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
                    Every product in this category is already linked to this supplier.
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
                <Fld id="batch-lead" label="Lead time (days)">
                  <input
                    id="batch-lead"
                    type="number"
                    min={1}
                    step={1}
                    value={batchLeadTimeDays}
                    onChange={(e) => setBatchLeadTimeDays(e.target.value)}
                  />
                </Fld>
                <Fld id="batch-cost" label="Unit cost (₹)">
                  <input
                    id="batch-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={batchUnitCost}
                    onChange={(e) => setBatchUnitCost(e.target.value)}
                  />
                </Fld>
                <Fld id="batch-moq" label="Min order qty">
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
                Applied the same to every product selected above. Edit an individual product's lead time later from
                its own detail page if one of them differs.
              </p>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
