'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Card, CardHead, CardPad, Fld, Modal, PageHead, Split2 } from '@/components/couture/ui'
import { ReconciliationFigure } from '@/components/shifts/reconciliation-figure'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

type XReport = { shiftId: string; expectedCash: string; cashSalesTotal: string; cardSalesTotal: string; checkSalesTotal: string; refundsTotal: string; saleCount: number }
type ZReport = XReport & { countedCash: string; variance: string; closedAt: string }
const STORAGE_KEY = 'couture.activeShiftId'
const LOAD_ERROR = "We couldn't load this shift. Check your connection and try again."
const money = (value: string) => `₹${Number(value).toFixed(2)}`
async function authHeader() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined
}

export function ShiftsView() {
  const [shiftId, setShiftId] = useState<string | null>(null)
  const [startingCash, setStartingCash] = useState('')
  const [countedCash, setCountedCash] = useState('')
  const [report, setReport] = useState<XReport | null>(null)
  const [closed, setClosed] = useState<ZReport | null>(null)
  const [cashier, setCashier] = useState('Current operator')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    const result = await apiClient.GET('/shifts/{shiftId}/x-report', { params: { path: { shiftId: id } }, headers: await authHeader() })
    setLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setReport(result.data)
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setShiftId(saved)
      void load(saved)
    }
    void supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user.user_metadata?.full_name
      if (typeof name === 'string' && name) setCashier(name)
    })
  }, [load])

  async function openShift(event: FormEvent) {
    event.preventDefault()
    if (!startingCash || Number(startingCash) < 0) return
    setLoading(true)
    setError(null)
    const result = await apiClient.POST('/shifts', { body: { startingCash: Number(startingCash).toFixed(2) }, headers: await authHeader() })
    setLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setShiftId(result.data.id)
    window.localStorage.setItem(STORAGE_KEY, result.data.id)
    await load(result.data.id)
  }

  async function closeShift() {
    if (!shiftId || !countedCash || Number(countedCash) < 0) return
    setLoading(true)
    setError(null)
    const result = await apiClient.POST('/shifts/{shiftId}/close', {
      params: { path: { shiftId } },
      body: { countedCash: Number(countedCash).toFixed(2) },
      headers: await authHeader(),
    })
    setLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setClosed(result.data)
    setCloseOpen(false)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  if (!shiftId) {
    return (
      <>
        <PageHead title="Open register" sub={`Count the drawer before the first sale. This is the opening cash for ${cashier}.`} />
        <Card style={{ maxWidth: 440 }}>
          <CardPad>
            <form onSubmit={openShift}>
              {error && (
                <div role="alert" style={{ marginBottom: 13, fontSize: 13, color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
              <Fld id="starting-cash" label="Opening cash count">
                <input
                  id="starting-cash"
                  inputMode="decimal"
                  placeholder="₹0.00"
                  value={startingCash}
                  onChange={(event) => setStartingCash(event.target.value)}
                />
              </Fld>
              <button className="btn btn-pri" type="submit" disabled={!startingCash || loading}>
                {loading ? 'Opening register…' : 'Open register'}
              </button>
            </form>
          </CardPad>
        </Card>
      </>
    )
  }

  const variance = report ? Number(countedCash || 0) - Number(report.expectedCash) : 0

  return (
    <>
      <PageHead
        title="Register & Shifts"
        sub={`${cashier} · cash and sales come from the active shift report`}
        actions={
          !closed ? (
            <button className="btn" type="button" disabled={loading} onClick={() => shiftId && void load(shiftId)}>
              Refresh X report
            </button>
          ) : null
        }
      />

      {error && (
        <Card>
          <CardPad>
            <div role="alert" style={{ fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          </CardPad>
        </Card>
      )}

      {closed ? (
        <Card>
          <CardHead title="Shift closed. Z report saved." sub={`Closed ${new Date(closed.closedAt).toLocaleString()}`} />
          <CardPad>
            <ReconciliationFigure
              label="Variance"
              amount={money(closed.variance)}
              variant={Number(closed.variance) === 0 ? 'match' : 'variance'}
            />
            <div className="res-box" style={{ padding: '0 14px' }}>
              <Metric label="Expected cash" value={money(closed.expectedCash)} />
              <Metric label="Counted cash" value={money(closed.countedCash)} />
              <Metric label="Cash sales" value={money(closed.cashSalesTotal)} />
              <Metric label="Refunds" value={money(closed.refundsTotal)} />
            </div>
          </CardPad>
        </Card>
      ) : (
        <Split2>
          <Card>
            <CardHead title="X report" sub="Live snapshot only. It does not close this shift." />
            <CardPad>
              {report ? (
                <>
                  <ReconciliationFigure label="Expected cash in drawer" amount={money(report.expectedCash)} variant="neutral" />
                  <div className="res-box" style={{ padding: '0 14px' }}>
                    <Metric label="Cash sales" value={money(report.cashSalesTotal)} />
                    <Metric label="Card sales" value={money(report.cardSalesTotal)} />
                    <Metric label="Refunds" value={money(report.refundsTotal)} />
                    <Metric label="Sales completed" value={String(report.saleCount)} />
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading the current X report…</p>
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
                  onChange={(event) => setCountedCash(event.target.value)}
                />
              </Fld>
              <button
                className="btn btn-pri"
                type="button"
                disabled={!countedCash || !report || loading}
                onClick={() => setCloseOpen(true)}
              >
                Close shift and create Z report
              </button>
            </CardPad>
          </Card>
        </Split2>
      )}

      {closeOpen && (
        <Modal
          title="Close shift and create Z report"
          onClose={() => setCloseOpen(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCloseOpen(false)}>
                Keep shift open
              </button>
              <button className="btn btn-pri" type="button" disabled={loading} onClick={() => void closeShift()}>
                {loading ? 'Closing shift…' : 'Close shift and create Z report'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            Close {cashier}&apos;s shift with a variance of {money(String(variance))}? A final Z report will be created and
            this shift cannot accept more sales.
          </p>
        </Modal>
      )}
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="lrow">
      <div style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{label}</div>
      <strong style={{ fontSize: 13.5 }}>{value}</strong>
    </div>
  )
}
