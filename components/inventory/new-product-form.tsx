'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, ScanLine, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { useAppRegion } from '@/lib/app-region'
import { useT, type MessageKey } from '@/lib/i18n/i18n'
import { Card, CardHead, CardPad, Fld, PageHead } from '@/components/couture/ui'
import { unitsForRegion, allowsFractionalQuantity, unitSuffix, type Unit } from '@/lib/units'
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
  const t = useT()
  const india = region === 'IN'
  const units = unitsForRegion(region)
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
    if (!name.trim()) return t('inventory.newProduct.validationName')
    for (const [index, row] of rows.entries()) {
      const variant = rows.length > 1 ? ` (variant ${index + 1})` : ''
      if (india && (row.mrp === '' || !Number.isFinite(Number(row.mrp)))) return t('inventory.newProduct.validationMrp', { variant })
      if (row.sellingPrice === '' || !Number.isFinite(Number(row.sellingPrice))) return t('inventory.newProduct.validationPrice', { variant })
      const tax = Number(row.taxRatePercent)
      if (row.taxRatePercent === '' || !Number.isFinite(tax) || tax < 0 || tax > 100) return t('inventory.newProduct.validationTax', { variant })
      if (row.barcode && !/^\d{8,14}$/.test(row.barcode.trim())) return t('inventory.newProduct.validationBarcode', { variant })
      if (row.barcode && knownBarcodes.has(row.barcode.trim())) return t('inventory.newProduct.validationDuplicateBarcode', { product: knownBarcodes.get(row.barcode.trim()) ?? '', variant })
      if (row.hsnSac && !/^\d{4,8}$/.test(row.hsnSac.trim())) return t('inventory.newProduct.validationHsn', { variant })
      for (const [field, value] of [['costPrice', row.costPrice], ['openingStock', row.openingStock], ['purchasePackSize', row.purchasePackSize]] as const) {
        if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
          const fieldLabel = t(`inventory.newProduct.${field}` as MessageKey)
          return t('inventory.newProduct.validationNumber', { field: fieldLabel, variant })
        }
      }
      if (row.trackInventory && row.openingStock && !allowsFractionalQuantity(row.unitOfMeasure) && !Number.isInteger(Number(row.openingStock))) return t('inventory.newProduct.validationWholeNumber', { variant })
    }
    const barcodes = rows.map((row) => row.barcode.trim()).filter(Boolean)
    return new Set(barcodes).size === barcodes.length ? null : t('inventory.newProduct.validationSameBarcode')
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
    if (!result.data || result.error) { setIsSubmitting(false); setError((result.error as { error?: string } | undefined)?.error ?? t('inventory.errors.productSave')); return }
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
    <PageHead title={t('inventory.newProduct.title')} sub={t('inventory.newProduct.subtitle')} actions={<><Link className="btn" href={appPath('/app/inventory')}>{t('common.cancel')}</Link><button className="btn btn-pri" type="submit" form="new-product-form" disabled={isSubmitting}>{isSubmitting ? t('common.saving') : t('common.save')}</button></>} />
    <form id="new-product-form" onSubmit={handleSubmit}>
      {error && <Card><CardPad style={{ color: 'var(--danger)', fontSize: 13 }}><div role="alert">{error}</div></CardPad></Card>}
      <Card><CardHead title={t('inventory.newProduct.product')} sub={t('inventory.newProduct.productSubtitle')} /><CardPad>
        <div style={grid(220)}>
          <Fld id="product-name" label={t('inventory.newProduct.productName')}><div style={{ position: 'relative' }}><input id="product-name" required autoComplete="off" value={name} onFocus={() => setShowSuggestions(true)} onChange={(event) => { setName(event.target.value); setMasterItemId(undefined); setShowSuggestions(true) }} onKeyDown={handleNameKeyDown} placeholder={t('inventory.newProduct.productNamePlaceholder')} role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="product-name-listbox" aria-activedescendant={activeIndex >= 0 ? suggestionOptions[activeIndex]?.key : undefined} />
            {showSuggestions && name.trim().length >= 2 && <div id="product-name-listbox" role="listbox" style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, top: 'calc(100% + 4px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 12px 30px rgba(15,23,42,.14)', maxHeight: 320, overflowY: 'auto' }}>
              {localMatches.length > 0 && <><div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{t('inventory.newProduct.yourProducts')}</div>{existingOptions.map((option) => { const index = suggestionOptions.indexOf(option); return <button key={option.key} id={option.key} type="button" role="option" aria-selected={index === activeIndex} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, background: index === activeIndex ? 'var(--brand-soft)' : undefined }} onMouseEnter={() => setActiveIndex(index)} onClick={option.select}>{option.product.name}<span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>{t('inventory.newProduct.openExisting')}</span></button> })}</>}
              <div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{t('inventory.newProduct.masterItems')}</div>
              {masterOptions.map((option) => { const index = suggestionOptions.indexOf(option); return <button key={option.key} id={option.key} type="button" role="option" aria-selected={index === activeIndex} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, background: index === activeIndex ? 'var(--brand-soft)' : undefined }} onMouseEnter={() => setActiveIndex(index)} onClick={option.select}>{option.item.displayName}<span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>{option.item.category}</span></button> })}
              {!searching && suggestions.length === 0 && <div style={{ padding: 10, fontSize: 12, color: 'var(--muted)' }}>{t('inventory.newProduct.noMasterMatch', { name: name.trim() })}</div>}{searching && <div style={{ padding: 10, fontSize: 12, color: 'var(--muted)' }}>{t('inventory.newProduct.searching')}</div>}
            </div>}
          </div></Fld>
          <Fld id="product-brand" label={t('inventory.newProduct.brandOptional')}><input id="product-brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder={t('inventory.newProduct.brandPlaceholder')} /></Fld>
          <Fld id="product-category" label={t('inventory.newProduct.category')}><CategorySelect id="product-category" categories={categories} value={category} onChange={setCategory} /></Fld>
        </div>
        <details className="disclosure"><summary><ChevronDown size={14} className="chev" /> {t('inventory.newProduct.moreDetails')}</summary><div className="disclosure-body" style={grid(240)}><Fld id="product-description" label={t('inventory.newProduct.description')}><textarea id="product-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder={t('inventory.newProduct.descriptionPlaceholder')} /></Fld><Fld id="product-notes" label={t('inventory.newProduct.internalNotes')}><textarea id="product-notes" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={3} placeholder={t('inventory.newProduct.notesPlaceholder')} /></Fld></div></details>
      </CardPad></Card>
      <Card><CardHead title={t('inventory.newProduct.variants')} sub={t('inventory.newProduct.variantsSubtitle')} right={<button type="button" className="btn btn-sm" onClick={() => setRows((current) => [...current, { ...EMPTY_ROW }])}><Plus size={14} /> {t('inventory.newProduct.addVariant')}</button>} /><CardPad style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((row, index) => { const suffix = unitSuffix(row.unitOfMeasure); const fractional = allowsFractionalQuantity(row.unitOfMeasure); return <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><strong style={{ fontSize: 12, color: 'var(--muted)' }}>{t('inventory.newProduct.variant', { number: index + 1 })}</strong>{rows.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 size={14} /> {t('inventory.newProduct.remove')}</button>}</div>
          <div style={grid()}>{india ? <Fld id={`variant-${index}-mrp`} label={t('inventory.newProduct.mrp')}><input id={`variant-${index}-mrp`} type="number" min="0" step="0.01" required value={row.mrp} onChange={(event) => changeMrp(index, event.target.value)} placeholder={t('inventory.newProduct.required')} /></Fld> : <Fld id={`variant-${index}-list-price`} label={t('inventory.newProduct.listPrice')}><input id={`variant-${index}-list-price`} type="number" min="0" step="0.01" value={row.listPrice} onChange={(event) => setRow(index, { listPrice: event.target.value })} /></Fld>}
            <Fld id={`variant-${index}-selling-price`} label={suffix ? t('inventory.newProduct.pricePer', { unit: suffix }) : t('inventory.newProduct.sellingPrice')}><input id={`variant-${index}-selling-price`} type="number" min="0" step="0.01" required value={row.sellingPrice} onChange={(event) => setRow(index, { sellingPrice: event.target.value, sellingPriceEdited: true })} placeholder={t('inventory.newProduct.pricePlaceholder')} /></Fld>
            <Fld id={`variant-${index}-tax`} label={india ? t('inventory.newProduct.gstRate') : t('inventory.newProduct.salesTaxRate')}><input id={`variant-${index}-tax`} type="number" min="0" max="100" step="0.01" required value={row.taxRatePercent} onChange={(event) => setRow(index, { taxRatePercent: event.target.value })} placeholder={t('inventory.newProduct.gstRatePlaceholder')} /></Fld>
            <Fld id={`variant-${index}-unit`} label={t('inventory.newProduct.soldBy')}><select id={`variant-${index}-unit`} value={row.unitOfMeasure} onChange={(event) => setRow(index, { unitOfMeasure: event.target.value as Unit })}>{units.map((unit) => <option key={unit.value} value={unit.value}>{t(`inventory.units.${unit.value}` as MessageKey)}</option>)}</select></Fld>
            <Fld id={`variant-${index}-barcode`} label={<span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><ScanLine size={13} /> {t('inventory.newProduct.barcode')}</span>}><input id={`variant-${index}-barcode`} inputMode="numeric" maxLength={14} value={row.barcode} onChange={(event) => setRow(index, { barcode: event.target.value })} placeholder={t('inventory.newProduct.barcodePlaceholder')} /></Fld></div>
          <div style={{ ...grid(220), marginTop: 10 }}><Fld id={`variant-${index}-track`} label={t('inventory.newProduct.inventory')}><div className="chk-row"><input id={`variant-${index}-track`} type="checkbox" checked={row.trackInventory} onChange={(event) => setRow(index, { trackInventory: event.target.checked, allowNegativeStock: event.target.checked ? row.allowNegativeStock : false })} /> {t('inventory.newProduct.trackInventory')}</div></Fld>
            {row.trackInventory && <Fld id={`variant-${index}-negative`} label={t('inventory.newProduct.stockRule')}><div className="chk-row"><input id={`variant-${index}-negative`} type="checkbox" checked={row.allowNegativeStock} onChange={(event) => setRow(index, { allowNegativeStock: event.target.checked })} /> {t('inventory.newProduct.allowNegative')}</div></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-opening`} label={suffix ? `${t('inventory.newProduct.openingStock')} (${suffix})` : t('inventory.newProduct.openingStock')}><input id={`variant-${index}-opening`} type="number" min="0" step={fractional ? '0.001' : '1'} value={row.openingStock} onChange={(event) => setRow(index, { openingStock: event.target.value })} placeholder="0" /></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-expiry`} label={t('inventory.newProduct.expiryDate')}><input id={`variant-${index}-expiry`} type="date" value={row.expiryDate} onChange={(event) => setRow(index, { expiryDate: event.target.value })} /></Fld>}
            {row.trackInventory && <Fld id={`variant-${index}-reorder`} label={t('inventory.newProduct.reorderAt')}><input id={`variant-${index}-reorder`} type="number" min="0" step={fractional ? '0.001' : '1'} value={row.reorderThreshold} onChange={(event) => setRow(index, { reorderThreshold: event.target.value })} placeholder={t('inventory.newProduct.reorderAtHint')} /></Fld>}</div>
          <details className="disclosure"><summary><ChevronDown size={14} className="chev" /> {t('inventory.newProduct.moreVariantDetails')}</summary><div className="disclosure-body" style={grid()}>
            <Fld id={`variant-${index}-cost`} label={t('inventory.newProduct.costPrice')}><input id={`variant-${index}-cost`} type="number" min="0" step="0.01" value={row.costPrice} onChange={(event) => setRow(index, { costPrice: event.target.value })} placeholder={t('inventory.newProduct.costPricePlaceholder')} /></Fld>
            <Fld id={`variant-${index}-supplier`} label={t('inventory.newProduct.primarySupplier')}><select id={`variant-${index}-supplier`} value={row.supplierId} onChange={(event) => setRow(index, { supplierId: event.target.value })}><option value="">{t('inventory.newProduct.noSupplier')}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Fld>
            <Fld id={`variant-${index}-pack-size`} label={t('inventory.newProduct.purchasePackSize')}><input id={`variant-${index}-pack-size`} type="number" min="0" step="0.001" value={row.purchasePackSize} onChange={(event) => setRow(index, { purchasePackSize: event.target.value })} placeholder={t('inventory.newProduct.purchasePackPlaceholder')} /></Fld><Fld id={`variant-${index}-pack-unit`} label={t('inventory.newProduct.purchaseUnit')}><input id={`variant-${index}-pack-unit`} value={row.purchaseUnit} onChange={(event) => setRow(index, { purchaseUnit: event.target.value })} placeholder="e.g. carton" /></Fld>
            {india && <Fld id={`variant-${index}-hsn`} label={t('inventory.newProduct.hsnSac')}><input id={`variant-${index}-hsn`} inputMode="numeric" maxLength={8} value={row.hsnSac} onChange={(event) => setRow(index, { hsnSac: event.target.value })} placeholder={t('inventory.newProduct.hsnSacPlaceholder')} /></Fld>}
            <Fld id={`variant-${index}-size`} label={t('inventory.newProduct.sizePack')}><input id={`variant-${index}-size`} value={row.size} onChange={(event) => setRow(index, { size: event.target.value })} placeholder={t('inventory.newProduct.sizePackPlaceholder')} /></Fld><Fld id={`variant-${index}-color`} label={india ? t('inventory.newProduct.colour') : t('inventory.newProduct.color')}><input id={`variant-${index}-color`} value={row.color} onChange={(event) => setRow(index, { color: event.target.value })} placeholder={t('inventory.newProduct.colourPlaceholder')} /></Fld><Fld id={`variant-${index}-material`} label={t('inventory.newProduct.material')}><input id={`variant-${index}-material`} value={row.material} onChange={(event) => setRow(index, { material: event.target.value })} placeholder={t('inventory.newProduct.materialPlaceholder')} /></Fld><Fld id={`variant-${index}-sku`} label={t('inventory.newProduct.sku')}><input id={`variant-${index}-sku`} value={row.sku} onChange={(event) => setRow(index, { sku: event.target.value })} placeholder={t('inventory.newProduct.skuAuto')} /></Fld>
          </div></details>
        </div> })}
      </CardPad></Card>
    </form>
  </>
}
