'use client'

import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Sale = {
  id: string
  customerId: string | null
  totalAmount: string
  createdAt: string
  lines: {
    id: string
    variantId: string
    quantity: number
    unitPrice: string
    lineTotal: string
  }[]
  payments: {
    method: 'cash' | 'card' | 'check'
    direction: 'payment' | 'refund'
    amount: string
    referenceCode: string | null
  }[]
}

type ReturnResponse = {
  saleId: string
  refundTotal: string
}

const LOAD_ERROR = "Couldn't load this page. Check your connection and try again."
const NO_MATCH =
  'No matching sale found. Check the receipt number or try searching by customer instead.'

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

async function responseError(response: Response, fallback: string) {
  try {
    const body = (await response.clone().json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

function money(value: number | string) {
  return Number(value).toFixed(2)
}

function ReturnsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shiftId = searchParams.get('shiftId')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [matches, setMatches] = useState<Sale[]>([])
  const [sale, setSale] = useState<Sale | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successAmount, setSuccessAmount] = useState<string | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  const selectedLines = useMemo(
    () =>
      sale?.lines
        .filter((line) => (quantities[line.id] ?? 0) > 0)
        .map((line) => ({
          saleLineItemId: line.id,
          quantity: quantities[line.id],
          amount: (Number(line.lineTotal) / line.quantity) * quantities[line.id],
        })) ?? [],
    [quantities, sale],
  )
  const refundTotal = selectedLines.reduce((sum, line) => sum + line.amount, 0)
  const originalPayments =
    sale?.payments.filter((payment) => payment.direction === 'payment') ?? []
  const originalMethods = [...new Set(originalPayments.map((payment) => payment.method))]

  function selectSale(selected: Sale) {
    setSale(selected)
    setSuccessAmount(null)
    setIsConfirmationOpen(false)
    setError(null)
    setQuantities(Object.fromEntries(selected.lines.map((line) => [line.id, 0])))
  }

  async function lookup(query: { receiptNumber?: string; customerSearch?: string }) {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setSale(null)
    setMatches([])
    const headers = await authHeader()
    const result = await apiClient.GET('/sales', { params: { query }, headers })
    setIsLoading(false)
    if (result.error) {
      setError(LOAD_ERROR)
      return
    }
    const found = result.data as Sale[]
    setMatches(found)
    if (found.length === 1) selectSale(found[0])
  }

  function updateQuantity(lineId: string, maximum: number, next: number) {
    setQuantities((current) => ({
      ...current,
      [lineId]: Math.max(0, Math.min(maximum, Math.floor(next || 0))),
    }))
  }

  function buildRefundPayments() {
    const positivePayments = originalPayments.filter((payment) => Number(payment.amount) > 0)
    const paidTotal = positivePayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    let assigned = 0
    return positivePayments.map((payment, index) => {
      const isLast = index === positivePayments.length - 1
      const amount = isLast
        ? refundTotal - assigned
        : Math.round((refundTotal * Number(payment.amount) * 100) / paidTotal) / 100
      assigned += amount
      return {
        method: payment.method,
        amount: money(amount),
        ...(payment.referenceCode ? { referenceCode: payment.referenceCode } : {}),
      }
    })
  }

  function requestRefund(event: FormEvent) {
    event.preventDefault()
    if (!sale || !shiftId || selectedLines.length === 0 || originalPayments.length === 0) return
    setError(null)
    setIsConfirmationOpen(true)
  }

  async function processRefund() {
    if (!sale || !shiftId || selectedLines.length === 0 || originalPayments.length === 0) return
    setIsSubmitting(true)
    setError(null)
    const headers = await authHeader()
    const result = await apiClient.POST('/returns', {
      body: {
        saleId: sale.id,
        shiftId,
        lines: selectedLines.map(({ saleLineItemId, quantity }) => ({
          saleLineItemId,
          quantity,
        })),
        refundPayments: buildRefundPayments(),
      },
      headers,
    })
    setIsSubmitting(false)
    if (result.error) {
      setError(await responseError(result.response, 'Could not process this refund.'))
      return
    }
    const response = (await result.response?.clone().json()) as ReturnResponse | undefined
    if (!response?.refundTotal) {
      setError('The refund was accepted, but its confirmed amount could not be read. Check the sale before retrying.')
      return
    }
    setSuccessAmount(response.refundTotal)
    setIsConfirmationOpen(false)
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-background p-6 md:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Returns</p>
        <h1 className="font-heading text-3xl font-semibold">Find the original bill</h1>
        <p className="mt-2 text-muted-foreground">
          Locate the receipt, choose only the items being returned, and refund the original tender.
        </p>
      </div>

      {!shiftId && (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between gap-4">
            An open shift is required before a return can be processed.
            <Button type="button" variant="outline" onClick={() => router.push('/shifts')}>
              Open a shift
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Sale lookup</CardTitle>
          <CardDescription>Search by receipt number or by the customer attached to the sale.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receipt">
            <TabsList>
              <TabsTrigger value="receipt">By receipt number</TabsTrigger>
              <TabsTrigger value="customer">By customer</TabsTrigger>
            </TabsList>
            <TabsContent value="receipt">
              <form
                className="mt-4 flex gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (receiptNumber.trim()) void lookup({ receiptNumber: receiptNumber.trim() })
                }}
              >
                <Input
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="Receipt number"
                />
                <Button disabled={!receiptNumber.trim() || isLoading}>Search</Button>
              </form>
            </TabsContent>
            <TabsContent value="customer">
              <form
                className="mt-4 flex gap-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (customerSearch.trim()) void lookup({ customerSearch: customerSearch.trim() })
                }}
              >
                <Input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Customer name, phone, or email"
                />
                <Button disabled={!customerSearch.trim() || isLoading}>Search</Button>
              </form>
            </TabsContent>
          </Tabs>

          {hasSearched && !isLoading && matches.length === 0 && !error && (
            <p className="mt-5 text-sm text-muted-foreground">{NO_MATCH}</p>
          )}
          {matches.length > 1 && !sale && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  className="rounded-xl border p-4 text-left transition hover:border-primary"
                  onClick={() => selectSale(match)}
                >
                  <span className="block font-semibold">{match.id}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(match.createdAt).toLocaleString()} · ₹{money(match.totalAmount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sale && (
        <form onSubmit={requestRefund}>
          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle>Select items to return</CardTitle>
              <CardDescription>Receipt {sale.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Return</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Original qty</TableHead>
                    <TableHead className="w-28">Return qty</TableHead>
                    <TableHead className="text-right">Estimated refund</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.lines.map((line) => {
                    const quantity = quantities[line.id] ?? 0
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Checkbox
                            checked={quantity > 0}
                            onCheckedChange={(checked) =>
                              updateQuantity(line.id, line.quantity, checked ? 1 : 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <span className="block font-medium">{line.variantId}</span>
                          <span className="text-xs text-muted-foreground">₹{money(line.unitPrice)} each</span>
                        </TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={line.quantity}
                            value={quantity}
                            onChange={(event) =>
                              updateQuantity(line.id, line.quantity, Number(event.target.value))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{money((Number(line.lineTotal) / line.quantity) * quantity)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="mt-6 rounded-xl border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">
                  Refund tender: {originalMethods.join(', ') || 'unavailable'}. The server validates the original sale, return entitlement, and final refund before anything is recorded.
                </p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Selected-line estimate
                    </p>
                    <p className="font-heading text-3xl font-bold text-[#DC2626]">₹{money(refundTotal)}</p>
                  </div>
                  <Button
                    disabled={
                      !shiftId ||
                      selectedLines.length === 0 ||
                      originalPayments.length === 0 ||
                      isSubmitting ||
                      Boolean(successAmount)
                    }
                  >
                    {isSubmitting ? 'Processing…' : 'Review refund'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {successAmount && sale && (
        <Alert className="mt-6 border-[#10B981] bg-[#E8F7F0]">
          <AlertDescription>
            <p className="font-semibold text-[#047857]">Refund of ₹{successAmount} recorded by the server.</p>
            <p className="mt-1">Return processed. Start a new sale to complete the exchange.</p>
            <Button
              className="mt-4"
              onClick={() =>
                router.push(sale.customerId ? `/checkout?customerId=${sale.customerId}` : '/checkout')
              }
            >
              Start new sale
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConfirmationOpen && sale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="refund-confirmation-title">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader>
              <CardTitle id="refund-confirmation-title">Confirm refund request</CardTitle>
              <CardDescription>
                Refund ₹{money(refundTotal)} for invoice {sale.id}? This sends the selected {selectedLines.length} line{selectedLines.length === 1 ? '' : 's'} to the server for validation, reverses the original tender ({originalMethods.join(', ')}), and returns approved units to stock.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsConfirmationOpen(false)}>Keep return open</Button>
              <Button type="button" disabled={isSubmitting} aria-busy={isSubmitting} onClick={() => void processRefund()}>
                {isSubmitting ? 'Processing refund…' : 'Confirm refund request'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background p-10">Loading returns…</main>}>
      <ReturnsPageInner />
    </Suspense>
  )
}
