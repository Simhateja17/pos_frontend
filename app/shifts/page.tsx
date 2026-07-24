'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { ReconciliationFigure } from '@/components/shifts/reconciliation-figure'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type XReport = {
  shiftId: string
  expectedCash: string
  cashSalesTotal: string
  cardSalesTotal: string
  checkSalesTotal: string
  refundsTotal: string
  saleCount: number
}

type ZReport = XReport & {
  countedCash: string
  variance: string
  closedAt: string
}

const STORAGE_KEY = 'couture.activeShiftId'
const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."
const CLOSE_CONFIRM =
  'Close shift: Once closed, no further sales can be attributed to this shift. Continue?'

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

function money(value: string) {
  return `₹${Number(value).toFixed(2)}`
}

export default function ShiftsPage() {
  const [shiftId, setShiftId] = useState<string | null>(null)
  const [startingCash, setStartingCash] = useState('')
  const [countedCash, setCountedCash] = useState('')
  const [xReport, setXReport] = useState<XReport | null>(null)
  const [zReport, setZReport] = useState<ZReport | null>(null)
  const [cashierName, setCashierName] = useState('Current cashier')
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = useCallback(async (activeShiftId: string) => {
    setIsLoading(true)
    setError(null)
    const headers = await authHeader()
    const result = await apiClient.GET('/shifts/{shiftId}/x-report', {
      params: { path: { shiftId: activeShiftId } },
      headers,
    })
    setIsLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setXReport(result.data)
  }, [])

  useEffect(() => {
    const savedShiftId = window.localStorage.getItem(STORAGE_KEY)
    if (savedShiftId) {
      setShiftId(savedShiftId)
      void loadSnapshot(savedShiftId)
    }
    void supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user.user_metadata?.full_name
      if (typeof name === 'string' && name) setCashierName(name)
    })
  }, [loadSnapshot])

  async function openShift(event: FormEvent) {
    event.preventDefault()
    if (!startingCash || Number(startingCash) < 0) return
    setIsLoading(true)
    setError(null)
    const headers = await authHeader()
    const result = await apiClient.POST('/shifts', {
      body: { startingCash: Number(startingCash).toFixed(2) },
      headers,
    })
    setIsLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setShiftId(result.data.id)
    setOpenedAt(result.data.openedAt)
    window.localStorage.setItem(STORAGE_KEY, result.data.id)
    await loadSnapshot(result.data.id)
  }

  async function closeShift(event: FormEvent) {
    event.preventDefault()
    if (!shiftId || !countedCash || Number(countedCash) < 0 || !window.confirm(CLOSE_CONFIRM)) return
    setIsLoading(true)
    setError(null)
    const headers = await authHeader()
    const result = await apiClient.POST('/shifts/{shiftId}/close', {
      params: { path: { shiftId } },
      body: { countedCash: Number(countedCash).toFixed(2) },
      headers,
    })
    setIsLoading(false)
    if (result.error || !result.data) {
      setError(LOAD_ERROR)
      return
    }
    setZReport(result.data)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  if (!shiftId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Start your shift</CardTitle>
            <CardDescription>
              Count the drawer before the first sale. This becomes the opening balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="mb-6 grid gap-3 rounded-xl bg-muted/40 p-4 text-sm md:grid-cols-2">
              <div>
                <span className="block text-muted-foreground">Cashier</span>
                <strong>{cashierName}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">Shift start</span>
                <strong>{new Date().toLocaleString()}</strong>
              </div>
            </div>
            <form onSubmit={openShift}>
              <label className="mb-2 block text-sm font-semibold" htmlFor="starting-cash">
                Starting cash count
              </label>
              <Input
                id="starting-cash"
                inputMode="decimal"
                placeholder="$0.00"
                value={startingCash}
                onChange={(event) => setStartingCash(event.target.value)}
                className="h-12 text-lg"
              />
              <Button className="mt-5 w-full" size="lg" disabled={!startingCash || isLoading}>
                {isLoading ? 'Opening…' : 'Open shift'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 md:p-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Cash drawer</p>
          <h1 className="font-heading text-3xl font-semibold">Shift control</h1>
          <p className="text-muted-foreground">
            {cashierName}
            {openedAt ? ` · Opened ${new Date(openedAt).toLocaleString()}` : ''}
          </p>
        </div>
        {!zReport && (
          <Button variant="outline" disabled={isLoading} onClick={() => void loadSnapshot(shiftId)}>
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {zReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Shift closed. Z report saved.</CardTitle>
            <CardDescription>Closed {new Date(zReport.closedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReconciliationFigure
              label="Variance"
              amount={money(zReport.variance)}
              variant={Number(zReport.variance) === 0 ? 'match' : 'variance'}
            />
            <p className="mt-3 font-medium">
              {Number(zReport.variance) === 0
                ? 'Drawer matches — no variance.'
                : `Variance: ${Number(zReport.variance) > 0 ? '+' : ''}${money(zReport.variance)}`}
            </p>
            <div className="mt-6 grid gap-3 rounded-xl bg-muted/40 p-5 sm:grid-cols-2">
              <ReportRow label="Expected cash" value={money(zReport.expectedCash)} />
              <ReportRow label="Counted cash" value={money(zReport.countedCash)} />
              <ReportRow label="Cash sales" value={money(zReport.cashSalesTotal)} />
              <ReportRow label="Refunds" value={money(zReport.refundsTotal)} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="snapshot">
          <TabsList>
            <TabsTrigger value="snapshot">X report</TabsTrigger>
            <TabsTrigger value="close">Close shift</TabsTrigger>
          </TabsList>
          <TabsContent value="snapshot">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-2xl">Shift snapshot</CardTitle>
                <CardDescription>Live snapshot — does not close your shift</CardDescription>
              </CardHeader>
              <CardContent>
                {xReport && (
                  <>
                    <ReconciliationFigure
                      label="Expected cash in drawer"
                      amount={money(xReport.expectedCash)}
                      variant="neutral"
                    />
                    <div className="mt-7 divide-y rounded-xl border">
                      <ReportRow label="Cash sales" value={money(xReport.cashSalesTotal)} />
                      <ReportRow label="Card sales" value={money(xReport.cardSalesTotal)} />
                      <ReportRow label="Check sales" value={money(xReport.checkSalesTotal)} />
                      <ReportRow label="Cash refunds" value={money(xReport.refundsTotal)} />
                      <ReportRow label="Sales completed" value={String(xReport.saleCount)} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="close">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-2xl">Close shift</CardTitle>
                <CardDescription>
                  Reconcile the physical drawer and save the final Z report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm font-medium">
                  Expected: {xReport ? money(xReport.expectedCash) : '—'}
                </p>
                <form onSubmit={closeShift}>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="counted-cash">
                    Counted cash
                  </label>
                  <Input
                    id="counted-cash"
                    inputMode="decimal"
                    placeholder="$0.00"
                    value={countedCash}
                    onChange={(event) => setCountedCash(event.target.value)}
                    className="h-12 text-lg"
                  />
                  <Button
                    className="mt-5"
                    variant="destructive"
                    disabled={!countedCash || !xReport || isLoading}
                  >
                    {isLoading ? 'Closing…' : 'Close shift'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
