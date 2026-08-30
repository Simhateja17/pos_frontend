'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedBillingStatus, type BillingStatus } from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'

type Offer = {
  id: string; basePlanKey: string; billingCycle: 'monthly' | 'annual'; currency: string
  baseAmountMinor: number; taxAmountMinor: number; totalAmountMinor: number
  includedLocations: number; includedRegisters: number; includedUsers: number
  trialDurationMinutes: number; latestActivationAt: string; priceValidity: string; fixedBillingCycles: number | null; status: string
}

const apiBase = process.env.NODE_ENV === 'production' ? '/_backend' : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

function money(minor: number, currency: string) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(minor / 100)
}

function trialDuration(minutes: number) {
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'}`
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export function OwnerBillingView({ region }: { region: 'IN' | 'INTL' }) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const headers = await authHeaders()
      if (!headers) throw new Error('Your session has expired.')
      const [nextStatus, response] = await Promise.all([
        getAuthenticatedBillingStatus(),
        fetch(`${apiBase}/billing/private-offers`, { headers }),
      ])
      if (!response.ok) throw new Error('Private offers are unavailable right now.')
      const payload = await response.json() as { offers: Offer[] }
      setStatus(nextStatus); setOffers(payload.offers)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Billing is unavailable right now.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState label="Loading subscription details…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  const activeOffer = offers.find((offer) => offer.status === 'offered')
  const activeTrial = Boolean(status?.accessAllowed && status.entitlementSource === 'trial')
  return <>
    <PageHead title="Plan & subscription" sub="See what your plan includes, review private offers, and manage payment without changing day-to-day POS billing." />
    <Card><CardHead title="Current access" right={status?.accessAllowed ? 'Access active' : 'Payment required'} /><CardPad>
      <p><strong>{status?.planKey ?? 'No paid plan'}</strong>{status?.subscription ? ` · ${status.subscription.billingCycle}` : ''}</p>
      <p>Locations {status?.usage.locations ?? 0}/{String(status?.entitlements.maxLocations ?? '—')} · Registers {status?.usage.activeRegisters ?? 0}/{String(status?.entitlements.maxActiveRegisters ?? '—')} · Users {status?.usage.activeUsers ?? 0}/{String(status?.entitlements.maxActiveUsers ?? '—')}</p>
      {status?.subscription?.currentEndAt ? <p>Current billing period ends {new Date(status.subscription.currentEndAt).toLocaleDateString()}.</p> : null}
    </CardPad></Card>
    {activeOffer ? <Card><CardHead title="Your private offer" right={`Accept by ${new Date(activeOffer.latestActivationAt).toLocaleString()}`} /><CardPad>
      <h2 style={{ marginTop: 0 }}>{activeOffer.basePlanKey} · {activeOffer.billingCycle}</h2>
      <p>{activeOffer.includedLocations} locations · {activeOffer.includedRegisters} registers · {activeOffer.includedUsers} users</p>
      <p>Plan amount {money(activeOffer.baseAmountMinor, activeOffer.currency)} + tax {money(activeOffer.taxAmountMinor, activeOffer.currency)}</p>
      <p><strong>Recurring total: {money(activeOffer.totalAmountMinor, activeOffer.currency)} / {activeOffer.billingCycle === 'monthly' ? 'month' : 'year'}</strong></p>
      {activeOffer.trialDurationMinutes > 0 ? <p>{activeTrial ? 'Your free trial is active. No payment is due until the trial ends.' : `Your ${trialDuration(activeOffer.trialDurationMinutes)} trial starts on your first successful login before the activation deadline.`}</p> : null}
      <Link href={`/plans?region=${region}&offer=${activeOffer.id}`}>{activeTrial ? 'Review offer (no payment due now)' : 'Review and authorise with Razorpay'}</Link>
    </CardPad></Card> : null}
    <Card><CardHead title="Payments and invoices" /><CardPad><p>Razorpay sends recurring payment receipts and invoices to the authorised owner. Detailed Ambel payment history will appear here as provider transactions are recorded.</p></CardPad></Card>
  </>
}
