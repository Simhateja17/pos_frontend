'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardList, PackageCheck, RefreshCw } from 'lucide-react'
import {
  type ForecastRun,
  type ReorderSuggestion,
  type ReorderSuggestionList,
  createAuthenticatedPurchaseOrder,
  generateAuthenticatedReorderSuggestions,
  getAuthenticatedForecastRun,
  getAuthenticatedLatestForecastRun,
  getAuthenticatedReorderSuggestions,
  startAuthenticatedForecastRun,
} from '@/lib/api/authenticated-client'
import { Card, CardHead, DataTable } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { normalizeReorderReason } from '@/lib/operational-display'

const wholeUnits = (value: number) => Math.max(0, Math.ceil(value))

function stockOnHand(suggestion: ReorderSuggestion) {
  return normalizeReorderReason(suggestion.reason as unknown as Record<string, unknown>).currentStock
}

function quantityExplanation(suggestion: ReorderSuggestion) {
  const reason = suggestion.reason
  const required = wholeUnits(reason.reorderPoint + reason.reviewPeriodDemand)
  return `${stockOnHand(suggestion)} available + ${reason.onOrder} already ordered. About ${required} are needed to cover expected sales and a safety buffer.`
}

function ReasonBreakdown({ suggestion }: { suggestion: ReorderSuggestion }) {
  const reason = suggestion.reason
  const required = wholeUnits(reason.reorderPoint + reason.reviewPeriodDemand)
  const expectedSales = wholeUnits(reason.leadTimeDemand + reason.reviewPeriodDemand)

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 4 }}>
        Why order {suggestion.suggestedQuantity} units?
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12.5, marginBottom: 12 }}>
        Based on recent sales, your current stock may not last until the next stock review.
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Sold in the last {reason.windowDays} days</span>
        <b>{wholeUnits(reason.unitsSoldInWindow)} units</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Expected sales before the next stock review</span>
        <b>{expectedSales} units</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Extra stock to avoid running out</span>
        <b>{wholeUnits(reason.safetyStock)} units</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Total stock needed</span>
        <b>{required} units</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Available now</span>
        <b>{stockOnHand(suggestion)} units</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>Already on the way</span>
        <b>{reason.onOrder} units</b>
      </div>
      <div className="sum-row" style={{ borderTop: '1px solid var(--border)', marginTop: 7, paddingTop: 9, fontSize: 13.5 }}>
        <span style={{ fontWeight: 650 }}>Recommended order</span>
        <b>{suggestion.suggestedQuantity} units</b>
      </div>
      {reason.supplierName ? (
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
          This allows for {reason.leadTimeDays} days of delivery time from {reason.supplierName}.
        </div>
      ) : null}
    </div>
  )
}

export function ReorderSuggestions() {
  const [data, setData] = useState<ReorderSuggestionList | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creatingOrders, setCreatingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeRun, setActiveRun] = useState<ForecastRun | null>(null)
  const pollingRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getAuthenticatedReorderSuggestions())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Recommendations are unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    let mounted = true
    void getAuthenticatedLatestForecastRun()
      .then((run) => {
        if (mounted && run && (run.status === 'queued' || run.status === 'running')) setActiveRun(run)
      })
      .catch(() => undefined)
    return () => {
      mounted = false
      pollingRef.current = false
    }
  }, [load])

  async function refreshRecommendations() {
    if (refreshing) return
    setRefreshing(true)
    setError(null)
    setNotice(null)
    try {
      if (data?.manualForecastEnabled === true) {
        pollingRef.current = true
        const queued = await startAuthenticatedForecastRun()
        let current = queued.run
        setActiveRun(current)
        for (let attempt = 0; attempt < 60 && pollingRef.current; attempt += 1) {
          if (current.status === 'completed' || current.status === 'failed') break
          await new Promise((resolve) => window.setTimeout(resolve, queued.pollAfterMs))
          if (!pollingRef.current) return
          current = await getAuthenticatedForecastRun(current.id)
          setActiveRun(current)
        }
        if (current.status === 'failed') throw new Error('Recommendations could not be updated. Please try again.')
        if (current.status !== 'completed') throw new Error('The update is taking longer than expected. Refresh this page shortly.')
        setActiveRun(null)
        await load()
      } else {
        setData(await generateAuthenticatedReorderSuggestions())
      }
      setSelected(new Set())
      setNotice('Recommendations updated. Review the quantities before creating purchase orders.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Recommendations could not be updated.')
    } finally {
      pollingRef.current = false
      setRefreshing(false)
    }
  }

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  async function createDraftPurchaseOrders() {
    if (!data) return
    const chosen = data.items.filter((suggestion) => selected.has(suggestion.id) && suggestion.supplierId)
    if (chosen.length === 0) return

    const bySupplier = new Map<string, ReorderSuggestion[]>()
    for (const suggestion of chosen) {
      const list = bySupplier.get(suggestion.supplierId!) ?? []
      list.push(suggestion)
      bySupplier.set(suggestion.supplierId!, list)
    }

    setCreatingOrders(true)
    setError(null)
    try {
      const created: string[] = []
      for (const [supplierId, group] of bySupplier) {
        const purchaseOrder = await createAuthenticatedPurchaseOrder({
          supplierId,
          lines: group.map((suggestion) => ({
            variantId: suggestion.variantId,
            quantityOrdered: suggestion.suggestedQuantity,
            unitCost: 0,
          })),
        })
        created.push(purchaseOrder.poNumber)
      }
      setSelected(new Set())
      setNotice(`Created ${created.length} draft purchase order${created.length === 1 ? '' : 's'}: ${created.join(', ')}. Review prices before sending.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The draft purchase orders could not be created.')
    } finally {
      setCreatingOrders(false)
    }
  }

  const items = data?.items ?? []
  const totalUnits = items.reduce((total, item) => total + item.suggestedQuantity, 0)
  const updateInProgress = refreshing || activeRun?.status === 'queued' || activeRun?.status === 'running'
  const updatedAt = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <Card>
      <CardHead
        title="Recommended purchase list"
        sub={updatedAt ? `${items.length} products · ${totalUnits} units to order · updated ${updatedAt}` : 'See what needs ordering and why'}
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selected.size > 0 ? (
              <button className="btn btn-sm btn-pri" onClick={() => void createDraftPurchaseOrders()} disabled={creatingOrders || updateInProgress}>
                <ClipboardList size={14} /> {creatingOrders ? 'Creating…' : `Create draft PO (${selected.size})`}
              </button>
            ) : null}
            <button className="btn btn-sm" onClick={() => void refreshRecommendations()} disabled={creatingOrders || updateInProgress}>
              <RefreshCw size={14} /> {updateInProgress ? 'Updating…' : 'Refresh recommendations'}
            </button>
          </div>
        }
      />

      {updateInProgress ? (
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-soft)', color: 'var(--muted)', fontSize: 12.5 }} role="status">
          Reviewing recent sales, current stock, incoming orders and supplier delivery times…
        </div>
      ) : null}
      {notice ? <div style={{ padding: '11px 16px', fontSize: 13 }} role="status">{notice}</div> : null}
      {loading && <LoadingState label="Loading purchase recommendations" rows={3} />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={24} strokeWidth={1.8} />}
          title={updatedAt ? 'Stock levels look covered' : 'No recommendations yet'}
          body={updatedAt ? 'No purchase is recommended right now. Refresh after new sales, deliveries or stock changes.' : 'Refresh to check recent sales, available stock and incoming orders.'}
          action={<button className="btn btn-pri" onClick={() => void refreshRecommendations()} disabled={updateInProgress}><RefreshCw size={15} /> Refresh recommendations</button>}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <DataTable cols={['', 'Product', 'Available now', 'Already ordered', 'Order now', 'Why this quantity', '']} minWidth={980}>
          {items.map((suggestion) => (
            <Fragment key={suggestion.id}>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${suggestion.productName} for a draft purchase order`}
                    checked={selected.has(suggestion.id)}
                    disabled={!suggestion.supplierId}
                    onChange={() => setSelected((current) => toggle(current, suggestion.id))}
                  />
                </td>
                <td>
                  <div className="t-strong">{suggestion.productName}</div>
                  <div className="t-mono t-sub" style={{ marginTop: 3 }}>{suggestion.sku}</div>
                </td>
                <td className="num">{stockOnHand(suggestion)}</td>
                <td className="num t-sub">{suggestion.reason.onOrder}</td>
                <td className="num t-strong">{suggestion.suggestedQuantity}</td>
                <td style={{ maxWidth: 390, color: 'var(--muted)', fontSize: 12.5 }}>{quantityExplanation(suggestion)}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => setExpanded((current) => toggle(current, suggestion.id))}>
                    {expanded.has(suggestion.id) ? 'Hide details' : 'See why'}
                  </button>
                </td>
              </tr>
              {expanded.has(suggestion.id) ? (
                <tr><td colSpan={7} style={{ padding: '0 14px 12px' }}><ReasonBreakdown suggestion={suggestion} /></td></tr>
              ) : null}
            </Fragment>
          ))}
        </DataTable>
      ) : null}
    </Card>
  )
}
