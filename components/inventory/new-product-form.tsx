'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, ScanLine, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { useAppRegion } from '@/lib/app-region'
import { Card, CardHead, CardPad, Fld, PageHead } from '@/components/couture/ui'
import { UNITS, allowsFractionalQuantity, unitSuffix, type Unit } from '@/lib/units'
import { CategorySelect, type CategoryOption } from '@/components/inventory/category-select'

type MasterItem = { id: string; name: string; brand: string | null; category: string; subcategory: string | null; packSize: string | null; packUnit: Unit; sellUnit: Unit; barcode: string | null; displayName: string }
type ExistingProduct = { id: string; name: string; variants: Array<{ id: string; barcode: string | null }> }
type Supplier = { id: string; name: string; leadTimeDays: number; isActive: boolean }
type VariantFormRow = {
  barcode: string; unitOfMeasure: Unit; sku: string; size: string; color: string; material: string
  sellingPrice: string; mrp: string; listPrice: string; costPrice: string; taxRatePercent: string
  reorderThreshold: string; openingStock: string; expiryDate: string; hsnSac: string
  purchaseUnit: string; purchasePackSize: string; supplierId: string
  trackInventory: boolean; allowNegativeStock: boolean; sellingPriceEdited: boolean
}

const EMPTY_ROW: VariantFormRow = {
  barcode: '', unitOfMeasure: 'piece', sku: '', size: '', color: '', material: '', sellingPrice: '',
  mrp: '', listPrice: '', costPrice: '', taxRatePercent: '', reorderThreshold: '', openingStock: '',
  expiryDate: '', hsnSac: '', purchaseUnit: '', purchasePackSize: '', supplierId: '', trackInventory: true,
  allowNegativeStock: false, sellingPriceEdited: false,
}
const grid = (minimum = 180) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minimum}px, 1fr))`, gap: 10 })

export function NewProductForm() {
  const router = useRouter()
  const { region, appPath } = useAppRegion()
  const india = region === 'IN'
  const [name, setName] = useState('')
  const [masterItemId, setMasterItemId] = useState<string>()
  const [brand, setBrand] = useState('')
  const [description, setDescription] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [category, setCategory] = useState<{ categoryId?: string; categoryName?: string }>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [rows, setRows] = useState<VariantFormRow[]>([{ ...EMPTY_ROW }])
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([])
  const [knownBarcodes, setKnownBarcodes] = useState<Map<string, string>>(new Map())
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suggestions, setSuggestions] = useState<MasterItem[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadReferenceData = useCallback(async () => {
    const headers = await authHeaders()
    const [categoryResult, productResult, supplierResult] = await Promise.all([
      apiClient.GET('/categories', { headers }), apiClient.GET('/products', { headers }), apiClient.GET('/suppliers', { headers }),
    ])
    if (categoryResult.data) setCategories(categoryResult.data.map((item) => ({ id: item.id, name: item.name })))
    if (productResult.data) {
      setExistingProducts(productResult.data)
      const barcodes = new Map<string, string>()
      for (const product of productResult.data) for (const variant of product.variants) if (variant.barcode) barcodes.set(variant.barcode, product.name)
      setKnownBarcodes(barcodes)
    }
    if (supplierResult.data) setSuppliers(supplierResult.data.filter((supplier) => supplier.isActive))
  }, [])

  useEffect(() => { void loadReferenceData() }, [loadReferenceData])
  useEffect(() => {
    const query = name.trim()
    if (query.length < 2 || masterItemId) { setSuggestions([]); setSearching(false); return }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearching(true)
      const result = await apiClient.GET('/master-items', { params: { query: { query, limit: 20 } }, headers: await authHeaders() })
      if (!cancelled) { setSuggestions(result.data ?? []); setSearching(false) }
    }, 250)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [name, masterItemId])

  const localMatches = useMemo(() => {
    const query = name.trim().toLocaleLowerCase()
    return query.length < 2 ? [] : existingProducts.filter((product) => product.name.toLocaleLowerCase().includes(query)).slice(0, 4)
  }, [existingProducts, name])

  useEffect(() => {
    if (searching || !showSuggestions || name.trim().length < 2) return
    if (suggestions.length === 0 && localMatches.length === 0) setShowSuggestions(false)
  }, [searching, showSuggestions, name, suggestions, localMatches])

  type SuggestionOption = { key: string; select: () => void } & ({ kind: 'existing'; product: ExistingProduct } | { kind: 'master'; item: MasterItem })
  const suggestionOptions = useMemo<SuggestionOption[]>(() => [
    ...localMatches.map((product): SuggestionOption => ({ kind: 'existing', key: `existing-${product.id}`, product, select: () => { if (product.variants[0]) router.push(appPath(`/app/inventory/catalog/${product.variants[0].id}`)) } })),
    ...suggestions.map((item): SuggestionOption => ({ kind: 'master', key: `master-${item.id}`, item, select: () => selectMaster(item) })),
  ], [localMatches, suggestions]) // eslint-disable-line react-hooks/exhaustive-deps
  const existingOptions = suggestionOptions.filter((option): option is Extract<SuggestionOption, { kind: 'existing' }> => option.kind === 'existing')
  const masterOptions = suggestionOptions.filter((option): option is Extract<SuggestionOption, { kind: 'master' }> => option.kind === 'master')
  const [activeIndex, setActiveIndex] = useState(-1)
  useEffect(() => { setActiveIndex(-1) }, [suggestionOptions, showSuggestions])

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestionOptions.length === 0) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((current) => (current + 1) % suggestionOptions.length) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => (current - 1 + suggestionOptions.length) % suggestionOptions.length) }
    else if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); suggestionOptions[activeIndex].select() }
    else if (event.key === 'Escape') { setShowSuggestions(false) }
  }

  function setRow(index: number, patch: Partial<VariantFormRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }
  function selectMaster(item: MasterItem) {
    setName([item.brand, item.name].filter(Boolean).join(' ')); setMasterItemId(item.id); setBrand(item.brand ?? '')
    setCategory({ categoryName: item.category })
    setRows((current) => current.map((row, index) => index === 0 ? { ...row, barcode: item.barcode ?? row.barcode, unitOfMeasure: item.sellUnit, size: item.packSize ? `${Number(item.packSize).toLocaleString()} ${item.packUnit}` : '' } : row))
    setShowSuggestions(false)
  }
  function changeMrp(index: number, value: string) {
    const row = rows[index]
    setRow(index, { mrp: value, ...(!row.sellingPriceEdited || row.sellingPrice === row.mrp ? { sellingPrice: value } : {}) })
  }
  function validate(): string | null {
    if (!name.trim()) return 'Give this product a name.'
    for (const [index, row] of rows.entries()) {
      const label = rows.length > 1 ? ` (variant ${index + 1})` : ''
      if (india && (row.mrp === '' || !Number.isFinite(Number(row.mrp)))) return `Enter the MRP${label}.`
      if (row.sellingPrice === '' || !Number.isFinite(Number(row.sellingPrice))) return `Enter the selling price${label}.`
      const tax = Number(row.taxRatePercent)
      if (row.taxRatePercent === '' || !Number.isFinite(tax) || tax < 0 || tax > 100) return `Enter an item tax rate between 0 and 100%${label}.`
      if (row.barcode && !/^\d{8,14}$/.test(row.barcode.trim())) return `A barcode must be 8-14 digits${label}.`
      if (row.barcode && knownBarcodes.has(row.barcode.trim())) return `That barcode already belongs to "${knownBarcodes.get(row.barcode.trim())}"${label}.`
      if (row.hsnSac && !/^\d{4,8}$/.test(row.hsnSac.trim())) return `HSN/SAC must be 4-8 digits${label}.`
      for (const [field, value] of [['Cost price', row.costPrice], ['Opening stock', row.openingStock], ['Purchase pack size', row.purchasePackSize]] as const) if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) return `${field} must be a valid non-negative number${label}.`
      if (row.trackInventory && row.openingStock && !allowsFractionalQuantity(row.unitOfMeasure) && !Number.isInteger(Number(row.openingStock))) return `Opening stock must be a whole number${label}.`
    }
    const barcodes = rows.map((row) => row.barcode.trim()).filter(Boolean)
    return new Set(barcodes).size === barcodes.length ? null : 'Two variants have the same barcode.'
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = validate(); if (problem) { setError(problem); return }
    setError(null); setIsSubmitting(true)
    const headers = await authHeaders()
    const result = await apiClient.POST('/products', { headers, body: {
      name: name.trim(), masterItemId, brand: brand.trim() || undefined, description: description.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined, categoryId: category.categoryId, categoryName: category.categoryName,
      variants: rows.map((row) => ({ sku: row.sku.trim() || undefined, barcode: row.barcode.trim() || undefined,
        unitOfMeasure: row.unitOfMeasure, size: row.size.trim() || undefined, color: row.color.trim() || undefined,
        material: row.material.trim() || undefined, price: Number(row.sellingPrice), mrp: india ? Number(row.mrp) : undefined,
        listPrice: !india && row.listPrice ? Number(row.listPrice) : undefined,
        initialCostPrice: row.costPrice ? Number(row.costPrice) : undefined, taxRatePercent: Number(row.taxRatePercent),
        reorderThreshold: row.reorderThreshold ? Number(row.reorderThreshold) : undefined,
        hsnSac: india && row.hsnSac ? row.hsnSac.trim() : undefined, purchaseUnit: row.purchaseUnit.trim() || undefined,
        purchasePackSize: row.purchasePackSize ? Number(row.purchasePackSize) : undefined,
        trackInventory: row.trackInventory, allowNegativeStock: row.trackInventory && row.allowNegativeStock,
        expiryDate: row.trackInventory && row.expiryDate ? row.expiryDate : undefined })),
    } })
    if (!result.data || result.error) { setIsSubmitting(false); setError((result.error as { error?: string } | undefined)?.error ?? 'Something went wrong saving this product. Try again.'); return }
    await Promise.all(result.data.variants.flatMap((variant, index) => {
      const row = rows[index]; const operations: Array<Promise<unknown>> = []
      if (row.trackInventory && Number(row.openingStock) > 0) operations.push(apiClient.POST('/stock-movements', { headers, body: { variantId: variant.id, movementType: 'receive', quantityDelta: Number(row.openingStock) } }))
      const supplier = suppliers.find((item) => item.id === row.supplierId)
      if (supplier) operations.push(apiClient.POST('/variants/{variantId}/supplier-products', { params: { path: { variantId: variant.id } }, headers, body: { supplierId: supplier.id, isPrimary: true, leadTimeDays: supplier.leadTimeDays, unitCost: row.costPrice ? Number(row.costPrice) : undefined } }))
      return operations
    }))
    router.push(appPath('/app/inventory'))
  }

  return <>
    <PageHead title="Add product" sub="Start with a suggestion or enter your own product" actions={<><Link className="btn" href={appPath('/app/inventory')}>Cancel</Link><button className="btn btn-pri" type="submit" form="new-product-form" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save product'}</button></>} />
    <form id="new-product-form" onSubmit={handleSubmit}>
      {error && <Card><CardPad style={{ color: 'var(--danger)', fontSize: 13 }}><div role="alert">{error}</div></CardPad></Card>}
      <Card><CardHead title="Product" sub="Type a product name to search Ambel’s catalogue, or continue with your own item" /><CardPad>
        <div style={grid(220)}>
          <Fld id="product-name" label="Product name"><div style={{ position: 'relative' }}><input id="product-name" required autoComplete="off" value={name} onFocus={() => setShowSuggestions(true)} onChange={(event) => { setName(event.target.value); setMasterItemId(undefined); setShowSuggestions(true) }} onKeyDown={handleNameKeyDown} placeholder="e.g. Milk" role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="product-name-listbox" aria-activedescendant={activeIndex >= 0 ? suggestionOptions[activeIndex]?.key : undefined} />
            {showSuggestions && name.trim().length >= 2 && <div id="product-name-listbox" role="listbox" style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, top: 'calc(100% + 4px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 12px 30px rgba(15,23,42,.14)', maxHeight: 320, overflowY: 'auto' }}>
              {localMatches.length > 0 && <><div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>YOUR PRODUCTS</div>{existingOptions.map((option) => { const index = suggestionOptions.indexOf(option); return <button key={option.key} id={option.key} type="button" role="option" aria-selected={index === activeIndex} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, background: index === activeIndex ? 'var(--brand-soft)' : undefined }} onMouseEnter={() => setActiveIndex(index)} onClick={option.select}>{option.product.name}<span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>Open existing</span></button> })}</>}
              <div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>AMBEL MASTER ITEMS</div>
              {masterOptions.map((option) => { const index = suggestionOptions.indexOf(option); return <button key={option.key} id={option.key} type="button" role="option" aria-selected={index === activeIndex} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, background: index === activeIndex ? 'var(--brand-soft)' : undefined }} onMouseEnter={() => setActiveIndex(index)} onClick={option.select}>{option.item.displayName}<span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>{option.item.category}</span></button> })}
              {!searching && suggestions.length === 0 && <div style={{ padding: 10, fontSize: 12, color: 'var(--muted)' }}>No master match. Keep typing to add “{name.trim()}” as your own product.</div>}{searching && <div style={{ padding: 10, fontSize: 12, color: 'var(--muted)' }}>Searching…</div>}
            </div>}
          </div></Fld>
          <Fld id="product-brand" label="Brand (optional)"><input id="product-brand" value={brand} onChange={(event) => setBrand(event.target.value)} /></Fld>
          <Fld id="product-category" label="Category"><CategorySelect id="product-category" categories={categories} value={category} onChange={setCategory} /></Fld>
        </div>
        <details className="disclosure"><summary><ChevronDown size={14} className="chev" /> More product details (optional)</summary><div className="disclosure-body" style={grid(240)}><Fld id="product-description" label="Description"><textarea id="product-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></Fld><Fld id="product-notes" label="Internal notes"><textarea id="product-notes" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={3} /></Fld></div></details>
      </CardPad></Card>
      <Card><CardHead title="Variants" sub="Add one row for each pack, size, colour, or other sellable version" right={<button type="button" className="btn btn-sm" onClick={() => setRows((current) => [...current, { ...EMPTY_ROW }])}><Plus size={14} /> Add variant</button>} /><CardPad style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((row, index) => { const suffix = unitSuffix(row.unitOfMeasure); const fractional = allowsFractionalQuantity(row.unitOfMeasure); return <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><strong style={{ fontSize: 12, color: 'var(--muted)' }}>VARIANT {index + 1}</strong>{rows.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 size={14} /> Remove</button>}</div>
          <div style={grid()}>{india ? <Fld id={`variant-${index}-mrp`} label="MRP"><input id={`variant-${index}-mrp`} type="number" min="0" step="0.01" required value={row.mrp} onChange={(event) => changeMrp(index, event.target.value)} placeholder="Required" /></Fld> : <Fld id={`variant-${index}-list-price`} label="List / compare-at price (optional)"><input id={`variant-${index}-list-price`} type="number" min="0" step="0.01" value={row.listPrice} onChange={(event) => setRow(index, { listPrice: event.target.value })} /></Fld>}
            <Fld id={`variant-${index}-selling-price`} label={suffix ? `Selling price per ${suffix}` : 'Selling price'}><input id={`variant-${index}-selling-price`} type="number" min="0" step="0.01" required value={row.sellingPrice} onChange={(event) => setRow(index, { sellingPrice: event.target.value, sellingPriceEdited: true })} /></Fld>
            <Fld id={`variant-${index}-tax`} label={india ? 'GST rate (%)' : 'Sales tax rate (%)'}><input id={`variant-${index}-tax`} type="number" min="0" max="100" step="0.01" required value={row.taxRatePercent} onChange={(event) => setRow(index, { taxRatePercent: event.target.value })} /></Fld>
            <Fld id={`variant-${index}-unit`} label="Sold by"><select id={`variant-${index}-unit`} value={row.unitOfMeasure} onChange={(event) => setRow(index, { unitOfMeasure: event.target.value as Unit })}>{UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></Fld>
            <Fld id={`variant-${index}-barcode`} label={<span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><ScanLine size={13} /> Barcode</span>}><input id={`variant-${index}-barcode`} inputMode="numeric" maxLength={14} value={row.barcode} onChange={(event) => setRow(index, { barcode: event.target.value })} placeholder="Scan or type" /></Fld></div>
          <div style={{ ...grid(220), marginTop: 10 }}><Fld id={`variant-${index}-track`} label="Inventory"><div className="chk-row"><input id={`variant-${index}-track`} type="checkbox" checked={row.trackInventory} onChange={(event) => setRow(index, { trackInventory: event.target.checked, allowNegativeStock: event.target.checked ? row.allowNegativeStock : false })} /> Track inventory</div></Fld>
            {row.trackInventory && <Fld id={`variant-${index}-negative`} label="Stock rule"><div className="chk-row"><input id={`variant-${index}-negative`} type="checkbox" checked={row.allowNegativeStock} onChange={(event) => setRow(index, { allowNegativeStock: event.target.checked })} /> Allow sales below zero</div></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-opening`} label={suffix ? `Opening stock (${suffix})` : 'Opening stock'}><input id={`variant-${index}-opening`} type="number" min="0" step={fractional ? '0.001' : '1'} value={row.openingStock} onChange={(event) => setRow(index, { openingStock: event.target.value })} placeholder="0" /></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-expiry`} label="Expiry date"><input id={`variant-${index}-expiry`} type="date" value={row.expiryDate} onChange={(event) => setRow(index, { expiryDate: event.target.value })} /></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-reorder`} label="Reorder at"><input id={`variant-${index}-reorder`} type="number" min="0" step={fractional ? '0.001' : '1'} value={row.reorderThreshold} onChange={(event) => setRow(index, { reorderThreshold: event.target.value })} placeholder="Defaults to 4" /></Fld>}</div>
          <details className="disclosure"><summary><ChevronDown size={14} className="chev" /> More variant details (optional)</summary><div className="disclosure-body" style={grid()}>
            <Fld id={`variant-${index}-cost`} label="Cost price"><input id={`variant-${index}-cost`} type="number" min="0" step="0.01" value={row.costPrice} onChange={(event) => setRow(index, { costPrice: event.target.value })} placeholder="Cost not entered" /></Fld>
            <Fld id={`variant-${index}-supplier`} label="Primary supplier"><select id={`variant-${index}-supplier`} value={row.supplierId} onChange={(event) => setRow(index, { supplierId: event.target.value })}><option value="">No supplier selected</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Fld>
            <Fld id={`variant-${index}-pack-size`} label="Purchase pack size"><input id={`variant-${index}-pack-size`} type="number" min="0" step="0.001" value={row.purchasePackSize} onChange={(event) => setRow(index, { purchasePackSize: event.target.value })} placeholder="e.g. 12" /></Fld><Fld id={`variant-${index}-pack-unit`} label="Purchase unit"><input id={`variant-${index}-pack-unit`} value={row.purchaseUnit} onChange={(event) => setRow(index, { purchaseUnit: event.target.value })} placeholder="e.g. carton" /></Fld>
            {india && <Fld id={`variant-${index}-hsn`} label="HSN/SAC"><input id={`variant-${index}-hsn`} inputMode="numeric" maxLength={8} value={row.hsnSac} onChange={(event) => setRow(index, { hsnSac: event.target.value })} /></Fld>}
            <Fld id={`variant-${index}-size`} label="Size / pack"><input id={`variant-${index}-size`} value={row.size} onChange={(event) => setRow(index, { size: event.target.value })} /></Fld><Fld id={`variant-${index}-color`} label={india ? 'Colour' : 'Color'}><input id={`variant-${index}-color`} value={row.color} onChange={(event) => setRow(index, { color: event.target.value })} /></Fld><Fld id={`variant-${index}-material`} label="Material"><input id={`variant-${index}-material`} value={row.material} onChange={(event) => setRow(index, { material: event.target.value })} /></Fld><Fld id={`variant-${index}-sku`} label="SKU"><input id={`variant-${index}-sku`} value={row.sku} onChange={(event) => setRow(index, { sku: event.target.value })} placeholder="Auto-generated" /></Fld>
          </div></details>
        </div> })}
      </CardPad></Card>
    </form>
  </>
}
