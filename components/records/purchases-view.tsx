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
import { Badge, type BadgeTone, Card, CardHead, DataTable, Fld, KpiRow, Modal, PageHead, SearchField, Tabs } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useAppRegion } from '@/lib/app-region'
import { enumLabel, useT } from '@/lib/i18n/i18n'

type StatusFilter = 'all' | 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

const STATUS_TONE: Record<string, BadgeTone> = {
  draft: 'grey',
  sent: 'blue',
  partial: 'amber',
  received: 'green',
  cancelled: 'red',
}


type DraftLine = { variantId: string; quantityOrdered: string; unitCost: string }

export function PurchasesView() {
  const { money, pack } = useAppRegion()
  const t = useT()
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
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
      setError(cause instanceof Error ? cause.message : t('records.errors.purchasesLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch purchase orders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const variantOptions = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          label: `${product.name} · ${variant.sku}`,
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
        setCreateError(t('records.errors.catalogLoad'))
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
      setCreateError(t('records.errors.purchaseSupplier'))
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
      setCreateError(t('records.errors.purchaseItem'))
      return
    }
    if (new Set(lines.map((l) => l.variantId)).size !== lines.length) {
      setCreateError(t('records.errors.purchaseDuplicate'))
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
      setCreateError(cause instanceof Error ? cause.message : t('records.errors.purchaseCreate'))
    } finally {
      setSaving(false)
    }
  }

  async function send(po: PurchaseOrder) {
    try {
      await updateAuthenticatedPurchaseOrder(po.id, { status: 'sent' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('records.errors.purchaseSend'))
    }
  }

  function openReceive(po: PurchaseOrder) {
    setReceiving(po)
    setReceiptError(null)
    setReceiptNotice(null)
    // Pre-fill with what is still outstanding, the common case, but every
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
      setReceiptError(t('records.errors.purchaseReceiveQuantity'))
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
          t('records.purchases.recordedOver', { details: result.overReceived
            .map((o) => `${o.sku} received ${o.quantityReceived} against ${o.quantityOrdered} ordered`)
            .join('; ') }),
        )
      }
      await load()
    } catch (cause) {
      setReceiptError(cause instanceof Error ? cause.message : t('records.errors.purchaseReceive'))
    } finally {
      setSaving(false)
    }
  }

  const term = search.trim().toLowerCase()
  const visible = (orders ?? [])
    .filter((po) => (filter === 'all' ? true : po.status === filter))
    .filter((po) =>
      term
        ? [po.poNumber, po.supplierName].some((field) => (field ?? '').toLowerCase().includes(term))
        : true,
    )
  const openOrders = (orders ?? []).filter((po) => ['sent', 'partial'].includes(po.status))
  const openValue = openOrders.reduce((sum, po) => sum + Number(po.totalCost), 0)
  const filterItems: readonly { label: string; value: StatusFilter }[] = [
    { label: t('records.purchases.all'), value: 'all' },
    { label: t('records.purchases.draft'), value: 'draft' },
    { label: t('records.purchases.sent'), value: 'sent' },
    { label: t('records.purchases.partial'), value: 'partial' },
    { label: t('records.purchases.received'), value: 'received' },
    { label: t('records.purchases.cancelled'), value: 'cancelled' },
  ]

  return (
    <>
      <PageHead
        title={t('records.purchases.title')}
        sub={t('records.purchases.subtitle')}
        actions={
          <button className="btn btn-pri" onClick={() => void openCreate()}>
            <Plus size={15} /> {t('records.purchases.create')}
          </button>
        }
      />

      <KpiRow
        cols={3}
        items={[
          {
            label: t('records.purchases.openOrders'),
            value: orders ? String(openOrders.length) : '-',
            meta: orders ? t('records.purchases.openMeta') : t('records.purchases.loading'),
          },
          {
            label: t('records.purchases.valueOnOrder'),
            value: orders ? money(openValue) : '-',
            meta: t('records.purchases.orderedCost'),
          },
          {
            label: t('records.purchases.awaitingReceipt'),
            value: orders ? String(openOrders.filter((po) => po.status === 'partial').length) : '-',
            meta: t('records.purchases.partialMeta'),
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
          title={t('records.purchases.ordersTitle')}
          sub={orders ? t('records.suppliers.shown', { count: visible.length }) : t('records.purchases.loading')}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {orders && orders.length > 0 ? (
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder={t('records.purchases.searchPlaceholder')}
                  ariaLabel={t('records.purchases.searchLabel')}
                  width={240}
                />
              ) : null}
              <Tabs items={filterItems} active={filter} onSelect={setFilter} ariaLabel={t('records.purchases.filterLabel')} />
            </div>
          }
        />

        {loading && <LoadingState label={t('records.purchases.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={<Warehouse size={24} strokeWidth={1.8} />}
            title={
              term
                ? t('records.purchases.noMatchSearch')
                : filter === 'all'
                  ? t('records.purchases.noOrders')
                  : t('records.purchases.noMatchFilter')
            }
            body={t('records.purchases.emptyBody')}
            action={
              filter === 'all' && !term ? (
                <button className="btn btn-pri" onClick={() => void openCreate()}>
                  <Plus size={15} /> {t('records.purchases.create')}
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <DataTable
            cols={[t('records.purchases.cols.number'), t('records.purchases.cols.supplier'), t('records.purchases.cols.expected'), t('records.purchases.cols.items'), t('records.purchases.cols.received'), t('records.purchases.cols.value'), t('records.purchases.cols.status'), t('records.purchases.cols.actions')]}
            minWidth={940}
          >
            {visible.map((po) => {
              const ordered = po.lines.reduce((s, l) => s + l.quantityOrdered, 0)
              const received = po.lines.reduce((s, l) => s + l.quantityReceived, 0)
              return (
                <tr key={po.id}>
                  <td className="t-mono t-strong">{po.poNumber}</td>
                  <td>{po.supplierName}</td>
                  <td className="t-sub">{po.expectedDate ?? '-'}</td>
                  <td className="num">{ordered}</td>
                  <td className="num t-sub">
                    {received}/{ordered}
                  </td>
                  <td className="num t-strong">{money(po.totalCost)}</td>
                  <td>
                    <Badge tone={STATUS_TONE[po.status] ?? 'grey'}>{enumLabel(t, 'status', po.status)}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {po.status === 'draft' && (
                        <button className="btn btn-sm" onClick={() => void send(po)}>
                          {t('records.purchases.markSent')}
                        </button>
                      )}
                      {['sent', 'partial'].includes(po.status) && (
                        <button className="btn btn-sm btn-pri" onClick={() => openReceive(po)}>
                          {t('records.purchases.receive')}
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
          title={t('records.purchases.createTitle')}
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCreateOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="po-form" disabled={saving}>
                {saving ? t('records.purchases.creating') : t('records.purchases.create')}
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
                {t('records.purchases.suppliersEmpty')}
              </div>
            ) : (
              <>
                <Fld id="po-supplier" label={t('records.purchases.supplier')}>
                  <select id="po-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">{t('records.purchases.chooseSupplier')}</option>
                    {suppliers
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({t('records.purchases.leadTime', { count: s.leadTimeDays })})
                        </option>
                      ))}
                  </select>
                </Fld>

                <Fld id="po-expected" label={t('records.purchases.expectedDate')}>
                  <input
                    id="po-expected"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </Fld>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', margin: '4px 0 8px' }}>{t('records.purchases.items')}</div>
                {draftLines.map((line, index) => (
                  <div
                    key={index}
                    style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 11, marginBottom: 9 }}
                  >
                    <Fld id={`po-variant-${index}`} label={t('records.purchases.item')}>
                      <select
                        id={`po-variant-${index}`}
                        value={line.variantId}
                        onChange={(e) => setLine(index, 'variantId', e.target.value)}
                      >
                        <option value="">{t('records.purchases.chooseItem')}</option>
                        {variantOptions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </Fld>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Fld id={`po-qty-${index}`} label={t('records.purchases.quantity')}>
                        <input
                          id={`po-qty-${index}`}
                          type="number"
                          min={1}
                          value={line.quantityOrdered}
                          onChange={(e) => setLine(index, 'quantityOrdered', e.target.value)}
                        />
                      </Fld>
                      <Fld id={`po-cost-${index}`} label={t('records.purchases.unitCost', { currency: pack.currencySymbol })}>
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
                  <Plus size={14} /> {t('records.purchases.addItem')}
                </button>
              </>
            )}
          </form>
        </Modal>
      )}

      {receiving && (
        <Modal
          title={t('records.purchases.receiveAgainst', { number: receiving.poNumber })}
          onClose={() => setReceiving(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setReceiving(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-pri" type="submit" form="receive-form" disabled={saving}>
                {saving ? t('records.purchases.recording') : t('records.purchases.recordReceipt')}
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
              {t('records.purchases.receiveHelp')}
            </div>

            {receiving.lines.map((line) => (
              <div
                key={line.id}
                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 11, marginBottom: 9 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{line.productName}</div>
                <div className="t-mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 9 }}>
                  {line.sku} · {t('records.purchases.receivedSoFar', { received: line.quantityReceived, ordered: line.quantityOrdered })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Fld id={`rcv-qty-${line.id}`} label={t('records.purchases.quantityArriving')}>
                    <input
                      id={`rcv-qty-${line.id}`}
                      type="number"
                      min={0}
                      value={receiptQty[line.id] ?? ''}
                      onChange={(e) => setReceiptQty((q) => ({ ...q, [line.id]: e.target.value }))}
                    />
                  </Fld>
                  <Fld id={`rcv-cost-${line.id}`} label={t('records.purchases.unitCost', { currency: pack.currencySymbol })}>
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
