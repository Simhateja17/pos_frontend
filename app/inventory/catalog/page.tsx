'use client'

import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LowStockBadge } from '@/components/low-stock-badge'

type Variant = {
  id: string
  productId: string
  sku: string
  size: string | null
  color: string | null
  material: string | null
  price: string
  reorderThreshold: number
  identityLocked: boolean
  currentStock: number
  createdAt: string
}

type Product = {
  id: string
  name: string
  category: string | null
  createdAt: string
  variants: Variant[]
}

type VariantFormRow = {
  sku: string
  size: string
  color: string
  material: string
  price: string
  reorderThreshold: string
}

const LOAD_ERROR = "Couldn't load your catalog. Check your connection and try again."

const EMPTY_VARIANT_ROW: VariantFormRow = {
  sku: '',
  size: '',
  color: '',
  material: '',
  price: '',
  reorderThreshold: '',
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function labelStyle() {
  return {
    fontSize: '13px',
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }
}

function variantAttributes(variant: Variant) {
  return [variant.size, variant.color, variant.material].filter(Boolean).join(' / ') || '—'
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([{ ...EMPTY_VARIANT_ROW }])
  const [addError, setAddError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/products', { headers })

    setIsLoading(false)

    if (error || !data) {
      setLoadError(LOAD_ERROR)
      return
    }

    setProducts(data)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function openAddDialog() {
    setAddName('')
    setAddCategory('')
    setVariantRows([{ ...EMPTY_VARIANT_ROW }])
    setAddError(null)
    setAddOpen(true)
  }

  function updateVariantRow(index: number, field: keyof VariantFormRow, value: string) {
    setVariantRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  function addVariantRow() {
    setVariantRows((rows) => [...rows, { ...EMPTY_VARIANT_ROW }])
  }

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddError(null)
    setIsSubmitting(true)

    const headers = await authHeader()
    const { error } = await apiClient.POST('/products', {
      body: {
        name: addName,
        category: addCategory || undefined,
        variants: variantRows.map((row) => ({
          sku: row.sku || undefined,
          size: row.size || undefined,
          color: row.color || undefined,
          material: row.material || undefined,
          price: Number(row.price),
          reorderThreshold: row.reorderThreshold ? Number(row.reorderThreshold) : undefined,
        })),
      },
      headers,
    })

    setIsSubmitting(false)

    if (error) {
      setAddError('Something went wrong saving this product — try again.')
      return
    }

    setAddOpen(false)
    loadProducts()
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}
        >
          Products
        </h1>
        <Button
          type="button"
          onClick={openAddDialog}
          style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
        >
          Add product
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
          <Button
            type="button"
            onClick={loadProducts}
            className="mt-2"
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!loadError && isLoading && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          Loading catalog…
        </p>
      )}

      {!loadError && !isLoading && products.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <h2
            style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}
          >
            No products yet
          </h2>
          <p className="max-w-md text-sm" style={{ color: '#64748B' }}>
            Add your first product to start tracking stock. Every product needs at least one size, color, or material variant.
          </p>
        </div>
      )}

      {!loadError && !isLoading && products.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product / Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <Fragment key={product.id}>
                <TableRow>
                  <TableCell colSpan={4} style={{ fontWeight: 700 }}>
                    {product.name}
                    {product.category ? (
                      <span className="ml-2 text-sm" style={{ color: '#64748B' }}>
                        {product.category}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
                {product.variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="pl-8">
                      <div className="flex flex-col gap-1">
                        <span style={{ color: '#64748B' }}>{variantAttributes(variant)}</span>
                        {variant.identityLocked && (
                          <span className="text-xs" style={{ color: '#64748B' }}>
                            Size, color, and material can&apos;t be changed once stock has moved
                            for this variant. Price and reorder threshold can still be edited
                            anytime.
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {variant.sku}
                        <LowStockBadge
                          quantity={variant.currentStock}
                          threshold={variant.reorderThreshold}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{variant.price}</TableCell>
                    <TableCell>{variant.currentStock}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add product dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-name" style={labelStyle()}>
                Product name
              </Label>
              <Input
                id="add-name"
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-category" style={labelStyle()}>
                Category
              </Label>
              <Input
                id="add-category"
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label style={labelStyle()}>Variants</Label>
              {variantRows.map((row, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-md border p-3" style={{ borderColor: '#E2E8F0' }}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label style={labelStyle()}>Size</Label>
                      <Input
                        value={row.size}
                        onChange={(e) => updateVariantRow(index, 'size', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={labelStyle()}>Color</Label>
                      <Input
                        value={row.color}
                        onChange={(e) => updateVariantRow(index, 'color', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={labelStyle()}>Material</Label>
                      <Input
                        value={row.material}
                        onChange={(e) => updateVariantRow(index, 'material', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label style={labelStyle()}>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={row.price}
                        onChange={(e) => updateVariantRow(index, 'price', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={labelStyle()}>SKU</Label>
                      <Input
                        placeholder="Auto-generated — you can edit this before saving"
                        value={row.sku}
                        onChange={(e) => updateVariantRow(index, 'sku', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addVariantRow}>
                Add variant
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Add product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
