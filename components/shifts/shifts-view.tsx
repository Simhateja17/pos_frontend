'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { History, Monitor, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import {
  Badge,
  Card,
  CardHead,
  CardPad,
  DataTable,
  Fld,
  KpiRow,
  Modal,
  PageHead,
  Split2,
  type KpiItem,
} from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { ReconciliationFigure } from '@/components/shifts/reconciliation-figure'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedAppContext } from '@/lib/api/authenticated-client'

type XReport = {
  shiftId: string
  expectedCash: string
  cashSalesTotal: string
  cardSalesTotal: string
  checkSalesTotal: string
  refundsTotal: string
  saleCount: number
}
type ZReport = XReport & { countedCash: string; variance: string; closedAt: string }

type Terminal = { id: string; name: string; isActive: boolean; hasOpenShift: boolean }

type ShiftHistoryEntry = {
  id: string
  staffId: string
  terminalId: string | null
  startingCash: string
  openedAt: string
  countedCash: string | null
  variance: string | null
  closedAt: string | null
  staffName: string | null
  terminalName: string | null
}
const LOAD_ERROR = "We couldn't load this shift. Check your connection and try again."
const money = (value: string) => `₹${Number(value).toFixed(2)}`
const stamp = (value: string) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export function ShiftsView() {
  /**
   * Which shift is "mine" is derived from the server, not cached in
   * localStorage. The old version keyed it to a single browser-wide value, so
   * on a shared till a PIN-switch left the next cashier looking at the
   * previous one's shift. Matching my acting staff id against the open shifts
   * is correct for both hardware modes: a shared till (identity changes, same
   * browser) and separate devices (same identity, different browsers).
   */
  const [staffId, setStaffId] = useState<string | null>(null)
  const [cashier, setCashier] = useState('Current operator')

  const [shifts, setShifts] = useState<ShiftHistoryEntry[]>([])
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [report, setReport] = useState<XReport | null>(null)
  const [closed, setClosed] = useState<ZReport | null>(null)

  const [startingCash, setStartingCash] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [countedCash, setCountedCash] = useState('')

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)

  const activeShift = staffId
    ? shifts.find((s) => s.closedAt === null && s.staffId === staffId) ?? null
    : null

  const loadXReport = useCallback(async (id: string) => {
    const result = await apiClient.GET('/shifts/{shiftId}/x-report', {
      params: { path: { shiftId: id } },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setReport(result.data)
  }, [])

  const load = useCallback(async () => {
    setError(null)
    const headers = await authHeaders()

    const [shiftsResult, terminalsResult] = await Promise.all([
      apiClient.GET('/shifts', { headers }),
      apiClient.GET('/terminals', { headers }),
    ])

    if (shiftsResult.error || !shiftsResult.data || terminalsResult.error || !terminalsResult.data) {
      setLoading(false)
      setError(LOAD_ERROR)
      return
    }

    setShifts(shiftsResult.data as ShiftHistoryEntry[])
    setTerminals(terminalsResult.data as Terminal[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void getAuthenticatedAppContext()
      .then((context) => {
        setStaffId(context.staff.id)
        if (context.staff.name) setCashier(context.staff.name)
      })
      .catch(() => {
        // The shell already surfaces a context failure; this screen still
        // renders its history rather than blocking on identity.
      })
    void load()
  }, [load])

  // Once identity and the shift list agree on an active shift, fetch its live
  // figures. Re-runs when the acting cashier changes on a shared till.
  useEffect(() => {
    if (activeShift && report?.shiftId !== activeShift.id) void loadXReport(activeShift.id)
    if (!activeShift) setReport(null)
  }, [activeShift, report?.shiftId, loadXReport])

  async function openShift(event: FormEvent) {
    event.preventDefault()
    if (!startingCash || Number(startingCash) < 0 || !terminalId) return

    setBusy(true)
    setOpenError(null)
    const result = await apiClient.POST('/shifts', {
      body: { startingCash: Number(startingCash).toFixed(2), terminalId },
      headers: await authHeaders(),
    })
    setBusy(false)

    if (result.error || !result.data) {
      // The backend names the counter and who holds it — show that, not a
      // generic failure, since the fix is "pick another counter".
      setOpenError((result.error as { error?: string } | undefined)?.error ?? LOAD_ERROR)
      return
    }

    setClosed(null)
    setStartingCash('')
    setTerminalId('')
    await load()
  }

  async function closeShift() {
    if (!activeShift || !countedCash || Number(countedCash) < 0) return

    setBusy(true)
    setError(null)
    const result = await apiClient.POST('/shifts/{shiftId}/close', {
      params: { path: { shiftId: activeShift.id } },
      body: { countedCash: Number(countedCash).toFixed(2) },
      headers: await authHeaders(),
    })
    setBusy(false)

    if (result.error || !result.data) {
      setError((result.error as { error?: string } | undefined)?.error ?? LOAD_ERROR)
      return
    }

    setClosed(result.data)
    setCloseOpen(false)
    setCountedCash('')
    await load()
  }

  const openShifts = shifts.filter((s) => s.closedAt === null)
  const variance = report ? Number(countedCash || 0) - Number(report.expectedCash) : 0

  return (
    <>
      <PageHead
        title="Register & Shifts"
        sub={`${cashier} · cash and sales come from the active shift report`}
        actions={
          activeShift ? (
            <button className="btn" disabled={busy} onClick={() => void loadXReport(activeShift.id)}>
              <RefreshCw size={15} /> Refresh X report
            </button>
          ) : null
        }
      />

      {error && (
        <Card>
          <ErrorState message={error} onRetry={() => void load()} />
        </Card>
      )}

      {loading && (
        <Card>
          <LoadingState label="Loading register" rows={4} />
        </Card>
      )}

      {!loading && (
        <>
          {closed && !activeShift && <ClosedSummary report={closed} />}

          {activeShift ? (
            <ActiveShift
              shift={activeShift}
              report={report}
              countedCash={countedCash}
              onCountedCash={setCountedCash}
              onRequestClose={() => setCloseOpen(true)}
              busy={busy}
            />
          ) : (
            <OpenRegister
              cashier={cashier}
              terminals={terminals}
              terminalId={terminalId}
              onTerminalId={setTerminalId}
              startingCash={startingCash}
              onStartingCash={setStartingCash}
              onSubmit={openShift}
              busy={busy}
              error={openError}
            />
          )}

          {/* What every other counter is doing right now — the reason a store
              running two tills can tell them apart at a glance. */}
          {openShifts.length > 0 && (
            <Card>
              <CardHead
                title="Open across the store"
                sub="Every counter currently running a drawer"
                right={<Badge tone="amber">{openShifts.length} open</Badge>}
              />
              <DataTable cols={['Counter', 'Cashier', 'Opened', { label: 'Opening cash', align: 'right' }]} minWidth={620}>
                {openShifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="t-strong">{shift.terminalName ?? '—'}</td>
                    <td>
                      {shift.staffName ?? '—'}
                      {shift.staffId === staffId && (
                        <span style={{ marginLeft: 8 }}>
                          <Badge tone="blue">You</Badge>
                        </span>
                      )}
                    </td>
                    <td className="t-sub">{stamp(shift.openedAt)}</td>
                    <td className="num">{money(shift.startingCash)}</td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          )}

          <ShiftHistory shifts={shifts.filter((s) => s.closedAt !== null)} />
        </>
      )}

      {closeOpen && activeShift && (
        <Modal
          title="Close shift and create Z report"
          onClose={() => setCloseOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCloseOpen(false)}>
                Keep shift open
              </button>
              <button className="btn btn-pri" disabled={busy} onClick={() => void closeShift()}>
                {busy ? 'Closing shift…' : 'Close shift and create Z report'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            Close {cashier}&apos;s shift on {activeShift.terminalName ?? 'this counter'} with a variance of{' '}
            <b className="num">{money(String(variance))}</b>? A final Z report will be created and this
            shift cannot accept more sales.
          </p>
        </Modal>
      )}
    </>
  )
}

function OpenRegister({
  cashier,
  terminals,
  terminalId,
  onTerminalId,
  startingCash,
  onStartingCash,
  onSubmit,
  busy,
  error,
}: {
  cashier: string
  terminals: Terminal[]
  terminalId: string
  onTerminalId: (value: string) => void
  startingCash: string
  onStartingCash: (value: string) => void
  onSubmit: (event: FormEvent) => void
  busy: boolean
  error: string | null
}) {
  const available = terminals.filter((t) => t.isActive && !t.hasOpenShift)

  return (
    <Card>
      <CardHead
        title="Open register"
        sub={`Count the drawer before the first sale. This is the opening cash for ${cashier}.`}
      />
      <CardPad>
        {error && (
          <div role="alert" style={{ marginBottom: 14, fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {terminals.length === 0 ? (
          <EmptyState
            icon={<Monitor size={24} strokeWidth={1.8} />}
            title="No counters set up yet"
            body="A shift belongs to a counter, so there has to be at least one before the register can open."
            action={
              <Link className="btn btn-pri" href="/app/settings/terminals">
                Set up counters
              </Link>
            }
          />
        ) : available.length === 0 ? (
          <EmptyState
            icon={<Monitor size={24} strokeWidth={1.8} />}
            title="Every counter is already running"
            body="All active counters have a shift open on them. Close one, or add another counter."
            action={
              <Link className="btn btn-pri" href="/app/settings/terminals">
                Manage counters
              </Link>
            }
          />
        ) : (
          <form onSubmit={onSubmit} style={{ maxWidth: 460 }}>
            <Fld id="terminal" label="Which counter">
              <select id="terminal" value={terminalId} onChange={(e) => onTerminalId(e.target.value)}>
                <option value="">Pick a counter…</option>
                {available.map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </option>
                ))}
              </select>
            </Fld>

            <Fld id="starting-cash" label="Opening cash count">
              <input
                id="starting-cash"
                inputMode="decimal"
                placeholder="₹0.00"
                value={startingCash}
                onChange={(e) => onStartingCash(e.target.value)}
              />
            </Fld>

            <button className="btn btn-pri" style={{ marginTop: 6 }} disabled={!startingCash || !terminalId || busy}>
              {busy ? 'Opening register…' : 'Open register'}
            </button>
          </form>
        )}
      </CardPad>
    </Card>
  )
}

function ActiveShift({
  shift,
  report,
  countedCash,
  onCountedCash,
  onRequestClose,
  busy,
}: {
  shift: ShiftHistoryEntry
  report: XReport | null
  countedCash: string
  onCountedCash: (value: string) => void
  onRequestClose: () => void
  busy: boolean
}) {
  const metrics: KpiItem[] = report
    ? [
        { label: 'Cash sales', value: money(report.cashSalesTotal), meta: 'Into this drawer' },
        { label: 'Card sales', value: money(report.cardSalesTotal), meta: 'Not in the drawer' },
        { label: 'Refunds', value: money(report.refundsTotal), meta: 'Cash paid back out' },
        { label: 'Sales completed', value: String(report.saleCount), meta: 'Bills on this shift' },
      ]
    : []

  return (
    <Split2>
      <Card>
        <CardHead
          title="X report"
          sub="Live snapshot only. It does not close this shift."
          right={<Badge tone="blue">{shift.terminalName ?? 'Counter'}</Badge>}
        />
        <CardPad>
          {report ? (
            <>
              <ReconciliationFigure
                label="Expected cash in drawer"
                amount={money(report.expectedCash)}
                variant="neutral"
              />
              <div style={{ marginTop: 16 }}>
                <KpiRow items={metrics} cols={2} />
              </div>
              <p className="t-sub" style={{ fontSize: 12 }}>
                Opened {stamp(shift.openedAt)} with {money(shift.startingCash)} in the drawer.
              </p>
            </>
          ) : (
            <LoadingState label="Loading the current X report" rows={3} />
          )}
        </CardPad>
      </Card>

      <Card>
        <CardHead title="Close shift" sub="Reconcile the physical drawer before creating the final Z report." />
        <CardPad>
          <Fld id="counted-cash" label="Counted cash">
            <input
              id="counted-cash"
              inputMode="decimal"
              placeholder="₹0.00"
              value={countedCash}
              onChange={(e) => onCountedCash(e.target.value)}
            />
          </Fld>

          {report && countedCash !== '' && (
            <p className="t-sub" style={{ fontSize: 12.5 }}>
              Variance against expected:{' '}
              <b className="num">{money(String(Number(countedCash) - Number(report.expectedCash)))}</b>
            </p>
          )}

          <button
            className="btn btn-pri"
            style={{ marginTop: 6 }}
            disabled={!countedCash || !report || busy}
            onClick={onRequestClose}
          >
            Close shift and create Z report
          </button>
        </CardPad>
      </Card>
    </Split2>
  )
}

function ClosedSummary({ report }: { report: ZReport }) {
  const varianceValue = Number(report.variance)
  return (
    <Card>
      <CardHead title="Shift closed. Z report saved." sub={`Closed ${stamp(report.closedAt)}`} />
      <CardPad>
        <ReconciliationFigure
          label="Variance"
          amount={money(report.variance)}
          variant={varianceValue === 0 ? 'match' : 'variance'}
        />
        <div style={{ marginTop: 16 }}>
          <KpiRow
            cols={4}
            items={[
              { label: 'Expected cash', value: money(report.expectedCash) },
              { label: 'Counted cash', value: money(report.countedCash) },
              { label: 'Cash sales', value: money(report.cashSalesTotal) },
              { label: 'Refunds', value: money(report.refundsTotal) },
            ]}
          />
        </div>
      </CardPad>
    </Card>
  )
}

function ShiftHistory({ shifts }: { shifts: ShiftHistoryEntry[] }) {
  return (
    <Card>
      <CardHead
        title="Past shifts"
        sub="Closed shifts and their Z report variance"
        right={shifts.length > 0 ? <Badge tone="grey">{shifts.length}</Badge> : undefined}
      />

      {shifts.length === 0 ? (
        <EmptyState
          icon={<History size={24} strokeWidth={1.8} />}
          title="No closed shifts yet"
          body="Once a shift is closed, its Z report and cash variance are listed here."
        />
      ) : (
        <DataTable
          cols={[
            'Counter',
            'Cashier',
            'Opened',
            'Closed',
            { label: 'Expected', align: 'right' },
            { label: 'Counted', align: 'right' },
            { label: 'Variance', align: 'right' },
          ]}
          minWidth={900}
        >
          {shifts.map((shift) => {
            const varianceValue = Number(shift.variance ?? 0)
            // Expected is not stored on the row — it is counted minus variance,
            // which is the same arithmetic the server used to produce both.
            const expected = Number(shift.countedCash ?? 0) - varianceValue
            return (
              <tr key={shift.id}>
                <td className="t-strong">{shift.terminalName ?? '—'}</td>
                <td>{shift.staffName ?? '—'}</td>
                <td className="t-sub">{stamp(shift.openedAt)}</td>
                <td className="t-sub">{shift.closedAt ? stamp(shift.closedAt) : '—'}</td>
                <td className="num">{money(String(expected))}</td>
                <td className="num">{money(shift.countedCash ?? '0')}</td>
                <td className="num" style={{ textAlign: 'right' }}>
                  <Badge tone={varianceValue === 0 ? 'green' : Math.abs(varianceValue) < 1 ? 'amber' : 'red'}>
                    {money(shift.variance ?? '0')}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </DataTable>
      )}
    </Card>
  )
}
