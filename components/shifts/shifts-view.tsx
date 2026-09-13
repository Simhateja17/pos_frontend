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
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

type XReport = {
  shiftId: string
  expectedCash: string
  cashSalesTotal: string
  cardSalesTotal: string
  upiSalesTotal: string
  checkSalesTotal: string
  refundsTotal: string
  saleCount: number
}
type ZReport = XReport & { countedCash: string; variance: string; closedAt: string }

type Terminal = {
  id: string
  name: string
  isActive: boolean
  hasOpenShift: boolean
  cashMode?: 'cash' | 'none'
  isCurrentDevice?: boolean
}

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
/**
 * A total the API has not sent yet (an older backend without UPI, say) must
 * read as a zero amount, never NaN. Takes the edition's formatter so the same
 * guard serves rupees and dollars.
 */
const safeMoney = (format: (value: string | number) => string, value: string) => {
  const amount = Number(value)
  return format(Number.isFinite(amount) ? amount : 0)
}
const stampAt = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

/** Money and timestamp helpers bound to the current edition and language. */
function useShiftFormat() {
  const { money: formatMoney, dateLocale } = useAppRegion()
  return {
    money: (value: string) => safeMoney(formatMoney, value),
    stamp: (value: string) => stampAt(value, dateLocale),
  }
}

export function ShiftsView() {
  const t = useT()
  const { money, stamp } = useShiftFormat()
  const loadError = t('shifts.loadError')
  /**
   * Which shift is "mine" is derived from the server, not cached in
   * localStorage. A paired counter is the primary key: cashiers can change
   * on the same device while the one physical drawer shift stays open. The
   * staff-id fallback only supports older, unpaired API sessions.
   */
  const [staffId, setStaffId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string | null>(null)
  const cashier = staffName ?? t('shifts.currentOperator')
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null)

  const [shifts, setShifts] = useState<ShiftHistoryEntry[]>([])
  const [, setTerminals] = useState<Terminal[]>([])
  const [currentTerminal, setCurrentTerminal] = useState<Terminal | null>(null)
  const [report, setReport] = useState<XReport | null>(null)
  const [closed, setClosed] = useState<ZReport | null>(null)

  const [startingCash, setStartingCash] = useState('')
  const [countedCash, setCountedCash] = useState('')

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)

  const activeShift = currentTerminal
    ? shifts.find((s) => s.closedAt === null && s.terminalId === currentTerminal.id) ?? null
    : staffId
      ? shifts.find((s) => s.closedAt === null && s.staffId === staffId) ?? null
      : null

  const loadXReport = useCallback(async (id: string) => {
    const result = await apiClient.GET('/shifts/{shiftId}/x-report', {
      params: { path: { shiftId: id } },
      headers: await authHeaders(),
    })
    if (result.error || !result.data) {
      setError(loadError)
      return
    }
    setReport(result.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = useCallback(async () => {
    setError(null)
    const headers = await authHeaders()

    const [shiftsResult, terminalsResult, deviceResult] = await Promise.all([
      apiClient.GET('/shifts', { headers }),
      apiClient.GET('/terminals', { headers }),
      apiClient.GET('/terminals/device', { headers }),
    ])

    if (shiftsResult.error || !shiftsResult.data || terminalsResult.error || !terminalsResult.data || deviceResult.error) {
      setLoading(false)
      setError(loadError)
      return
    }

    setShifts(shiftsResult.data as ShiftHistoryEntry[])
    setTerminals(terminalsResult.data as Terminal[])
    setCurrentTerminal(deviceResult.data?.terminal ?? null)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void getAuthenticatedAppContext()
      .then((context) => {
        setStaffId(context.staff.id)
        setRole(context.staff.role)
        if (context.staff.name) setStaffName(context.staff.name)
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
    if (!currentTerminal) {
      setOpenError(t('shifts.pairFirst'))
      return
    }
    const openingCash = startingCash.trim()
    if (currentTerminal.cashMode !== 'none') {
      if (!openingCash) {
        setOpenError(t('shifts.openingRequired', { zero: money('0') }))
        return
      }
      if (!Number.isFinite(Number(openingCash)) || Number(openingCash) < 0) {
        setOpenError(t('shifts.openingInvalid', { zero: money('0') }))
        return
      }
    }

    setBusy(true)
    setOpenError(null)
    const result = await apiClient.POST('/shifts', {
      body: {
        startingCash: currentTerminal.cashMode === 'none' ? '0.00' : Number(openingCash).toFixed(2),
      },
      headers: await authHeaders(),
    })
    setBusy(false)

    if (result.error || !result.data) {
      // The backend names the counter and who holds it: show that, not a
      // generic failure, since the fix is "pick another counter".
      setOpenError((result.error as { error?: string } | undefined)?.error ?? loadError)
      return
    }

    setClosed(null)
    setStartingCash('')
    await load()
  }

  // The drawer count is the one field the server cannot guess, so it is
  // validated here rather than by disabling the button: a dead button gives
  // the cashier nothing to act on.
  function invalidCount() {
    const counted = countedCash.trim()
    if (!counted) return t('shifts.countRequired', { zero: money('0') })
    if (!Number.isFinite(Number(counted)) || Number(counted) < 0)
      return t('shifts.countInvalid', { zero: money('0') })
    return null
  }

  function requestClose() {
    const problem = invalidCount()
    if (problem) {
      setCloseError(problem)
      return
    }
    setCloseError(null)
    setCloseOpen(true)
  }

  async function closeShift() {
    if (!activeShift) return
    const problem = invalidCount()
    if (problem) {
      setCloseError(problem)
      setCloseOpen(false)
      return
    }

    setBusy(true)
    setError(null)
    setCloseError(null)
    const result = await apiClient.POST('/shifts/{shiftId}/close', {
      params: { path: { shiftId: activeShift.id } },
      body: { countedCash: Number(countedCash).toFixed(2) },
      headers: await authHeaders(),
    })
    setBusy(false)

    if (result.error || !result.data) {
      // Keep the reason beside the close form: the cashier is at the bottom of
      // the page and would never see a banner at the top.
      setCloseError((result.error as { error?: string } | undefined)?.error ?? loadError)
      setCloseOpen(false)
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
        title={t('shifts.title')}
        sub={t('shifts.sub', { cashier })}
        actions={
          activeShift ? (
            <button className="btn" disabled={busy} onClick={() => void loadXReport(activeShift.id)}>
              <RefreshCw size={15} /> {t('shifts.refreshX')}
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
          <LoadingState label={t('shifts.loading')} rows={4} />
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
              onCountedCash={(value) => {
                setCountedCash(value)
                if (closeError) setCloseError(null)
              }}
              onRequestClose={requestClose}
              busy={busy}
              error={closeError}
            />
          ) : (
            <OpenRegister
              cashier={cashier}
              currentTerminal={currentTerminal}
              startingCash={startingCash}
              onStartingCash={(value) => {
                setStartingCash(value)
                if (openError) setOpenError(null)
              }}
              onSubmit={openShift}
              busy={busy}
              error={openError}
              canPairCounter={role !== 'cashier'}
            />
          )}

          {/* What every other counter is doing right now: the reason a store
              running two tills can tell them apart at a glance. */}
          {role && role !== 'cashier' && openShifts.length > 0 && (
            <Card>
              <CardHead
                title={t('shifts.openAcross')}
                sub={t('shifts.openAcrossSub')}
                right={<Badge tone="amber">{t('shifts.openCount', { count: openShifts.length })}</Badge>}
              />
              <DataTable
                cols={[t('shifts.cols.counter'), t('shifts.cols.cashier'), t('shifts.cols.opened'), t('shifts.cols.openingCash')]}
                minWidth={620}
              >
                {openShifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="t-strong">{shift.terminalName ?? '-'}</td>
                    <td>
                      {shift.staffName ?? '-'}
                      {currentTerminal && shift.terminalId === currentTerminal.id && (
                        <span style={{ marginLeft: 8 }}>
                          <Badge tone="blue">{t('shifts.thisCounter')}</Badge>
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

          {role && role !== 'cashier' && <ShiftHistory shifts={shifts.filter((s) => s.closedAt !== null)} />}
        </>
      )}

      {closeOpen && activeShift && (
        <Modal
          title={t('shifts.closeTitle')}
          onClose={() => setCloseOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCloseOpen(false)}>
                {t('shifts.keepOpen')}
              </button>
              <button className="btn btn-pri" disabled={busy} onClick={() => void closeShift()}>
                {busy ? t('shifts.closing') : t('shifts.closeTitle')}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            {t('shifts.closeConfirm', {
              cashier,
              counter: activeShift.terminalName ?? t('shifts.thisCounterLower'),
              variance: money(String(variance)),
            })}
          </p>
        </Modal>
      )}
    </>
  )
}

function OpenRegister({
  cashier,
  currentTerminal,
  startingCash,
  onStartingCash,
  onSubmit,
  busy,
  error,
  canPairCounter = true,
}: {
  cashier: string
  currentTerminal: Terminal | null
  startingCash: string
  onStartingCash: (value: string) => void
  onSubmit: (event: FormEvent) => void
  busy: boolean
  error: string | null
  canPairCounter?: boolean
}) {
  const t = useT()
  const { money } = useShiftFormat()
  return (
    <Card>
      <CardHead
        title={currentTerminal ? t('shifts.openCounter', { counter: currentTerminal.name }) : t('shifts.connectDevice')}
        sub={currentTerminal
          ? currentTerminal.cashMode === 'none'
            ? t('shifts.noCashSub', { cashier, zero: money('0') })
            : t('shifts.countSub', { counter: currentTerminal.name })
          : t('shifts.pairSub')}
      />
      <CardPad>
        {error && (
          <div role="alert" style={{ marginBottom: 14, fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {!currentTerminal ? (
          <EmptyState
            icon={<Monitor size={24} strokeWidth={1.8} />}
            title={t('shifts.notPairedTitle')}
            body={t('shifts.notPairedBody')}
            action={canPairCounter ? (
              <Link className="btn btn-pri" href="/app/settings/terminals">
                {t('shifts.pairCounter')}
              </Link>
            ) : undefined}
          />
        ) : (
          <form onSubmit={onSubmit} style={{ maxWidth: 460 }}>
            {currentTerminal.cashMode === 'none' ? (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--soft)', color: 'var(--ink-2)', fontSize: 13 }}>
                {t('shifts.noCashCounter', { zero: money('0') })}
              </div>
            ) : (
              <Fld id="starting-cash" label={t('shifts.openingCount')}>
                <input
                  id="starting-cash"
                  inputMode="decimal"
                  placeholder={money('0')}
                  aria-invalid={Boolean(error)}
                  value={startingCash}
                  onChange={(e) => onStartingCash(e.target.value)}
                />
              </Fld>
            )}

            <button className="btn btn-pri" style={{ marginTop: 6 }} disabled={busy}>
              {busy ? t('shifts.openingRegister') : t('shifts.openRegister')}
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
  error,
}: {
  shift: ShiftHistoryEntry
  report: XReport | null
  countedCash: string
  onCountedCash: (value: string) => void
  onRequestClose: () => void
  busy: boolean
  error: string | null
}) {
  const t = useT()
  const { money, stamp } = useShiftFormat()
  const metrics: KpiItem[] = report
    ? [
        { label: t('shifts.kpi.cashSales'), value: money(report.cashSalesTotal), meta: t('shifts.kpi.intoDrawer') },
        { label: t('shifts.kpi.cardSales'), value: money(report.cardSalesTotal), meta: t('shifts.kpi.notInDrawer') },
        { label: t('shifts.kpi.upiSales'), value: money(report.upiSalesTotal), meta: t('shifts.kpi.notInDrawer') },
        { label: t('shifts.kpi.refunds'), value: money(report.refundsTotal), meta: t('shifts.kpi.paidBack') },
        { label: t('shifts.kpi.salesCompleted'), value: String(report.saleCount), meta: t('shifts.kpi.billsOnShift') },
      ]
    : []

  return (
    <Split2>
      <Card>
        <CardHead
          title={t('shifts.xReport')}
          sub={t('shifts.xReportSub')}
          right={<Badge tone="blue">{shift.terminalName ?? t('shifts.counter')}</Badge>}
        />
        <CardPad>
          {report ? (
            <>
              <ReconciliationFigure
                label={t('shifts.expectedInDrawer')}
                amount={money(report.expectedCash)}
                variant="neutral"
              />
              <div style={{ marginTop: 16 }}>
                <KpiRow items={metrics} cols={2} />
              </div>
              <p className="t-sub" style={{ fontSize: 12 }}>
                {t('shifts.openedWith', { date: stamp(shift.openedAt), amount: money(shift.startingCash) })}
              </p>
            </>
          ) : (
            <LoadingState label={t('shifts.loadingX')} rows={3} />
          )}
        </CardPad>
      </Card>

      <Card>
        <CardHead title={t('shifts.closeShift')} sub={t('shifts.closeShiftSub')} />
        <CardPad>
          <Fld id="counted-cash" label={t('shifts.countedCash')}>
            <input
              id="counted-cash"
              inputMode="decimal"
              placeholder={money('0')}
              aria-invalid={Boolean(error)}
              value={countedCash}
              onChange={(e) => onCountedCash(e.target.value)}
            />
          </Fld>

          {error && (
            <div role="alert" style={{ marginBottom: 10, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {report && countedCash !== '' && (
            <p className="t-sub" style={{ fontSize: 12.5 }}>
              {t('shifts.varianceAgainst')}{' '}
              <b className="num">{money(String(Number(countedCash) - Number(report.expectedCash)))}</b>
            </p>
          )}

          <button
            className="btn btn-pri"
            style={{ marginTop: 6 }}
            disabled={!report || busy}
            onClick={onRequestClose}
          >
            {t('shifts.closeTitle')}
          </button>
        </CardPad>
      </Card>
    </Split2>
  )
}

function ClosedSummary({ report }: { report: ZReport }) {
  const t = useT()
  const { money, stamp } = useShiftFormat()
  const varianceValue = Number(report.variance)
  return (
    <Card>
      <CardHead title={t('shifts.closedTitle')} sub={t('shifts.closedAt', { date: stamp(report.closedAt) })} />
      <CardPad>
        <ReconciliationFigure
          label={t('shifts.variance')}
          amount={money(report.variance)}
          variant={varianceValue === 0 ? 'match' : 'variance'}
        />
        <div style={{ marginTop: 16 }}>
          <KpiRow
            cols={3}
            items={[
              { label: t('shifts.kpi.expectedCash'), value: money(report.expectedCash) },
              { label: t('shifts.kpi.countedCash'), value: money(report.countedCash) },
              { label: t('shifts.kpi.cashSales'), value: money(report.cashSalesTotal) },
              { label: t('shifts.kpi.cardSales'), value: money(report.cardSalesTotal) },
              { label: t('shifts.kpi.upiSales'), value: money(report.upiSalesTotal) },
              { label: t('shifts.kpi.refunds'), value: money(report.refundsTotal) },
            ]}
          />
        </div>
      </CardPad>
    </Card>
  )
}

function ShiftHistory({ shifts }: { shifts: ShiftHistoryEntry[] }) {
  const t = useT()
  const { money, stamp } = useShiftFormat()
  return (
    <Card>
      <CardHead
        title={t('shifts.pastTitle')}
        sub={t('shifts.pastSub')}
        right={shifts.length > 0 ? <Badge tone="grey">{shifts.length}</Badge> : undefined}
      />

      {shifts.length === 0 ? (
        <EmptyState
          icon={<History size={24} strokeWidth={1.8} />}
          title={t('shifts.noPastTitle')}
          body={t('shifts.noPastBody')}
        />
      ) : (
        <DataTable
          cols={[
            t('shifts.cols.counter'),
            t('shifts.cols.cashier'),
            t('shifts.cols.opened'),
            t('shifts.cols.closed'),
            t('shifts.cols.expected'),
            t('shifts.cols.counted'),
            t('shifts.cols.variance'),
          ]}
          minWidth={900}
        >
          {shifts.map((shift) => {
            const varianceValue = Number(shift.variance ?? 0)
            // Expected is not stored on the row: it is counted minus variance,
            // which is the same arithmetic the server used to produce both.
            const expected = Number(shift.countedCash ?? 0) - varianceValue
            return (
              <tr key={shift.id}>
                <td className="t-strong">{shift.terminalName ?? '-'}</td>
                <td>{shift.staffName ?? '-'}</td>
                <td className="t-sub">{stamp(shift.openedAt)}</td>
                <td className="t-sub">{shift.closedAt ? stamp(shift.closedAt) : '-'}</td>
                <td className="num">{money(String(expected))}</td>
                <td className="num">{money(shift.countedCash ?? '0')}</td>
                <td className="num">
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
