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
import { type Translate, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

const wholeUnits = (value: number) => Math.max(0, Math.ceil(value))

function stockOnHand(suggestion: ReorderSuggestion) {
  return normalizeReorderReason(suggestion.reason as unknown as Record<string, unknown>).currentStock
}

function quantityExplanation(suggestion: ReorderSuggestion, t: Translate) {
  const reason = suggestion.reason
  const required = wholeUnits(reason.reorderPoint + reason.reviewPeriodDemand)
  return t('demand.explanation', { available: stockOnHand(suggestion), onOrder: reason.onOrder, required })
}

function ReasonBreakdown({ suggestion, t }: { suggestion: ReorderSuggestion; t: Translate }) {
  const reason = suggestion.reason
  const required = wholeUnits(reason.reorderPoint + reason.reviewPeriodDemand)
  const expectedSales = wholeUnits(reason.leadTimeDemand + reason.reviewPeriodDemand)

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 4 }}>
        {t('demand.whyOrder', { count: suggestion.suggestedQuantity })}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12.5, marginBottom: 12 }}>
        {t('demand.basedOnSales')}
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.soldLast', { days: reason.windowDays })}</span>
        <b>{wholeUnits(reason.unitsSoldInWindow)} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.expectedSales')}</span>
        <b>{expectedSales} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.extraStock')}</span>
        <b>{wholeUnits(reason.safetyStock)} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.totalNeeded')}</span>
        <b>{required} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.availableNow')}</span>
        <b>{stockOnHand(suggestion)} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ fontSize: 12.5 }}>
        <span>{t('demand.onWay')}</span>
        <b>{reason.onOrder} {t('demand.units')}</b>
      </div>
      <div className="sum-row" style={{ borderTop: '1px solid var(--border)', marginTop: 7, paddingTop: 9, fontSize: 13.5 }}>
        <span style={{ fontWeight: 650 }}>{t('demand.recommended')}</span>
        <b>{suggestion.suggestedQuantity} {t('demand.units')}</b>
      </div>
      {reason.supplierName ? (
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
          {t('demand.deliveryTime', { days: reason.leadTimeDays, supplier: reason.supplierName })}
        </div>
      ) : null}
    </div>
  )
}

export function ReorderSuggestions() {
  const t = useT()
  const { dateLocale, pack } = useAppRegion()
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
      setError(cause instanceof Error ? cause.message : t('demand.errorLoad'))
    } finally {
      setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch recommendations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (current.status === 'failed') throw new Error(t('demand.errorFailed'))
        if (current.status !== 'completed') throw new Error(t('demand.errorSlow'))
        setActiveRun(null)
        await load()
      } else {
        setData(await generateAuthenticatedReorderSuggestions())
      }
      setSelected(new Set())
      setNotice(t('demand.updated'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('demand.errorUpdate'))
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
      setNotice(created.length === 1
        ? t('demand.createdOne', { numbers: created.join(', ') })
        : t('demand.createdMany', { count: created.length, numbers: created.join(', ') }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('demand.errorCreate'))
    } finally {
      setCreatingOrders(false)
    }
  }

  const items = data?.items ?? []
  const totalUnits = items.reduce((total, item) => total + item.suggestedQuantity, 0)
  const updateInProgress = refreshing || activeRun?.status === 'queued' || activeRun?.status === 'running'
  const updatedAt = data?.generatedAt
    ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone }).format(new Date(data.generatedAt))
    : null

  return (
    <Card>
      <CardHead
        title={t('demand.listTitle')}
        sub={updatedAt ? t('demand.listSub', { products: items.length, units: totalUnits, date: updatedAt }) : t('demand.listSubEmpty')}
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selected.size > 0 ? (
              <button className="btn btn-sm btn-pri" onClick={() => void createDraftPurchaseOrders()} disabled={creatingOrders || updateInProgress}>
                <ClipboardList size={14} /> {creatingOrders ? t('demand.creating') : t('demand.createDraft', { count: selected.size })}
              </button>
            ) : null}
            <button className="btn btn-sm" onClick={() => void refreshRecommendations()} disabled={creatingOrders || updateInProgress}>
              <RefreshCw size={14} /> {updateInProgress ? t('demand.updating') : t('demand.refresh')}
            </button>
          </div>
        }
      />

      {updateInProgress ? (
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-soft)', color: 'var(--muted)', fontSize: 12.5 }} role="status">
          {t('demand.reviewProgress')}
        </div>
      ) : null}
      {notice ? <div style={{ padding: '11px 16px', fontSize: 13 }} role="status">{notice}</div> : null}
      {loading && <LoadingState label={t('demand.loading')} rows={3} />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={24} strokeWidth={1.8} />}
          title={updatedAt ? t('demand.coveredTitle') : t('demand.noneTitle')}
          body={updatedAt ? t('demand.coveredBody') : t('demand.noneBody')}
          action={<button className="btn btn-pri" onClick={() => void refreshRecommendations()} disabled={updateInProgress}><RefreshCw size={15} /> {t('demand.refresh')}</button>}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <DataTable cols={[t('demand.cols.select'), t('demand.cols.product'), t('demand.cols.available'), t('demand.cols.ordered'), t('demand.cols.orderNow'), t('demand.cols.why'), t('demand.cols.details')]} minWidth={980}>
          {items.map((suggestion) => (
            <Fragment key={suggestion.id}>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    aria-label={t('demand.selectForPo', { name: suggestion.productName })}
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
                <td style={{ maxWidth: 390, color: 'var(--muted)', fontSize: 12.5 }}>{quantityExplanation(suggestion, t)}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => setExpanded((current) => toggle(current, suggestion.id))}>
                    {expanded.has(suggestion.id) ? t('demand.hideDetails') : t('demand.seeWhy')}
                  </button>
                </td>
              </tr>
              {expanded.has(suggestion.id) ? (
                <tr><td colSpan={7} style={{ padding: '0 14px 12px' }}><ReasonBreakdown suggestion={suggestion} t={t} /></td></tr>
              ) : null}
            </Fragment>
          ))}
        </DataTable>
      ) : null}
    </Card>
  )
}
