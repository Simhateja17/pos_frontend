'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import {
  createAuthenticatedTransfer,
  getAuthenticatedProducts,
  getAuthenticatedAppContext,
  getAuthenticatedTransfers,
  getAuthenticatedTransferDestinations,
  receiveAuthenticatedTransfer,
  type Product,
  type StockTransfer,
  type TransferDestination,
} from '@/lib/api/authenticated-client'
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

export function TransfersView() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [destinations, setDestinations] = useState<TransferDestination[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [receiving, setReceiving] = useState<StockTransfer | null>(null)
  const [received, setReceived] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextTransfers, nextDestinations, nextProducts, context] = await Promise.all([
        getAuthenticatedTransfers(),
        getAuthenticatedTransferDestinations(),
        getAuthenticatedProducts(),
        getAuthenticatedAppContext(),
      ])
      setTransfers(nextTransfers)
      setDestinations(nextDestinations)
      setProducts(nextProducts)
      setActiveStoreId(context.store?.id ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transfers are unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const variants = useMemo(
    () => products.flatMap((product) => product.variants.map((variant) => ({ ...variant, productName: product.name }))),
    [products],
  )

  async function send(event: FormEvent) {
    event.preventDefault()
    const parsedQuantity = Number(quantity)
    if (!destination || !variantId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Choose a destination, a variant, and a positive quantity.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createAuthenticatedTransfer({
        clientTransferId: crypto.randomUUID(),
        toStoreId: destination,
        lines: [{ variantId, quantitySent: parsedQuantity }],
      })
      setCreateOpen(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That transfer could not be sent.')
    } finally {
      setSaving(false)
    }
  }

  function openReceive(transfer: StockTransfer) {
    setReceiving(transfer)
    setReceived(Object.fromEntries(transfer.lines.map((line) => [line.id, line.quantitySent])))
  }

  async function confirmReceive() {
    if (!receiving) return
    const lines = receiving.lines.map((line) => ({
      transferLineId: line.id,
      quantityReceived: Number(received[line.id]),
    }))
    if (lines.some((line) => !Number.isFinite(line.quantityReceived) || line.quantityReceived < 0)) {
      setError('Enter a zero or positive received quantity for every line.')
      return
    }
    setSaving(true)
    try {
      await receiveAuthenticatedTransfer(receiving.id, { clientReceiveId: crypto.randomUUID(), lines })
      setReceiving(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That receipt could not be confirmed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Stock transfers"
        sub="Send from one shop, then confirm exactly what arrived"
        actions={<button className="btn btn-pri" onClick={() => setCreateOpen(true)}><Plus size={15} /> Send stock</button>}
      />
      <Card>
        <CardHead title="Transfer history" sub={`${transfers.length} transfer${transfers.length === 1 ? '' : 's'}`} />
        {loading && <LoadingState label="Loading transfers" />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && transfers.length === 0 && <EmptyState title="No transfers yet" body="Send stock to another active shop when it physically leaves this one." />}
        {!loading && transfers.length > 0 && (
          <DataTable cols={['Route', 'Sent', 'Status', 'Quantities', { label: '', align: 'right' }]} minWidth={760}>
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td className="t-strong">{transfer.fromStoreName} <ArrowRight size={13} style={{ verticalAlign: 'middle' }} /> {transfer.toStoreName}</td>
                <td>{new Date(transfer.sentAt).toLocaleString()}</td>
                <td><Badge tone={transfer.status === 'received' ? 'green' : 'amber'}>{transfer.status}</Badge></td>
                <td>{transfer.lines.map((line) => `${line.sku}: ${line.quantitySent}${line.quantityReceived === null ? '' : ` → ${line.quantityReceived}`}`).join(', ')}</td>
                <td style={{ textAlign: 'right' }}>
                  {transfer.status === 'sent' && transfer.toStoreId === activeStoreId ? <button className="btn btn-sm" onClick={() => openReceive(transfer)}>Receive</button> : null}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {createOpen && (
        <Modal title="Send stock" onClose={() => setCreateOpen(false)} footer={<><button className="btn" onClick={() => setCreateOpen(false)}>Cancel</button><button className="btn btn-pri" onClick={send} disabled={saving}>{saving ? 'Sending…' : 'Send stock'}</button></>}>
          <form onSubmit={send}>
            <Fld id="transfer-store" label="Destination shop"><select id="transfer-store" value={destination} onChange={(event) => setDestination(event.target.value)}><option value="">Choose a shop</option>{destinations.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></Fld>
            <Fld id="transfer-variant" label="Variant"><select id="transfer-variant" value={variantId} onChange={(event) => setVariantId(event.target.value)}><option value="">Choose a variant</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.sku} · {variant.currentStock} available</option>)}</select></Fld>
            <Fld id="transfer-quantity" label="Quantity sent"><input id="transfer-quantity" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Fld>
          </form>
        </Modal>
      )}

      {receiving && (
        <Modal title={`Receive from ${receiving.fromStoreName}`} onClose={() => setReceiving(null)} footer={<><button className="btn" onClick={() => setReceiving(null)}>Cancel</button><button className="btn btn-pri" onClick={() => void confirmReceive()} disabled={saving}>{saving ? 'Saving…' : 'Confirm receipt'}</button></>}>
          {receiving.lines.map((line) => <Fld key={line.id} id={`received-${line.id}`} label={`${line.sku} (sent ${line.quantitySent})`}><input id={`received-${line.id}`} type="number" min="0" step="0.001" value={received[line.id] ?? ''} onChange={(event) => setReceived({ ...received, [line.id]: event.target.value })} /></Fld>)}
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Enter the quantity physically counted. Any difference remains dated on this transfer.</p>
        </Modal>
      )}
    </>
  )
}
