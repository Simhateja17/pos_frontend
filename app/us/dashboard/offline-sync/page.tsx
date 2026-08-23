/*
 * US edition mirror of app/app/offline-sync/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
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

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const when = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

/** A sale whose server total differed from what the customer was quoted offline. */
function isDivergent(entry: SyncHistoryEntry) {
  return (
    entry.confirmedTotal != null &&
    entry.estimatedTotal != null &&
    Number(entry.confirmedTotal) !== Number(entry.estimatedTotal)
  )
}

export default function OfflineSyncPage() {
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
        ? 'Still offline. Nothing was sent. The queue is intact.'
        : `Synced ${outcome.synced}. ${outcome.dead > 0 ? `${outcome.dead} need attention. ` : ''}${outcome.failed > 0 ? `${outcome.failed} will retry.` : ''}`,
    )
  }

  const pending = queue.filter((e) => e.status !== 'dead')
  const dead = queue.filter((e) => e.status === 'dead')
  const divergent = history.filter(isDivergent)
  const lastSync = history[0]?.at

  const metrics: KpiItem[] = [
    { label: 'Queued', value: String(pending.length), meta: pending.length ? 'Waiting to sync' : 'Nothing waiting' },
    { label: 'Connection', value: isOnline ? 'Online' : 'Offline', meta: checkedAt ? `Checked ${when.format(checkedAt)}` : 'Checking…' },
    { label: 'Needs attention', value: String(dead.length), meta: dead.length ? 'Rejected by the server' : 'None' },
    { label: 'Total mismatches', value: String(divergent.length), meta: divergent.length ? 'Server total differed from the offline quote' : 'None recorded' },
  ]

  if (!supported) {
    return (
      <>
        <PageHead title="Offline & Sync" sub="Queued sales and reconciliation" />
        <Card>
          <CardPad>
            <EmptyState
              icon={<CloudOff size={24} strokeWidth={1.8} />}
              title="Offline storage is unavailable on this device"
              body="This browser blocks local storage (often private-browsing mode), so sales cannot be queued here. Billing requires a live connection on this device."
            />
          </CardPad>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title="Offline & Sync"
        sub={lastSync ? `Last sync ${when.format(new Date(lastSync))}` : 'No sync recorded yet'}
        actions={
          <button className="btn btn-pri" onClick={() => void syncNow()} disabled={isSyncing || pending.length === 0}>
            <RefreshCw size={15} /> {isSyncing ? 'Syncing…' : 'Sync now'}
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
        <CardHead title="Queued sales" sub="Recorded on this device, not yet confirmed by the server" />
        {pending.length === 0 ? (
          <EmptyState title="Nothing queued" body="Sales taken while offline appear here until the server confirms them." />
        ) : (
          <DataTable cols={['Bill', 'Taken', 'Attempts', 'Last issue', 'Quoted', 'Status']} minWidth={780}>
            {pending.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.createdAt))}</td>
                <td className="num">{e.attempts}</td>
                <td className="t-sub">{e.lastError ?? '-'}</td>
                <td className="num t-strong">{inr.format(Number(e.estimatedTotal))}</td>
                <td>
                  <span className={`badge ${e.status === 'sending' ? 'b-blue' : 'b-amber'}`}>
                    {e.status === 'sending' ? 'Sending' : 'Pending'}
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
            title="Needs a decision"
            sub="The server rejected these. They are kept, never discarded automatically."
            right={<span className="badge b-red">{dead.length}</span>}
          />
          <DataTable cols={['Bill', 'Taken', 'Reason', 'Quoted', '']} minWidth={780}>
            {dead.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.createdAt))}</td>
                <td className="t-sub">{e.lastError ?? 'Rejected'}</td>
                <td className="num t-strong">{inr.format(Number(e.estimatedTotal))}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await reviveDead(e.clientSaleId)
                      await refresh()
                    }}
                  >
                    Retry
                  </button>{' '}
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={async () => {
                      const reason = window.prompt(
                        `Discard bill ${e.clientSaleId.slice(0, 8).toUpperCase()} (${inr.format(Number(e.estimatedTotal))})?\n\nThis sale will never reach the server. Give a reason. It is recorded.`,
                      )
                      if (!reason?.trim()) return
                      await discardDead(e.clientSaleId, reason.trim())
                      await refresh()
                    }}
                  >
                    Discard
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
            title="Total mismatches"
            sub="The server's confirmed total differed from the amount quoted offline"
            right={<span className="badge b-amber">{divergent.length}</span>}
          />
          <DataTable cols={['Bill', 'Synced', 'Quoted', 'Confirmed', 'Sale']}>
            {divergent.map((e) => (
              <tr key={e.clientSaleId}>
                <td className="t-mono t-strong">{e.clientSaleId.slice(0, 8).toUpperCase()}</td>
                <td className="t-sub t-mono">{when.format(new Date(e.at))}</td>
                <td className="num">{inr.format(Number(e.estimatedTotal))}</td>
                <td className="num t-strong">{inr.format(Number(e.confirmedTotal))}</td>
                <td>
                  {e.saleId ? (
                    <Link className="btn btn-sm" href={`/app/orders/${encodeURIComponent(e.saleId)}`}>
                      View
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
