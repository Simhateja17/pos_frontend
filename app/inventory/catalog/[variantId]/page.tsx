'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

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

const IDENTITY_LOCK_NOTICE =
  "Size, color, and material can't be changed once stock has moved for this variant. Price and reorder threshold can still be edited anytime."
const CASHIER_ADJUST_ERROR = 'Only managers and owners can adjust stock.'
const GENERIC_MOVEMENT_ERROR =
  'Something went wrong recording this stock movement — try again.'
const HISTORY_EMPTY_STATE = 'No stock movements yet. Receive stock to get started.'
const LOAD_ERROR = "Couldn't load this variant. Check your connection and try again."

const REASON_LABELS: Record<ReasonCode, string> = {
  damage: 'Damage',
  shrinkage_theft: 'Shrinkage / theft',
  count_correction: 'Count correction',
  other: 'Other',
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

function movementTypeLabel(type: StockMovement['movementType']) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export default function VariantDetailPage() {
  const params = useParams<{ variantId: string }>()
  const variantId = params.variantId

  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [history, setHistory] = useState<StockMovement[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Variants tab — editable price/reorderThreshold fields
  const [editPrice, setEditPrice] = useState('')
  const [editReorderThreshold, setEditReorderThreshold] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Receive modal
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveError, setReceiveError] = useState<string | null>(null)
  const [isReceiving, setIsReceiving] = useState(false)

  // Adjust modal
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState<ReasonCode>('damage')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)

  // Transfer modal
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferQty, setTransferQty] = useState('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  const loadVariant = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const headers = await authHeader()
    const { data, error } = await apiClient.GET('/products', { headers })

    if (error || !data) {
      setIsLoading(false)
      setLoadError(LOAD_ERROR)
      return
    }

    const foundProduct = data.find((p) => p.variants.some((v) => v.id === variantId)) ?? null
    const foundVariant =
      foundProduct?.variants.find((v) => v.id === variantId) ?? null

    setIsLoading(false)

    if (!foundProduct || !foundVariant) {
      setLoadError(LOAD_ERROR)
      return
    }

    setProduct(foundProduct)
    setVariant(foundVariant)
    setEditPrice(foundVariant.price)
    setEditReorderThreshold(String(foundVariant.reorderThreshold))
  }, [variantId])

  const loadHistory = useCallback(async () => {
    setHistoryError(null)

    const headers = await authHeader()
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

  useEffect(() => {
    loadVariant()
    loadHistory()
  }, [loadVariant, loadHistory])

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !variant) return

    setEditError(null)
    setIsSavingEdit(true)

    const headers = await authHeader()
    const { error } = await apiClient.PATCH('/products/{productId}/variants/{variantId}', {
      params: { path: { productId: product.id, variantId: variant.id } },
      body: {
        price: Number(editPrice),
        reorderThreshold: Number(editReorderThreshold),
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

  async function handleReceiveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!variant) return

    setReceiveError(null)
    setIsReceiving(true)

    const headers = await authHeader()
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
    setReceiveQty('')
    setSuccessMessage(`Stock received — ${receiveQty} units added to ${variantAttributes(variant)}`)
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

    const headers = await authHeader()
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
      if (response?.status === 403) {
        setAdjustError(CASHIER_ADJUST_ERROR)
      } else {
        setAdjustError(GENERIC_MOVEMENT_ERROR)
      }
      return
    }

    setAdjustOpen(false)
    setAdjustQty('')
    setAdjustReason('damage')
    setAdjustNote('')
    setSuccessMessage(`Adjustment recorded — ${variantAttributes(variant)} updated`)
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

    const headers = await authHeader()
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
    setTransferQty('')
    setSuccessMessage(`Transfer recorded — ${variantAttributes(variant)} updated`)
    await Promise.all([loadVariant(), loadHistory()])
  }

  const isLowStock = variant ? variant.currentStock <= variant.reorderThreshold : false

  return (
    <div className="mx-auto max-w-3xl p-8">
      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadError}</AlertDescription>
          <Button
            type="button"
            onClick={loadVariant}
            className="mt-2"
            style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!loadError && isLoading && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          Loading variant…
        </p>
      )}

      {!loadError && !isLoading && product && variant && (
        <>
          {successMessage && (
            <Alert className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="mb-2">
            <h1
              style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}
            >
              {product.name}
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              {variantAttributes(variant)} · SKU {variant.sku}
            </p>
          </div>

          <div className="mb-6 flex items-end justify-between">
            <div>
              <span
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: isLowStock ? '#F59E0B' : '#0058BA',
                }}
              >
                {variant.currentStock}
              </span>
              <span className="ml-2 text-sm" style={{ color: '#64748B' }}>
                units in stock
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setReceiveOpen(true)}
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Receive stock
              </Button>
              <Button
                type="button"
                onClick={() => setAdjustOpen(true)}
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Adjust stock
              </Button>
              <Button
                type="button"
                onClick={() => setTransferOpen(true)}
                style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
              >
                Transfer stock
              </Button>
            </div>
          </div>

          <Tabs defaultValue="variants">
            <TabsList>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="history">Stock history</TabsTrigger>
            </TabsList>

            <TabsContent value="variants" className="mt-4">
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                {editError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label style={labelStyle()}>Size</Label>
                    <Input value={variant.size ?? ''} disabled />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={labelStyle()}>Color</Label>
                    <Input value={variant.color ?? ''} disabled />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label style={labelStyle()}>Material</Label>
                    <Input value={variant.material ?? ''} disabled />
                  </div>
                </div>

                {variant.identityLocked && (
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {IDENTITY_LOCK_NOTICE}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="edit-price" style={labelStyle()}>
                      Price
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="edit-reorder-threshold" style={labelStyle()}>
                      Reorder threshold
                    </Label>
                    <Input
                      id="edit-reorder-threshold"
                      type="number"
                      required
                      value={editReorderThreshold}
                      onChange={(e) => setEditReorderThreshold(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isSavingEdit}
                    style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {historyError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{historyError}</AlertDescription>
                </Alert>
              )}

              {!historyError && history.length === 0 && (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  {HISTORY_EMPTY_STATE}
                </p>
              )}

              {!historyError && history.length > 0 && (
                <div className="flex flex-col gap-2">
                  {history.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-md border p-3"
                      style={{ borderColor: '#E2E8F0' }}
                    >
                      <div className="flex items-center gap-3">
                        <Badge className="b-grey">{movementTypeLabel(movement.movementType)}</Badge>
                        <span style={{ fontWeight: 700 }}>
                          {movement.quantityDelta > 0
                            ? `+${movement.quantityDelta}`
                            : movement.quantityDelta}
                        </span>
                        {movement.reasonCode && (
                          <span className="text-sm" style={{ color: '#64748B' }}>
                            {REASON_LABELS[movement.reasonCode]}
                          </span>
                        )}
                      </div>
                      <span className="text-sm" style={{ color: '#64748B' }}>
                        {new Date(movement.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Receive stock modal */}
          <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive stock</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleReceiveSubmit} className="flex flex-col gap-4">
                {receiveError && (
                  <Alert variant="destructive">
                    <AlertDescription>{receiveError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <Label htmlFor="receive-qty" style={labelStyle()}>
                    Quantity
                  </Label>
                  <Input
                    id="receive-qty"
                    type="number"
                    min={1}
                    step={1}
                    required
                    autoFocus
                    className="text-center"
                    style={{ fontSize: '28px', fontWeight: 700, maxWidth: '160px' }}
                    value={receiveQty}
                    onChange={(e) => setReceiveQty(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isReceiving}
                    style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                  >
                    Receive stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Adjust stock modal */}
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust stock</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
                {adjustError && (
                  <Alert variant="destructive">
                    <AlertDescription>{adjustError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <Label htmlFor="adjust-qty" style={labelStyle()}>
                    Quantity
                  </Label>
                  <Input
                    id="adjust-qty"
                    type="number"
                    step={1}
                    required
                    autoFocus
                    className="text-center"
                    style={{ fontSize: '28px', fontWeight: 700, maxWidth: '160px' }}
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={labelStyle()}>Reason</Label>
                  <Select
                    value={adjustReason}
                    onValueChange={(value) => setAdjustReason(value as ReasonCode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="shrinkage_theft">Shrinkage / theft</SelectItem>
                      <SelectItem value="count_correction">Count correction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {adjustReason === 'other' && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="adjust-note" style={labelStyle()}>
                      Notes
                    </Label>
                    <Input
                      id="adjust-note"
                      required
                      placeholder="Describe the reason for this adjustment"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isAdjusting}
                    style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                  >
                    Adjust stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Transfer stock modal */}
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer stock</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
                {transferError && (
                  <Alert variant="destructive">
                    <AlertDescription>{transferError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <Label htmlFor="transfer-qty" style={labelStyle()}>
                    Quantity
                  </Label>
                  <Input
                    id="transfer-qty"
                    type="number"
                    step={1}
                    required
                    autoFocus
                    className="text-center"
                    style={{ fontSize: '28px', fontWeight: 700, maxWidth: '160px' }}
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isTransferring}
                    style={{ backgroundColor: '#0058BA', color: '#FFFFFF' }}
                  >
                    Transfer stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
