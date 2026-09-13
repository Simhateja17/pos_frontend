'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { authHeaders } from '@/lib/api/auth-headers'
import { getAuthenticatedBillingStatus, type BillingStatus } from '@/lib/api/authenticated-client'
import { Card, CardHead, CardPad, PageHead } from '@/components/couture/ui'
import { ErrorState, LoadingState } from '@/components/couture/states'
import { type MessageKey, type Translate, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

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

function trialDuration(minutes: number, t: Translate) {
  if (minutes % 1440 === 0) {
    return t(`billing.trial.${minutes === 1440 ? 'dayOne' : 'dayMany'}` as MessageKey, { count: minutes / 1440 })
  }
  if (minutes % 60 === 0) {
    return t(`billing.trial.${minutes === 60 ? 'hourOne' : 'hourMany'}` as MessageKey, { count: minutes / 60 })
  }
  return t(`billing.trial.${minutes === 1 ? 'minuteOne' : 'minuteMany'}` as MessageKey, { count: minutes })
}

export function OwnerBillingView({ region }: { region: 'IN' | 'INTL' }) {
  const t = useT()
  const { dateLocale, pack } = useAppRegion()
  const dateOnly = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: pack.timeZone })
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone })
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const headers = await authHeaders()
      if (!headers) throw new Error(t('billing.sessionExpired'))
      const [nextStatus, response] = await Promise.all([
        getAuthenticatedBillingStatus(),
        fetch(`${apiBase}/billing/private-offers`, { headers }),
      ])
      if (!response.ok) throw new Error(t('billing.privateOffersUnavailable'))
      const payload = await response.json() as { offers: Offer[] }
      setStatus(nextStatus); setOffers(payload.offers)
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('billing.unavailable')) }
    finally { setLoading(false) }
    // t is intentionally omitted: changing locale must not refetch billing data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState label={t('billing.loadingDetails')} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  const activeOffer = offers.find((offer) => offer.status === 'offered')
  const activeTrial = Boolean(status?.accessAllowed && status.entitlementSource === 'trial')
  return <>
    <PageHead title={t('billing.title')} sub={t('billing.subtitle')} />
    <Card><CardHead title={t('billing.currentAccess')} right={status?.accessAllowed ? t('billing.accessActive') : t('billing.paymentRequired')} /><CardPad>
      <p><strong>{status?.planKey ?? t('billing.noPaidPlan')}</strong>{status?.subscription ? <> · {t(`billing.billingCycle.${status.subscription.billingCycle}` as MessageKey)}</> : null}</p>
      <p>{t('billing.locations')} {status?.usage.locations ?? 0}/{String(status?.entitlements.maxLocations ?? '—')} · {t('billing.registers')} {status?.usage.activeRegisters ?? 0}/{String(status?.entitlements.maxActiveRegisters ?? '—')} · {t('billing.users')} {status?.usage.activeUsers ?? 0}/{String(status?.entitlements.maxActiveUsers ?? '—')}</p>
      {status?.subscription?.currentEndAt ? <p>{t('billing.currentPeriodEnds', { date: dateOnly.format(new Date(status.subscription.currentEndAt)) })}</p> : null}
    </CardPad></Card>
    {activeOffer ? <Card><CardHead title={t('billing.privateOffer')} right={t('billing.acceptBy', { date: dateTime.format(new Date(activeOffer.latestActivationAt)) })} /><CardPad>
      <h2 style={{ marginTop: 0 }}>{activeOffer.basePlanKey} · {t(`billing.billingCycle.${activeOffer.billingCycle}` as MessageKey)}</h2>
      <p>{t('billing.included', { locations: activeOffer.includedLocations, registers: activeOffer.includedRegisters, users: activeOffer.includedUsers })}</p>
      <p>{t('billing.planAmount', { amount: money(activeOffer.baseAmountMinor, activeOffer.currency), tax: money(activeOffer.taxAmountMinor, activeOffer.currency) })}</p>
      <p><strong>{t('billing.recurringTotal', { amount: money(activeOffer.totalAmountMinor, activeOffer.currency), cycle: activeOffer.billingCycle === 'monthly' ? t('billing.month') : t('billing.year') })}</strong></p>
      {activeOffer.trialDurationMinutes > 0 ? <p>{activeTrial ? t('billing.trialActive') : t('billing.trialStarts', { duration: trialDuration(activeOffer.trialDurationMinutes, t) })}</p> : null}
      <Link href={`/plans?region=${region}&offer=${activeOffer.id}`}>{activeTrial ? t('billing.reviewOffer') : t('billing.reviewAuthorize')}</Link>
    </CardPad></Card> : null}
    <Card><CardHead title={t('billing.paymentsInvoices')} /><CardPad><p>{t('billing.paymentsDescription')}</p></CardPad></Card>
  </>
}
