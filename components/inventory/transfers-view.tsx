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
import { Badge, Card, CardHead, DataTable, Fld, Modal, PageHead, SearchField } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { useT, enumLabel } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

export function TransfersView() {
  const t = useT()
  const { dateLocale } = useAppRegion()
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [search, setSearch] = useState('')
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
      setError(cause instanceof Error ? cause.message : t('inventory.errors.transferLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch transfers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(`${t('inventory.errors.transferStore')} ${t('inventory.errors.transferQuantity')}`)
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
      setError(cause instanceof Error ? cause.message : t('inventory.errors.transferCreate'))
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
      setError(t('inventory.errors.transferQuantity'))
      return
    }
    setSaving(true)
    try {
      await receiveAuthenticatedTransfer(receiving.id, { clientReceiveId: crypto.randomUUID(), lines })
      setReceiving(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('inventory.errors.transferReceive'))
    } finally {
      setSaving(false)
    }
  }

  const term = search.trim().toLowerCase()
  const visible = transfers.filter((transfer) =>
    term
      ? [transfer.fromStoreName, transfer.toStoreName, transfer.status, ...transfer.lines.map((line) => line.sku)].some(
          (field) => (field ?? '').toLowerCase().includes(term),
        )
      : true,
  )

  return (
    <>
      <PageHead
        title={t('inventory.transfers.title')}
        sub={t('inventory.transfers.subtitle')}
        actions={<button className="btn btn-pri" onClick={() => setCreateOpen(true)}><Plus size={15} /> {t('inventory.transfers.sendStock')}</button>}
      />
      <Card>
        <CardHead
          title={t('inventory.transfers.title')}
          sub={term ? `${visible.length} ${t('inventory.transfers.transferMany')}` : `${transfers.length} ${transfers.length === 1 ? t('inventory.transfers.transferOne') : t('inventory.transfers.transferMany')}`}
          right={transfers.length > 0 ? <SearchField value={search} onChange={setSearch} placeholder={t('inventory.transfers.searchPlaceholder')} ariaLabel={t('inventory.transfers.searchLabel')} width={250} /> : undefined}
        />
        {loading && <LoadingState label={t('inventory.transfers.loading')} />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && transfers.length === 0 && <EmptyState title={t('inventory.transfers.emptyTitle')} body={t('inventory.transfers.emptyBody')} />}
        {!loading && !error && transfers.length > 0 && visible.length === 0 && <EmptyState title={t('inventory.transfers.noMatchTitle')} body={t('inventory.transfers.noMatchBody')} />}
        {!loading && visible.length > 0 && (
          <DataTable cols={[`${t('inventory.transfers.cols.from')} / ${t('inventory.transfers.cols.to')}`, t('inventory.transfers.cols.sent'), t('inventory.transfers.cols.status'), t('inventory.transfers.cols.quantities'), t('inventory.transfers.cols.actions')]} minWidth={760}>
            {visible.map((transfer) => (
              <tr key={transfer.id}>
                <td className="t-strong">{transfer.fromStoreName} <ArrowRight size={13} style={{ verticalAlign: 'middle' }} /> {transfer.toStoreName}</td>
                <td>{new Date(transfer.sentAt).toLocaleString(dateLocale)}</td>
                <td><Badge tone={transfer.status === 'received' ? 'green' : 'amber'}>{enumLabel(t, 'status', transfer.status)}</Badge></td>
                <td>{transfer.lines.map((line) => `${line.sku}: ${line.quantitySent}${line.quantityReceived === null ? '' : ` → ${line.quantityReceived}`}`).join(', ')}</td>
                <td>
                  {transfer.status === 'sent' && transfer.toStoreId === activeStoreId ? <button className="btn btn-sm" onClick={() => openReceive(transfer)}>{t('inventory.transfers.receive')}</button> : null}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {createOpen && (
        <Modal title={t('inventory.transfers.sendTitle')} onClose={() => setCreateOpen(false)} footer={<><button className="btn" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</button><button className="btn btn-pri" onClick={send} disabled={saving}>{saving ? t('inventory.transfers.sending') : t('inventory.transfers.confirmSend')}</button></>}>
          <form onSubmit={send}>
            <Fld id="transfer-store" label={t('inventory.transfers.destination')}><select id="transfer-store" value={destination} onChange={(event) => setDestination(event.target.value)}><option value="">{t('inventory.transfers.chooseStore')}</option>{destinations.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></Fld>
            <Fld id="transfer-variant" label={t('inventory.transfers.itemsOne')}><select id="transfer-variant" value={variantId} onChange={(event) => setVariantId(event.target.value)}><option value="">{t('inventory.transfers.skuPlaceholder')}</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.sku} · {variant.currentStock} {t('inventory.transfers.itemsMany')}</option>)}</select></Fld>
            <Fld id="transfer-quantity" label={t('inventory.transfers.quantity')}><input id="transfer-quantity" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={t('inventory.transfers.quantityPlaceholder')} /></Fld>
          </form>
        </Modal>
      )}

      {receiving && (
        <Modal title={t('inventory.transfers.receiveTitle', { store: receiving.fromStoreName })} onClose={() => setReceiving(null)} footer={<><button className="btn" onClick={() => setReceiving(null)}>{t('common.cancel')}</button><button className="btn btn-pri" onClick={() => void confirmReceive()} disabled={saving}>{saving ? t('inventory.transfers.saving') : t('inventory.transfers.confirmReceipt')}</button></>}>
          {receiving.lines.map((line) => <Fld key={line.id} id={`received-${line.id}`} label={`${line.sku} (${t('inventory.transfers.cols.sent')} ${line.quantitySent})`}><input id={`received-${line.id}`} type="number" min="0" step="0.001" value={received[line.id] ?? ''} onChange={(event) => setReceived({ ...received, [line.id]: event.target.value })} placeholder={t('inventory.transfers.receivedQuantityPlaceholder')} /></Fld>)}
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t('inventory.transfers.receiveBody')}</p>
        </Modal>
      )}
    </>
  )
}
