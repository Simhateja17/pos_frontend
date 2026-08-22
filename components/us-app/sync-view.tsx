'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CloudOff, RefreshCw, RotateCcw } from 'lucide-react'
import { useConnectivity } from '@/lib/offline/connectivity'
import { discardDead, listQueue, readHistory, reviveDead, type QueuedSale, type SyncHistoryEntry } from '@/lib/offline/queue'
import { drainQueue, type SyncOutcome } from '@/lib/offline/sync'
import { isOutboxSupported } from '@/lib/offline/db'
import { UsCard, UsCardBody, UsCardHeader, UsEmptyState, UsErrorState, UsKpiGrid, UsLoadingState, UsPageHead, UsTable } from './states'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const when = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

function divergent(entry: SyncHistoryEntry) { return entry.confirmedTotal != null && entry.estimatedTotal != null && Number(entry.confirmedTotal) !== Number(entry.estimatedTotal) }

export function UsSyncView() {
  const { isOnline, checkedAt } = useConnectivity()
  const [queue, setQueue] = useState<QueuedSale[]>([])
  const [history, setHistory] = useState<SyncHistoryEntry[]>([])
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isOutboxSupported()) {
      setSupported(false)
      setLoading(false)
      return
    }
    try {
      setQueue(await listQueue())
      setHistory(readHistory())
      setError(null)
    } catch (nextError) {
      setSupported(false)
      setError(nextError instanceof Error ? nextError.message : 'Offline storage is unavailable on this device.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 5_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function syncNow() {
    setSyncing(true)
    setNotice(null)
    const outcome: SyncOutcome = await drainQueue()
    setSyncing(false)
    await refresh()
    setNotice(outcome.stoppedBecauseOffline ? 'Still offline. Nothing was sent; the queue is intact.' : `Synced ${outcome.synced}. ${outcome.dead} need attention. ${outcome.failed} will retry.`)
  }

  const pending = queue.filter((entry) => entry.status !== 'dead')
  const dead = queue.filter((entry) => entry.status === 'dead')
  const mismatches = history.filter(divergent)
  const lastSync = history[0]?.at

  if (loading) return <><UsPageHead title="Offline Sync" sub="Real device queue and reconciliation history" /><UsLoadingState label="Loading offline queue" rows={7} /></>
  if (!supported) return <><UsPageHead title="Offline Sync" sub="Real device queue and reconciliation history" /><UsCard><UsEmptyState icon={<CloudOff size={24} />} title="Offline storage is unavailable on this device" body="This browser does not expose IndexedDB, so sales cannot be queued here. Billing requires a live connection on this device." /></UsCard></>

  return (
    <>
      <UsPageHead title="Offline Sync" sub={lastSync ? `Last completed sync ${when.format(new Date(lastSync))}` : 'No completed sync recorded yet'} actions={<button className="btn btn-primary" type="button" onClick={() => void syncNow()} disabled={syncing || pending.length === 0}><RefreshCw size={14} />{syncing ? 'Syncing…' : 'Sync now'}</button>} />
      {error ? <div className="notice error" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className="notice success" role="status" style={{ marginBottom: 14 }}>{notice}</div> : null}
      <UsKpiGrid items={[{ label: 'Queued', value: pending.length, meta: pending.length ? 'Waiting to sync' : 'Nothing waiting' }, { label: 'Connection', value: isOnline ? 'Online' : 'Offline', meta: checkedAt ? `Checked ${when.format(checkedAt)}` : 'Checking…' }, { label: 'Needs attention', value: dead.length, meta: dead.length ? 'Rejected by the server' : 'None' }, { label: 'Total mismatches', value: mismatches.length, meta: mismatches.length ? 'Confirmed total differed from quote' : 'None recorded' }]} />
      <UsCard>
        <UsCardHeader title="Queued sales" sub="Exact POST /sales payloads retained until the server confirms them" />
        {pending.length === 0 ? <UsEmptyState title="Nothing queued" body="Sales taken while offline appear here until the server confirms them." /> : <UsTable columns={['Bill', 'Taken', 'Attempts', 'Last issue', 'Quoted', 'Status']} minWidth={780}>{pending.map((entry) => <tr key={entry.clientSaleId}><td className="num"><b>{entry.clientSaleId.slice(0, 8).toUpperCase()}</b></td><td>{when.format(new Date(entry.createdAt))}</td><td className="num">{entry.attempts}</td><td className="muted">{entry.lastError || '—'}</td><td className="num"><b>{usd.format(Number(entry.estimatedTotal))}</b></td><td><span className={`badge ${entry.status === 'sending' ? 'b-blue' : 'b-amber'}`}>{entry.status === 'sending' ? 'Sending' : 'Pending'}</span></td></tr>)}</UsTable>}
      </UsCard>

      {dead.length > 0 ? <UsCard style={{ marginTop: 14 }}><UsCardHeader title="Needs a decision" sub="Rejected sales are retained and never discarded automatically" right={<span className="badge b-red">{dead.length}</span>} /><UsTable columns={['Bill', 'Taken', 'Reason', 'Quoted', '']} minWidth={780}>{dead.map((entry) => <tr key={entry.clientSaleId}><td className="num"><b>{entry.clientSaleId.slice(0, 8).toUpperCase()}</b></td><td>{when.format(new Date(entry.createdAt))}</td><td className="muted">{entry.lastError || 'Rejected by server'}</td><td className="num">{usd.format(Number(entry.estimatedTotal))}</td><td><button className="btn btn-sm" type="button" onClick={async () => { await reviveDead(entry.clientSaleId); await refresh() }}><RotateCcw size={12} />Retry</button>{' '}<button className="btn btn-sm" type="button" onClick={async () => { const reason = window.prompt(`Discard bill ${entry.clientSaleId.slice(0, 8).toUpperCase()}? Give a reason.`); if (reason?.trim()) { await discardDead(entry.clientSaleId, reason.trim()); await refresh() } }}>Discard</button></td></tr>)}</UsTable></UsCard> : null}

      {mismatches.length > 0 ? <UsCard style={{ marginTop: 14 }}><UsCardHeader title="Total mismatches" sub="The server's confirmed total differed from the offline quote" /><UsTable columns={['Bill', 'Synced', 'Quoted', 'Confirmed', 'Sale']} minWidth={680}>{mismatches.map((entry) => <tr key={entry.clientSaleId}><td className="num"><b>{entry.clientSaleId.slice(0, 8).toUpperCase()}</b></td><td>{when.format(new Date(entry.at))}</td><td className="num">{usd.format(Number(entry.estimatedTotal))}</td><td className="num"><b>{usd.format(Number(entry.confirmedTotal))}</b></td><td>{entry.saleId ? <Link className="btn btn-sm" href={`/us/dashboard/orders?search=${encodeURIComponent(entry.saleId)}`}>View order</Link> : 'Discarded'}</td></tr>)}</UsTable></UsCard> : null}

      {history.length > 0 ? <UsCard style={{ marginTop: 14 }}><UsCardHeader title="Sync history" sub="Device-local history retained for reconciliation" /><UsCardBody><div className="item-list">{history.slice(0, 8).map((entry) => <div className="item-row" key={`${entry.clientSaleId}-${entry.at}`}><div className="item-icon"><CheckMark /></div><div className="item-body"><b>{entry.saleId ? 'Sale confirmed' : 'Sale discarded'}</b><small>{when.format(new Date(entry.at))} · {entry.clientSaleId.slice(0, 8).toUpperCase()}</small></div><span className="num">{entry.confirmedTotal ? usd.format(Number(entry.confirmedTotal)) : entry.discardedReason || '—'}</span></div>)}</div></UsCardBody></UsCard> : null}
    </>
  )
}

function CheckMark() { return <span aria-hidden="true">✓</span> }
