'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ReconciliationFigure } from '@/components/shifts/reconciliation-figure'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

type XReport = { shiftId: string; expectedCash: string; cashSalesTotal: string; cardSalesTotal: string; checkSalesTotal: string; refundsTotal: string; saleCount: number }
type ZReport = XReport & { countedCash: string; variance: string; closedAt: string }
const STORAGE_KEY = 'couture.activeShiftId'
const LOAD_ERROR = "We couldn't load this shift. Check your connection and try again."
const money = (value: string) => `₹${Number(value).toFixed(2)}`
async function authHeader() { const { data } = await supabase.auth.getSession(); return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined }

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
    setLoading(true); setError(null)
    const result = await apiClient.GET('/shifts/{shiftId}/x-report', { params: { path: { shiftId: id } }, headers: await authHeader() })
    setLoading(false)
    if (result.error || !result.data) { setError(LOAD_ERROR); return }
    setReport(result.data)
  }, [])
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) { setShiftId(saved); void load(saved) }
    void supabase.auth.getSession().then(({ data }) => { const name = data.session?.user.user_metadata?.full_name; if (typeof name === 'string' && name) setCashier(name) })
  }, [load])

  async function openShift(event: FormEvent) {
    event.preventDefault(); if (!startingCash || Number(startingCash) < 0) return
    setLoading(true); setError(null)
    const result = await apiClient.POST('/shifts', { body: { startingCash: Number(startingCash).toFixed(2) }, headers: await authHeader() })
    setLoading(false)
    if (result.error || !result.data) { setError(LOAD_ERROR); return }
    setShiftId(result.data.id); window.localStorage.setItem(STORAGE_KEY, result.data.id); await load(result.data.id)
  }
  async function closeShift() {
    if (!shiftId || !countedCash || Number(countedCash) < 0) return
    setLoading(true); setError(null)
    const result = await apiClient.POST('/shifts/{shiftId}/close', { params: { path: { shiftId } }, body: { countedCash: Number(countedCash).toFixed(2) }, headers: await authHeader() })
    setLoading(false)
    if (result.error || !result.data) { setError(LOAD_ERROR); return }
    setClosed(result.data); setCloseOpen(false); window.localStorage.removeItem(STORAGE_KEY)
  }

  if (!shiftId) return <main className="mx-auto flex min-h-[calc(100vh-84px)] max-w-4xl items-center p-5"><Card className="w-full"><CardHeader><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0058ba]">Register & shifts</p><CardTitle className="font-heading text-3xl">Open register</CardTitle><CardDescription>Count the drawer before the first sale. This is the opening cash for {cashier}.</CardDescription></CardHeader><CardContent>{error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}<form onSubmit={openShift} className="max-w-md"><label className="mb-2 block text-sm font-bold" htmlFor="starting-cash">Opening cash count</label><Input id="starting-cash" inputMode="decimal" placeholder="₹0.00" value={startingCash} onChange={(event) => setStartingCash(event.target.value)} /><Button className="mt-5 bg-[#0058ba] hover:bg-[#064b9f]" disabled={!startingCash || loading}>{loading ? 'Opening register…' : 'Open register'}</Button></form></CardContent></Card></main>

  const variance = report ? Number(countedCash || 0) - Number(report.expectedCash) : 0
  return <main className="mx-auto max-w-6xl p-5 md:p-8"><header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0058ba]">Register & shifts</p><h1 className="mt-2 font-heading text-3xl font-bold">Shift control</h1><p className="mt-2 text-sm text-slate-500">{cashier} · Current cash and sales are provided by the active shift report.</p></div>{!closed && <Button variant="outline" disabled={loading} onClick={() => shiftId && void load(shiftId)}>Refresh X report</Button>}</header>{error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}{closed ? <Card><CardHeader><CardTitle>Shift closed. Z report saved.</CardTitle><CardDescription>Closed {new Date(closed.closedAt).toLocaleString()}</CardDescription></CardHeader><CardContent><ReconciliationFigure label="Variance" amount={money(closed.variance)} variant={Number(closed.variance) === 0 ? 'match' : 'variance'} /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Metric label="Expected cash" value={money(closed.expectedCash)} /><Metric label="Counted cash" value={money(closed.countedCash)} /><Metric label="Cash sales" value={money(closed.cashSalesTotal)} /><Metric label="Refunds" value={money(closed.refundsTotal)} /></div></CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><CardTitle>X report</CardTitle><CardDescription>Live snapshot only. It does not close this shift.</CardDescription></CardHeader><CardContent>{report ? <><ReconciliationFigure label="Expected cash in drawer" amount={money(report.expectedCash)} variant="neutral" /><div className="mt-5 divide-y rounded-xl border"><Metric label="Cash sales" value={money(report.cashSalesTotal)} /><Metric label="Card sales" value={money(report.cardSalesTotal)} /><Metric label="Refunds" value={money(report.refundsTotal)} /><Metric label="Sales completed" value={String(report.saleCount)} /></div></> : <p className="text-sm text-slate-500">Loading the current X report…</p>}</CardContent></Card><Card><CardHeader><CardTitle>Close shift</CardTitle><CardDescription>Reconcile the physical drawer before creating the final Z report.</CardDescription></CardHeader><CardContent><label className="mb-2 block text-sm font-bold" htmlFor="counted-cash">Counted cash</label><Input id="counted-cash" inputMode="decimal" placeholder="₹0.00" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} /><Button className="mt-5" variant="destructive" disabled={!countedCash || !report || loading} onClick={() => setCloseOpen(true)}>Close shift and create Z report</Button></CardContent></Card></div>}<Dialog open={closeOpen} onOpenChange={setCloseOpen}><DialogContent><DialogHeader><DialogTitle>Close shift and create Z report</DialogTitle></DialogHeader><p className="text-sm text-slate-600">Close {cashier}&apos;s shift with a variance of {money(String(variance))}? A final Z report will be created and this shift cannot accept more sales.</p><DialogFooter><Button variant="outline" onClick={() => setCloseOpen(false)}>Keep shift open</Button><Button variant="destructive" disabled={loading} onClick={() => void closeShift()}>{loading ? 'Closing shift…' : 'Close shift and create Z report'}</Button></DialogFooter></DialogContent></Dialog></main>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 p-4"><span className="text-sm text-slate-500">{label}</span><strong>{value}</strong></div> }
