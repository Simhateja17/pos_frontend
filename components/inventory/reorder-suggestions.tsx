'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { ClipboardList, RefreshCw, Sparkle } from 'lucide-react'
import {
  type ReorderSkipped,
  type ReorderSuggestion,
  type ReorderSuggestionList,
  createAuthenticatedPurchaseOrder,
  generateAuthenticatedReorderSuggestions,
  getAuthenticatedReorderSuggestions,
} from '@/lib/api/authenticated-client'
import { Badge, type BadgeTone, Card, CardHead, DataTable } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'

const CONFIDENCE_TONE: Record<string, BadgeTone> = { low: 'grey', medium: 'amber', high: 'green' }

/**
 * ML-01 forbids calling this AI. It is a velocity multiplication, and the
 * label says exactly that. Phase 6 writes method='forecast' rows through this
 * same component, which is why the label is derived from the data rather than
 * hardcoded.
 */
const METHOD_LABEL: Record<string, string> = {
  heuristic: 'Rule-based suggestion',
  forecast: 'Forecast',
}

const METHOD_TONE: Record<string, BadgeTone> = { heuristic: 'grey', forecast: 'green' }

const SKIPPED_LABEL: Record<ReorderSkipped['kind'], string> = {
  insufficient_history: 'Not enough sales history yet',
  no_velocity: 'No sales in the last 30 days',
  sufficient_stock: 'Stock and open orders already cover expected demand',
  no_supplier: 'No supplier on file to order from',
}

const num = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

/**
 * The "why", expanded from the stored reason JSON: not hidden behind a
 * tooltip (ML-03). Every line here is a field the server persisted, so the
 * arithmetic on screen is the arithmetic that produced the number.
 */
function ReasonBreakdown({ suggestion }: { suggestion: ReorderSuggestion }) {
  const r = suggestion.reason
  const rows: [string, string][] = [
    [`Sold in the last ${r.windowDays} days`, `${r.unitsSoldInWindow} units`],
    ...(r.returnsInWindow > 0
      ? ([[`Less returns`, `−${r.returnsInWindow} units`]] as [string, string][])
      : []),
    [`Net demand over ${r.historyDays} days of history`, `${r.netUnitsInWindow} units`],
    ['Sales rate', `${num(r.dailyVelocity)} per day`],
    [`Cover for the ${r.leadTimeDays}-day supplier lead time`, `${num(r.leadTimeDemand)} units`],
    [`Safety buffer (${r.safetyDays} days)`, `${num(r.safetyStock)} units`],
    [`Cover until the next reorder (${r.reviewPeriodDays} days)`, `${num(r.reviewPeriodDemand)} units`],
    ['Needed in total', `${num(r.reorderPoint + r.reviewPeriodDemand)} units`],
    ['Less stock on hand', `−${r.currentStock} units`],
    ['Less already on order', `−${r.onOrder} units`],
  ]

  return (
    <div style={{ padding: '11px 14px 14px', background: 'var(--bg)', borderRadius: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
        How this number was worked out
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="sum-row" style={{ fontSize: 12.5 }}>
          <span>{label}</span>
          <b className="num">{value}</b>
        </div>
      ))}
      <div
        className="sum-row"
        style={{ fontSize: 13, borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 8 }}
      >
        <span style={{ fontWeight: 600 }}>Order</span>
        <b className="num">{suggestion.suggestedQuantity} units</b>
      </div>
      {r.supplierName ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 9 }}>
          Lead time from {r.supplierName}. Change it on the Suppliers screen and this number changes with it.
        </div>
      ) : null}
    </div>
  )
}

export function ReorderSuggestions() {
  const [data, setData] = useState<ReorderSuggestionList | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getAuthenticatedReorderSuggestions())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reorder suggestions are unavailable right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function recalculate() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const next = await generateAuthenticatedReorderSuggestions()
      setData(next)
      setSelected(new Set())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reorder suggestions could not be recalculated.')
    } finally {
      setBusy(false)
    }
  }

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  /**
   * Accepted suggestions become a DRAFT purchase order, never a sent one:
   * the owner still decides what actually goes to the supplier. One PO per
   * supplier, since a purchase order is addressed to a single vendor.
   */
  async function createDraftPurchaseOrders() {
    if (!data) return
    const chosen = data.items.filter((s) => selected.has(s.id) && s.supplierId)
    if (chosen.length === 0) return

    const bySupplier = new Map<string, ReorderSuggestion[]>()
    for (const suggestion of chosen) {
      const list = bySupplier.get(suggestion.supplierId!) ?? []
      list.push(suggestion)
      bySupplier.set(suggestion.supplierId!, list)
    }

    setBusy(true)
    setError(null)
    try {
      const created: string[] = []
      for (const [supplierId, group] of bySupplier) {
        const po = await createAuthenticatedPurchaseOrder({
          supplierId,
          lines: group.map((s) => ({
            variantId: s.variantId,
            quantityOrdered: s.suggestedQuantity,
            // Cost is left at zero here deliberately: the ordered price is not
            // known from a sales-velocity calculation. It is captured for real
            // at goods receipt, which is what sets the cost basis.
            unitCost: 0,
          })),
        })
        created.push(po.poNumber)
      }
      setSelected(new Set())
      setNotice(
        `Created ${created.length} draft purchase order${created.length === 1 ? '' : 's'}: ${created.join(', ')}. ` +
          'Review the unit costs on the Purchases screen, then mark it sent.',
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Those draft purchase orders could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const items = data?.items ?? []
  const skipped = data?.skipped ?? []

  return (
    <Card>
      <CardHead
        title="Reorder suggestions"
        sub={
          data?.generatedAt
            ? `Rule-based · worked out ${new Date(data.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'Rule-based, sales rate multiplied by supplier lead time'
        }
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.size > 0 && (
              <button className="btn btn-sm btn-pri" onClick={() => void createDraftPurchaseOrders()} disabled={busy}>
                <ClipboardList size={14} /> Create draft PO ({selected.size})
              </button>
            )}
            <button className="btn btn-sm" onClick={() => void recalculate()} disabled={busy}>
              <RefreshCw size={14} /> {busy ? 'Working…' : 'Recalculate'}
            </button>
          </div>
        }
      />

      {notice && (
        <div style={{ padding: '11px 16px', fontSize: 13, color: 'var(--ink-2)' }} role="status">
          {notice}
        </div>
      )}

      {loading && <LoadingState label="Loading reorder suggestions" rows={3} />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<Sparkle size={24} strokeWidth={1.8} />}
          title={data?.generatedAt ? 'Nothing needs reordering right now' : 'No suggestions worked out yet'}
          body={
            data?.generatedAt
              ? 'Every item either has enough stock and orders in transit to cover expected demand, or does not have enough sales history to judge.'
              : 'Suggestions are worked out from your sales rate and each supplier’s lead time. Recalculate to produce them.'
          }
          action={
            <button className="btn btn-pri" onClick={() => void recalculate()} disabled={busy}>
              <RefreshCw size={15} /> {busy ? 'Working…' : 'Recalculate'}
            </button>
          }
        />
      )}

      {!loading && !error && items.length > 0 && (
        <DataTable
          cols={[
            '',
            'SKU',
            'Product',
            'In stock',
            'On order',
            'Suggested',
            'Basis',
            '',
          ]}
          minWidth={980}
        >
          {items.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${s.sku} for a draft purchase order`}
                    checked={selected.has(s.id)}
                    onChange={() => setSelected((prev) => toggle(prev, s.id))}
                  />
                </td>
                <td className="t-mono t-strong">{s.sku}</td>
                <td>{s.productName}</td>
                <td className="num">
                  {s.reason.currentStock}
                </td>
                <td className="num t-sub">
                  {s.reason.onOrder}
                </td>
                <td className="num t-strong">
                  {s.suggestedQuantity}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge tone={METHOD_TONE[s.method] ?? 'blue'}>{s.method === 'forecast' ? '✦ Forecast' : METHOD_LABEL[s.method] ?? s.method}</Badge>
                    <Badge tone={CONFIDENCE_TONE[s.confidence] ?? 'grey'}>
                      {s.confidence} confidence
                    </Badge>
                  </div>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => setExpanded((prev) => toggle(prev, s.id))}>
                    {expanded.has(s.id) ? 'Hide why' : 'Why?'}
                  </button>
                </td>
              </tr>
              {expanded.has(s.id) && (
                <tr>
                  <td colSpan={8} style={{ padding: '0 14px 12px' }}>
                    <ReasonBreakdown suggestion={s} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </DataTable>
      )}

      {!loading && !error && skipped.length > 0 && (
        <div style={{ padding: '13px 16px', borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 7 }}>
            Considered but not suggested ({skipped.length})
          </div>
          {skipped.slice(0, 8).map((item) => (
            <div key={item.variantId} className="sum-row" style={{ fontSize: 12.5 }}>
              <span>
                <span className="t-mono">{item.sku}</span> · {item.productName}
              </span>
              <span style={{ color: 'var(--muted)' }}>
                {SKIPPED_LABEL[item.kind]}
                {item.kind === 'insufficient_history' && item.historyDays !== null
                  ? ` (${item.historyDays} day${item.historyDays === 1 ? '' : 's'} so far)`
                  : ''}
              </span>
            </div>
          ))}
          {skipped.length > 8 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              …and {skipped.length - 8} more.
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
