'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ScanLine, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { Card, CardHead, CardPad, Fld, PageHead } from '@/components/couture/ui'
import { UNITS, allowsFractionalQuantity, unitSuffix, type Unit } from '@/lib/units'
import { CategorySelect, type CategoryOption } from '@/components/inventory/category-select'

type VariantFormRow = {
  barcode: string
  unitOfMeasure: Unit
  sku: string
  size: string
  color: string
  material: string
  price: string
  reorderThreshold: string
  /** Optional. Written as a 'receive' stock movement after the product is
   * created — stock is never set directly, only ever added to the append-only
   * ledger, same as CSV import already does for its quantityOnHand column. */
  openingStock: string
}

const EMPTY_VARIANT_ROW: VariantFormRow = {
  barcode: '',
  unitOfMeasure: 'piece',
  sku: '',
  size: '',
  color: '',
  material: '',
  price: '',
  reorderThreshold: '',
  openingStock: '',
}

export default function NewProductPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<{ categoryId?: string; categoryName?: string }>({})
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [rows, setRows] = useState<VariantFormRow[]>([{ ...EMPTY_VARIANT_ROW }])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** Barcodes already in this tenant's catalog, so a duplicate is caught before submit. */
  const [knownBarcodes, setKnownBarcodes] = useState<Map<string, string>>(new Map())
  const firstBarcodeRef = useRef<HTMLInputElement>(null)

  const loadCategories = useCallback(async () => {
    const { data } = await apiClient.GET('/categories', { headers: await authHeaders() })
    if (data) setCategories(data.map((c) => ({ id: c.id, name: c.name })))
  }, [])

  const loadKnownBarcodes = useCallback(async () => {
    const { data } = await apiClient.GET('/products', { headers: await authHeaders() })
    if (!data) return
    const found = new Map<string, string>()
    for (const product of data) {
      for (const variant of product.variants) {
        if (variant.barcode) found.set(variant.barcode, product.name)
      }
    }
    setKnownBarcodes(found)
  }, [])

  useEffect(() => {
    void loadKnownBarcodes()
    void loadCategories()
    // A hardware scanner types like a keyboard, so landing with the first
    // barcode field focused makes "scan the item to start" work with no
    // instructions and no extra click.
    firstBarcodeRef.current?.focus()
  }, [loadKnownBarcodes, loadCategories])

  function setRow(index: number, field: keyof VariantFormRow, value: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((current) => [...current, { ...EMPTY_VARIANT_ROW }])
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)))
  }

  function validate(): string | null {
    if (!name.trim()) return 'Give this product a name.'

    for (const [i, row] of rows.entries()) {
      const position = rows.length > 1 ? ` (variant ${i + 1})` : ''

      if (row.price.trim() === '' || Number.isNaN(Number(row.price))) {
        return `Enter a price${position}.`
      }
      if (row.barcode.trim() && !/^\d{8,14}$/.test(row.barcode.trim())) {
        return `A barcode must be 8-14 digits${position}.`
      }
      if (row.barcode.trim() && knownBarcodes.has(row.barcode.trim())) {
        return `That barcode already belongs to "${knownBarcodes.get(row.barcode.trim())}"${position}.`
      }
      // Mirrors the server rule: a discrete unit cannot reorder at 5.5.
      if (
        row.reorderThreshold.trim() &&
        !allowsFractionalQuantity(row.unitOfMeasure) &&
        !Number.isInteger(Number(row.reorderThreshold))
      ) {
        return `A ${row.unitOfMeasure} variant's reorder point must be a whole number${position}.`
      }
      if (row.openingStock.trim()) {
        const qty = Number(row.openingStock)
        if (Number.isNaN(qty) || qty < 0) {
          return `Enter a valid opening stock quantity${position}.`
        }
        if (!allowsFractionalQuantity(row.unitOfMeasure) && !Number.isInteger(qty)) {
          return `A ${row.unitOfMeasure} variant's opening stock must be a whole number${position}.`
        }
      }
    }

    const entered = rows.map((r) => r.barcode.trim()).filter(Boolean)
    if (new Set(entered).size !== entered.length) {
      return 'Two variants have the same barcode.'
    }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setIsSubmitting(true)

    const headers = await authHeaders()
    const { data, error: requestError } = await apiClient.POST('/products', {
      body: {
        name: name.trim(),
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        variants: rows.map((row) => ({
          sku: row.sku.trim() || undefined,
          barcode: row.barcode.trim() || undefined,
          unitOfMeasure: row.unitOfMeasure,
          size: row.size.trim() || undefined,
          color: row.color.trim() || undefined,
          material: row.material.trim() || undefined,
          price: Number(row.price),
          reorderThreshold: row.reorderThreshold.trim() ? Number(row.reorderThreshold) : undefined,
        })),
      },
      headers,
    })

    if (requestError || !data) {
      setIsSubmitting(false)
      setError(
        (requestError as { error?: string } | undefined)?.error ??
          'Something went wrong saving this product. Try again.',
      )
      return
    }

    // Stock is never set directly, only ever added to the append-only ledger —
    // same as CSV import's quantityOnHand column. The response's variants come
    // back in the same order they were sent, so index-matching is safe here.
    await Promise.all(
      data.variants.map((variant, index) => {
        const qty = rows[index]?.openingStock.trim()
        if (!qty || Number(qty) <= 0) return Promise.resolve()
        return apiClient.POST('/stock-movements', {
          body: { variantId: variant.id, movementType: 'receive', quantityDelta: Number(qty) },
          headers,
        })
      }),
    )

    setIsSubmitting(false)
    router.push('/app/inventory')
  }

  return (
    <>
      <PageHead
        title="Add product"
        sub="Scan a barcode to start, or type the details in"
        actions={
          <>
            <Link className="btn" href="/app/inventory">
              Cancel
            </Link>
            <button className="btn btn-pri" type="submit" form="new-product-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save product'}
            </button>
          </>
        }
      />

      <form id="new-product-form" onSubmit={handleSubmit}>
        {error && (
          <Card>
            <CardPad style={{ color: 'var(--danger)', fontSize: 13 }}>
              <div role="alert">{error}</div>
            </CardPad>
          </Card>
        )}

        <Card>
          <CardHead title="Product" sub="What this item is called on the till and on receipts" />
          <CardPad>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <Fld id="product-name" label="Product name">
                <input
                  id="product-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aashirvaad Atta"
                />
              </Fld>
              <Fld id="product-category" label="Category">
                <CategorySelect
                  id="product-category"
                  categories={categories}
                  value={category}
                  onChange={setCategory}
                />
              </Fld>
            </div>
          </CardPad>
        </Card>

        <Card>
          <CardHead
            title="Variants"
            sub="One row per thing you actually sell. The same product can be sold loose and pre-packed, so add a row for each."
            right={
              <button type="button" className="btn btn-sm" onClick={addRow}>
                <Plus size={14} /> Add variant
              </button>
            }
          />
          <CardPad style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rows.map((row, index) => {
              const suffix = unitSuffix(row.unitOfMeasure)
              const fractional = allowsFractionalQuantity(row.unitOfMeasure)
              return (
                <div
                  key={index}
                  style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)' }}>
                      VARIANT {index + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => removeRow(index)}
                        aria-label={`Remove variant ${index + 1}`}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                    <Fld
                      id={`variant-${index}-barcode`}
                      label={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <ScanLine size={13} /> Barcode
                        </span>
                      }
                    >
                      <input
                        id={`variant-${index}-barcode`}
                        ref={index === 0 ? firstBarcodeRef : undefined}
                        inputMode="numeric"
                        maxLength={14}
                        value={row.barcode}
                        onChange={(e) => setRow(index, 'barcode', e.target.value)}
                        placeholder="Scan or type the printed barcode"
                      />
                    </Fld>
                    <Fld id={`variant-${index}-unit`} label="Sold by">
                      <select
                        id={`variant-${index}-unit`}
                        value={row.unitOfMeasure}
                        onChange={(e) => setRow(index, 'unitOfMeasure', e.target.value)}
                      >
                        {UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </Fld>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <Fld id={`variant-${index}-price`} label={suffix ? `Price per ${suffix}` : 'Price'}>
                      <input
                        id={`variant-${index}-price`}
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={row.price}
                        onChange={(e) => setRow(index, 'price', e.target.value)}
                      />
                    </Fld>
                    <Fld id={`variant-${index}-opening-stock`} label={suffix ? `Opening stock (${suffix})` : 'Opening stock'}>
                      <input
                        id={`variant-${index}-opening-stock`}
                        type="number"
                        min="0"
                        step={fractional ? '0.001' : '1'}
                        value={row.openingStock}
                        onChange={(e) => setRow(index, 'openingStock', e.target.value)}
                        placeholder="0"
                      />
                    </Fld>
                    <Fld id={`variant-${index}-reorder`} label="Reorder at">
                      <input
                        id={`variant-${index}-reorder`}
                        type="number"
                        min="0"
                        step={fractional ? '0.001' : '1'}
                        value={row.reorderThreshold}
                        onChange={(e) => setRow(index, 'reorderThreshold', e.target.value)}
                        placeholder="Defaults to 4"
                      />
                    </Fld>
                    <Fld id={`variant-${index}-sku`} label="SKU">
                      <input
                        id={`variant-${index}-sku`}
                        value={row.sku}
                        onChange={(e) => setRow(index, 'sku', e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </Fld>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <Fld id={`variant-${index}-size`} label="Size">
                      <input
                        id={`variant-${index}-size`}
                        value={row.size}
                        onChange={(e) => setRow(index, 'size', e.target.value)}
                      />
                    </Fld>
                    <Fld id={`variant-${index}-color`} label="Colour">
                      <input
                        id={`variant-${index}-color`}
                        value={row.color}
                        onChange={(e) => setRow(index, 'color', e.target.value)}
                      />
                    </Fld>
                    <Fld id={`variant-${index}-material`} label="Material">
                      <input
                        id={`variant-${index}-material`}
                        value={row.material}
                        onChange={(e) => setRow(index, 'material', e.target.value)}
                      />
                    </Fld>
                  </div>
                </div>
              )
            })}
          </CardPad>
        </Card>
      </form>
    </>
  )
}
