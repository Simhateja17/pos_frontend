'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Warehouse } from 'lucide-react'
import {
  type Product,
  type PurchaseOrder,
  type Supplier,
  createAuthenticatedPurchaseOrder,
  getAuthenticatedProducts,
  getAuthenticatedPurchaseOrders,
  getAuthenticatedSuppliers,
  receiveAuthenticatedPurchaseOrder,
  updateAuthenticatedPurchaseOrder,
} from '@/lib/api/authenticated-client'
import { Badge, type BadgeTone, Card, CardHead, DataTable, Fld, KpiRow, Modal, PageHead, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

type StatusFilter = 'all' | 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

const FILTERS: readonly { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Partial', value: 'partial' },
  { label: 'Received', value: 'received' },
]

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: 'grey',
  sent: 'blue',
  partial: 'amber',
  received: 'green',
  cancelled: 'red',
}

const money = (value: string | number) =>
  `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type DraftLine = { variantId: string; quantityOrdered: string; unitCost: string }

export function PurchasesView() {
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [draftLines, setDraftLines] = useState<DraftLine[]>([{ variantId: '', quantityOrdered: '', unitCost: '' }])
  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null)
  const [receiptQty, setReceiptQty] = useState<Record<string, string>>({})
  const [receiptCost, setReceiptCost] = useState<Record<string, string>>({})
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [poList, supplierList] = await Promise.all([
        getAuthenticatedPurchaseOrders(),
        getAuthenticatedSuppliers(),
      ])
      setOrders(poList)
      setSuppliers(supplierList)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Purchase orders are unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const variantOptions = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          label: `${product.name} — ${variant.sku}`,
        })),
      ),
    [products],
  )

  async function openCreate() {
    setSupplierId('')
    setExpectedDate('')
    setDraftLines([{ variantId: '', quantityOrdered: '', unitCost: '' }])
    setCreateError(null)
    setCreateOpen(true)
    if (products.length === 0) {
      try {
        setProducts(await getAuthenticatedProducts())
      } catch {
        setCreateError('Your catalog could not be loaded, so items cannot be added to this order.')
      }
    }
  }

  function setLine(index: number, field: keyof DraftLine, value: string) {
    setDraftLines((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)

    if (!supplierId) {
      setCreateError('Choose a supplier for this order.')
      return
    }
    const lines = draftLines
      .filter((l) => l.variantId && l.quantityOrdered)
      .map((l) => ({
        variantId: l.variantId,
        quantityOrdered: Number(l.quantityOrdered),
        unitCost: Number(l.unitCost || 0),
      }))
    if (lines.length === 0) {
      setCreateError('Add at least one item with a quantity.')
      return
    }
    if (new Set(lines.map((l) => l.variantId)).size !== lines.length) {
      setCreateError('Each item can appear only once on an order.')
      return
    }

    setSaving(true)
    try {
      await createAuthenticatedPurchaseOrder({
        supplierId,
        expectedDate: expectedDate || undefined,
        lines,
      })
      setCreateOpen(false)
      await load()
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : 'That purchase order could not be created.')
    } finally {
      setSaving(false)
    }
  }

  async function send(po: PurchaseOrder) {
    try {
      await updateAuthenticatedPurchaseOrder(po.id, { status: 'sent' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That purchase order could not be sent.')
    }
  }

  function openReceive(po: PurchaseOrder) {
    setReceiving(po)
    setReceiptError(null)
    setReceiptNotice(null)
    // Pre-fill with what is still outstanding — the common case — but every
    // field stays editable, because partial delivery is normal.
    setReceiptQty(
      Object.fromEntries(
        po.lines.map((l) => [l.id, String(Math.max(0, l.quantityOrdered - l.quantityReceived))]),
      ),
    )
    setReceiptCost(Object.fromEntries(po.lines.map((l) => [l.id, l.unitCost])))
  }

  async function handleReceive(event: FormEvent) {
    event.preventDefault()
    if (!receiving) return
    setReceiptError(null)

    const lines = receiving.lines
      .map((l) => ({
        purchaseOrderLineId: l.id,
        quantityReceived: Number(receiptQty[l.id] || 0),
        unitCost: receiptCost[l.id] ? Number(receiptCost[l.id]) : undefined,
      }))
      .filter((l) => l.quantityReceived > 0)

    if (lines.length === 0) {
      setReceiptError('Enter the quantity that actually arrived for at least one item.')
      return
    }

    setSaving(true)
    try {
      const result = await receiveAuthenticatedPurchaseOrder(receiving.id, {
        // Fresh key per submission attempt: this is the idempotency token the
        // server uses to collapse a retry of THIS delivery into one receipt.
        clientReceiptId: crypto.randomUUID(),
        lines,
      })
      setReceiving(null)
      if (result.overReceived.length > 0) {
        setReceiptNotice(
          `Recorded. ${result.overReceived
            .map((o) => `${o.sku} received ${o.quantityReceived} against ${o.quantityOrdered} ordered`)
            .join('; ')}. Stock reflects what actually arrived.`,
        )
      }
      await load()
    } catch (cause) {
      setReceiptError(cause instanceof Error ? cause.message : 'That goods receipt could not be recorded.')
    } finally {
      setSaving(false)
    }
  }

  const visible = (orders ?? []).filter((po) => (filter === 'all' ? true : po.status === filter))
  const openOrders = (orders ?? []).filter((po) => ['sent', 'partial'].includes(po.status))
  const openValue = openOrders.reduce((sum, po) => sum + Number(po.totalCost), 0)

  return (
    <>
      <PageHead
        title="Purchases"
        sub="Purchase orders and goods receipt"
        actions={
          <button className="btn btn-pri" onClick={() => void openCreate()}>
            <Plus size={15} /> Create PO
          </button>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: 'Open orders',
            value: orders ? String(openOrders.length) : '—',
            meta: orders ? 'sent or partially received' : 'Loading…',
          },
          {
            label: 'Value on order',
            value: orders ? money(openValue) : '—',
            meta: 'at ordered unit cost',
          },
          {
            label: 'Awaiting receipt',
            value: orders ? String(openOrders.filter((po) => po.status === 'partial').length) : '—',
            meta: 'partially delivered',
          },
        ]}
      />

      {receiptNotice && (
        <Card>
          <div style={{ padding: '13px 16px', fontSize: 13, color: 'var(--ink-2)' }} role="status">
            {receiptNotice}
          </div>
        </Card>
      )}

      <Card>
        <CardHead
          title="Purchase orders"
          sub={orders ? `${visible.length} shown` : 'Loading…'}
          right={<Tabs items={FILTERS} active={filter} onSelect={setFilter} ariaLabel="Filter purchase orders" />}
        />

        {loading && <LoadingState label="Loading purchase orders" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<Warehouse size={24} strokeWidth={1.8} />}
            title={filter === 'all' ? 'No purchase orders yet' : 'No orders match this filter'}
            body="Raise a purchase order against a supplier. Receiving against it is what puts stock on your shelves and records what it cost."
            action={
              filter === 'all' ? (
                <button className="btn btn-pri" onClick={() => void openCreate()}>
                  <Plus size={15} /> Create PO
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={['PO #', 'Supplier', 'Expected', 'Items', 'Received', 'Value', 'Status', '']}
            minWidth={940}
          >
            {visible.map((po) => {
              const ordered = po.lines.reduce((s, l) => s + l.quantityOrdered, 0)
              const received = po.lines.reduce((s, l) => s + l.quantityReceived, 0)
              return (
                <tr key={po.id}>
                  <td className="t-mono t-strong">{po.poNumber}</td>
                  <td>{po.supplierName}</td>
                  <td className="t-sub">{po.expectedDate ?? '—'}</td>
                  <td className="num">{ordered}</td>
                  <td className="num t-sub">
                    {received}/{ordered}
                  </td>
                  <td className="num t-strong">{money(po.totalCost)}</td>
                  <td>
                    <Badge tone={STATUS_TONE[po.status] ?? 'grey'}>{po.status}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {po.status === 'draft' && (
                        <button className="btn btn-sm" onClick={() => void send(po)}>
                          Mark sent
                        </button>
                      )}
                      {['sent', 'partial'].includes(po.status) && (
                        <button className="btn btn-sm btn-pri" onClick={() => openReceive(po)}>
                          Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </Card>

      {createOpen && (
        <Modal
          title="Create purchase order"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="po-form" disabled={saving}>
                {saving ? 'Creating…' : 'Create PO'}
              </button>
            </>
          }
        >
          <form id="po-form" onSubmit={handleCreate}>
            {createError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {createError}
              </div>
            )}

            {suppliers.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                You have no suppliers yet. Add a supplier first — a purchase order has to be raised against one.
              </div>
            ) : (
              <>
                <Fld id="po-supplier" label="Supplier">
                  <select id="po-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">Choose a supplier…</option>
                    {suppliers
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.leadTimeDays}-day lead time)
                        </option>
                      ))}
                  </select>
                </Fld>

                <Fld id="po-expected" label="Expected date">
                  <input
                    id="po-expected"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </Fld>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', margin: '4px 0 8px' }}>Items</div>
                {draftLines.map((line, index) => (
                  <div
                    key={index}
                    style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 11, marginBottom: 9 }}
                  >
                    <Fld id={`po-variant-${index}`} label="Item">
                      <select
                        id={`po-variant-${index}`}
                        value={line.variantId}
                        onChange={(e) => setLine(index, 'variantId', e.target.value)}
                      >
                        <option value="">Choose an item…</option>
                        {variantOptions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </Fld>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Fld id={`po-qty-${index}`} label="Quantity">
                        <input
                          id={`po-qty-${index}`}
                          type="number"
                          min={1}
                          value={line.quantityOrdered}
                          onChange={(e) => setLine(index, 'quantityOrdered', e.target.value)}
                        />
                      </Fld>
                      <Fld id={`po-cost-${index}`} label="Unit cost (₹)">
                        <input
                          id={`po-cost-${index}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) => setLine(index, 'unitCost', e.target.value)}
                        />
                      </Fld>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => setDraftLines((rows) => [...rows, { variantId: '', quantityOrdered: '', unitCost: '' }])}
                >
                  <Plus size={14} /> Add item
                </button>
              </>
            )}
          </form>
        </Modal>
      )}

      {receiving && (
        <Modal
          title={`Receive against ${receiving.poNumber}`}
          onClose={() => setReceiving(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setReceiving(null)}>
                Cancel
              </button>
              <button className="btn btn-pri" type="submit" form="receive-form" disabled={saving}>
                {saving ? 'Recording…' : 'Record receipt'}
              </button>
            </>
          }
        >
          <form id="receive-form" onSubmit={handleReceive}>
            {receiptError && (
              <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                {receiptError}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 13, lineHeight: 1.5 }}>
              Enter what actually arrived. A part delivery is fine — the rest stays outstanding on this order. The unit
              cost you enter here is what updates each item&apos;s average cost.
            </div>

            {receiving.lines.map((line) => (
              <div
                key={line.id}
                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 11, marginBottom: 9 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{line.productName}</div>
                <div className="t-mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 9 }}>
                  {line.sku} · {line.quantityReceived} of {line.quantityOrdered} received so far
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Fld id={`rcv-qty-${line.id}`} label="Quantity arriving">
                    <input
                      id={`rcv-qty-${line.id}`}
                      type="number"
                      min={0}
                      value={receiptQty[line.id] ?? ''}
                      onChange={(e) => setReceiptQty((q) => ({ ...q, [line.id]: e.target.value }))}
                    />
                  </Fld>
                  <Fld id={`rcv-cost-${line.id}`} label="Unit cost (₹)">
                    <input
                      id={`rcv-cost-${line.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={receiptCost[line.id] ?? ''}
                      onChange={(e) => setReceiptCost((c) => ({ ...c, [line.id]: e.target.value }))}
                    />
                  </Fld>
                </div>
              </div>
            ))}
          </form>
        </Modal>
      )}
    </>
  )
}
