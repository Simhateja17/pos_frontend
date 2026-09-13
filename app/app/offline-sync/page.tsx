'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CloudOff, RefreshCw } from 'lucide-react'
import { Card, CardHead, CardPad, DataTable, KpiRow, PageHead, type KpiItem } from '@/components/couture/ui'
import { EmptyState } from '@/components/couture/states'
import { useConnectivity } from '@/lib/offline/connectivity'
import {
  discardDead,
  listQueue,
  readHistory,
  reviveDead,
  type QueuedSale,
  type SyncHistoryEntry,
} from '@/lib/offline/queue'
import { drainQueue } from '@/lib/offline/sync'
import { MessageKey, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

/** A sale whose server total differed from what the customer was quoted offline. */
function isDivergent(entry: SyncHistoryEntry) {
  return (
    entry.confirmedTotal != null &&
    entry.estimatedTotal != null &&
    Number(entry.confirmedTotal) !== Number(entry.estimatedTotal)
  )
}

export default function OfflineSyncPage() {
  const t = useT()
  const { money, dateLocale, pack, appPath } = useAppRegion()
  const when = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone })
  const { isOnline, checkedAt } = useConnectivity()
  const [queue, setQueue] = useState<QueuedSale[]>([])
  const [history, setHistory] = useState<SyncHistoryEntry[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setQueue(await listQueue())
      setHistory(readHistory())
    } catch {
      setSupported(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 5_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function syncNow() {
    setIsSyncing(true)
    setNote(null)
    const outcome = await drainQueue()
    setIsSyncing(false)
    await refresh()
    setNote(
      outcome.stoppedBecauseOffline
        ? t('offline.stillOffline')
        : t('offline.syncSummary', {
            synced: outcome.synced,
            attention: outcome.dead > 0 ? t(outcome.dead === 1 ? 'offline.attentionOne' : 'offline.attentionMany', { count: outcome.dead }) : '',
            retry: outcome.failed > 0 ? t(outcome.failed === 1 ? 'offline.retryOne' : 'offline.retryMany', { count: outcome.failed }) : '',
          }),
    )
  }

  const pending = queue.filter((e) => e.status !== 'dead')
  const dead = queue.filter((e) => e.status === 'dead')
  const divergent = history.filter(isDivergent)
  const lastSync = history[0]?.at

  const metrics: KpiItem[] = [
    { label: t('offline.queued'), value: String(pending.length), meta: pending.length ? t('offline.waitingToSync') : t('offline.nothingWaiting') },
    { label: t('offline.connection'), value: isOnline ? t('offline.online') : t('offline.offline'), meta: checkedAt ? t('offline.checked', { date: when.format(checkedAt) }) : t('offline.checking') },
    { label: t('offline.needsAttention'), value: String(dead.length), meta: dead.length ? t('offline.rejectedByServer') : t('offline.none') },
    { label: t('offline.totalMismatches'), value: String(divergent.length), meta: divergent.length ? t('offline.serverDiffered') : t('offline.noneRecorded') },
  ]

  if (!supported) {
    return (
      <>
        <PageHead title={t('offline.title')} sub={t('offline.subtitle')} />
        <Card>
          <CardPad>
            <EmptyState
              icon={<CloudOff size={24} strokeWidth={1.8} />}
              title={t('offline.storageUnavailable')}
              body={t('offline.storageBody')}
            />
          </CardPad>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={t('offline.title')}
        sub={lastSync ? t('offline.lastSync', { date: when.format(new Date(lastSync)) }) : t('offline.noSync')}
        actions={
          <button className="btn btn-pri" onClick={() => void syncNow()} disabled={isSyncing || pending.length === 0}>
            <RefreshCw size={15} /> {isSyncing ? t('offline.syncing') : t('offline.syncNow')}
          </button>
        }
      />

      <KpiRow items={metrics} cols={4} />

      {note && (
        <Card>
          <CardPad style={{ fontSize: 13, color: 'var(--muted)' }}>{note}</CardPad>
        </Card>
      )}

      <Card>
        <CardHead title={t('offline.queuedSales')} sub={t('offline.queuedSalesSub')} />
        {pending.length === 0 ? (
          <EmptyState title={t('offline.nothingQueued')} body={t('offline.nothingQueuedBody')} />
        ) : (
          <DataTable cols={[t('offline.table.bill'), t('offline.table.taken'), t('offline.table.attempts'), t('offline.table.lastIssue'), t('offline.table.quoted'), t('offline.table.status')]} minWidth={780}>
            {pending.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.createdAt))}</td>
                <td className="num">{e.attempts}</td>
                <td className="t-sub">{e.lastError ?? '-'}</td>
                <td className="num t-strong">{money(Number(e.estimatedTotal))}</td>
                <td>
                  <span className={`badge ${e.status === 'sending' ? 'b-blue' : 'b-amber'}`}>
                    {t(`offline.status.${e.status}` as MessageKey)}
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {dead.length > 0 && (
        <Card style={{ borderColor: '#F6D4D4' }}>
          <CardHead
            title={t('offline.needsDecision')}
            sub={t('offline.needsDecisionSub')}
            right={<span className="badge b-red">{dead.length}</span>}
          />
          <DataTable cols={[t('offline.table.bill'), t('offline.table.taken'), t('offline.table.reason'), t('offline.table.quoted'), '']} minWidth={780}>
            {dead.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.createdAt))}</td>
                <td className="t-sub">{e.lastError ?? t('offline.rejected')}</td>
                <td className="num t-strong">{money(Number(e.estimatedTotal))}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await reviveDead(e.clientSaleId)
                      await refresh()
                    }}
                  >
                    {t('offline.retry')}
                  </button>{' '}
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={async () => {
                      const reason = window.prompt(t('offline.discardPrompt', { bill: e.clientSaleId.slice(0, 8).toUpperCase(), amount: money(Number(e.estimatedTotal)) }))
                      if (!reason?.trim()) return
                      await discardDead(e.clientSaleId, reason.trim())
                      await refresh()
                    }}
                  >
                    {t('offline.discard')}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {divergent.length > 0 && (
        <Card>
          <CardHead
            title={t('offline.mismatchTitle')}
            sub={t('offline.mismatchSub')}
            right={<span className="badge b-amber">{divergent.length}</span>}
          />
          <DataTable cols={[t('offline.table.bill'), t('offline.table.synced'), t('offline.table.quoted'), t('offline.table.confirmed'), t('offline.table.sale')]}>
            {divergent.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.at))}</td>
                <td className="num">{money(Number(e.estimatedTotal))}</td>
                <td className="num t-strong">{money(Number(e.confirmedTotal))}</td>
                <td>
                  {e.saleId ? (
                    <Link className="btn btn-sm" href={appPath(`/app/orders/${encodeURIComponent(e.saleId)}`)}>
                      {t('offline.view')}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}
    </>
  )
}
