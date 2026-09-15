'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { Badge, Card, CardHead, CardPad, DataTable, KpiRow, Modal, PageHead, Seg, type BadgeTone } from '@/components/couture/ui'
import { EmptyState, ErrorState, LoadingState } from '@/components/couture/states'
import { loadCheckoutScript } from '@/components/billing/subscription-checkout'
import { type MessageKey, type Translate, useT } from '@/lib/i18n/i18n'
import { useAppRegion } from '@/lib/app-region'

type BillingStatus = components['schemas']['BillingStatus']
type Plan = components['schemas']['BillingPlanOption']
type InvoiceList = components['schemas']['BillingInvoiceList']
type Cycle = 'monthly' | 'annual'
type PlanAction = 'current' | 'subscribe' | 'upgrade' | 'downgrade' | 'renew'
type Checkout = { attemptId: string; razorpayKeyId: string; razorpaySubscriptionId: string }
type CheckoutResult = { razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string }

type Offer = {
  id: string; basePlanKey: string; billingCycle: Cycle; currency: string
  baseAmountMinor: number; taxAmountMinor: number; totalAmountMinor: number
  includedLocations: number; includedRegisters: number; includedUsers: number
  trialDurationMinutes: number; latestActivationAt: string; priceValidity: string; fixedBillingCycles: number | null; status: string
}

const LIVE_STATUSES = new Set(['active', 'authenticated', 'pending', 'halted'])
const apiBase = process.env.NODE_ENV === 'production' ? '/_backend' : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

function money(minor: number, currency: string) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100)
}

function monthlyEquivalent(plan: Plan, cycle: Cycle) {
  return cycle === 'annual' ? plan.annual.totalAmountMinor / 12 : plan.monthly.totalAmountMinor
}

function problem(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const message = (error as { error?: unknown }).error
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

function trialDuration(minutes: number, t: Translate) {
  if (minutes % 1440 === 0) return t(`billing.trial.${minutes === 1440 ? 'dayOne' : 'dayMany'}` as MessageKey, { count: minutes / 1440 })
  if (minutes % 60 === 0) return t(`billing.trial.${minutes === 60 ? 'hourOne' : 'hourMany'}` as MessageKey, { count: minutes / 60 })
  return t(`billing.trial.${minutes === 1 ? 'minuteOne' : 'minuteMany'}` as MessageKey, { count: minutes })
}

async function requireHeaders(t: Translate) {
  const headers = await authHeaders()
  if (!headers) throw new Error(t('billing.sessionExpired'))
  return headers
}

export function OwnerBillingView({ region }: { region: 'IN' | 'INTL' }) {
  const t = useT()
  const { dateLocale, pack } = useAppRegion()
  const dateOnly = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: pack.timeZone })
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: pack.timeZone })
  const formatDate = (iso: string | null | undefined) => (iso ? dateOnly.format(new Date(iso)) : '—')

  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [invoices, setInvoices] = useState<InvoiceList | null>(null)
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: BadgeTone; text: string } | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: 'plan'; plan: Plan; action: PlanAction } | { kind: 'cancel' } | { kind: 'discard' }>(null)

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    setError(null)
    try {
      const headers = await requireHeaders(t)
      const [statusResult, plansResult, offersResult, invoicesResult] = await Promise.all([
        apiClient.GET('/billing/status', { params: { query: { reconcile: '1' } }, headers }),
        apiClient.GET('/billing/plans', { params: { query: { region } }, headers }),
        // Not in the OpenAPI contract; the offer shape is owned by routes/billing.ts.
        fetch(`${apiBase}/billing/private-offers`, { headers }).then((response) => (response.ok ? response.json() as Promise<{ offers?: Offer[] }> : null)),
        apiClient.GET('/billing/invoices', { headers }),
      ])
      if (statusResult.error || !statusResult.data) throw new Error(problem(statusResult.error, t('billing.unavailable')))
      const nextStatus = statusResult.data
      setStatus(nextStatus)
      setPlans(plansResult.data?.plans ?? [])
      setOffers(offersResult?.offers ?? [])
      setInvoices(invoicesResult.data ?? { invoices: [], available: false })
      if (initial && nextStatus.subscription) setCycle(nextStatus.subscription.billingCycle)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('billing.unavailable'))
    } finally {
      if (initial) setLoading(false)
    }
    // t is intentionally omitted: changing locale must not refetch billing data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region])

  useEffect(() => { void load(true) }, [load])

  if (loading) return <LoadingState label={t('billing.loadingDetails')} />
  if (error || !status) return <ErrorState message={error ?? t('billing.unavailable')} onRetry={() => void load(true)} />

  const subscription = status.subscription
  const live = Boolean(subscription && LIVE_STATUSES.has(subscription.status))
  const pending = status.pendingChange
  const activeTrial = status.accessAllowed && status.entitlementSource === 'trial'
  const activeOffer = offers.find((offer) => offer.status === 'offered')
  const planName = (key: string) => plans.find((plan) => plan.key === key)?.name ?? key.charAt(0).toUpperCase() + key.slice(1)
  const cycleWord = (value: string) => (value === 'annual' ? t('billing.year') : t('billing.month'))
  const currentPlan = subscription ? plans.find((plan) => plan.key === subscription.planKey) : undefined

  const statusBadge: { tone: BadgeTone; label: string } = subscription?.cancelAtCycleEnd && live
    ? { tone: 'amber', label: t('billing.manage.statusCancelling') }
    : activeTrial
      ? { tone: 'blue', label: t('billing.manage.statusTrial') }
      : status.accessAllowed && status.graceUntil
        ? { tone: 'amber', label: t('billing.manage.statusGrace') }
        : status.accessAllowed
          ? { tone: 'green', label: t('billing.manage.statusActive') }
          : { tone: 'red', label: t('billing.manage.statusBlocked') }

  function actionFor(plan: Plan): PlanAction {
    if (!live || !subscription) return 'subscribe'
    if (subscription.cancelAtCycleEnd) return 'renew'
    if (subscription.planKey === plan.key && subscription.billingCycle === cycle) return 'current'
    if (!currentPlan) return 'upgrade'
    return monthlyEquivalent(plan, cycle) > monthlyEquivalent(currentPlan, subscription.billingCycle) ? 'upgrade' : 'downgrade'
  }

  async function authorise(checkout: Checkout, description: string, headers: Record<string, string>): Promise<boolean> {
    await loadCheckoutScript(t('billing.checkoutScript'), t('billing.checkoutUnavailable'))
    const Razorpay = window.Razorpay
    if (!Razorpay) throw new Error(t('billing.checkoutUnavailable'))
    return new Promise<boolean>((resolve, reject) => {
      new Razorpay({
        key: checkout.razorpayKeyId,
        subscription_id: checkout.razorpaySubscriptionId,
        name: 'Ambel POS',
        description,
        theme: { color: '#0058BA' },
        modal: { ondismiss: () => resolve(false) },
        handler: async (result: CheckoutResult) => {
          try {
            if (!result.razorpay_payment_id || !result.razorpay_subscription_id || !result.razorpay_signature) {
              throw new Error(t('billing.incompletePayment'))
            }
            const verify = await apiClient.POST('/billing/subscription/verify', {
              headers,
              body: {
                attemptId: checkout.attemptId,
                razorpayPaymentId: result.razorpay_payment_id,
                razorpaySubscriptionId: result.razorpay_subscription_id,
                razorpaySignature: result.razorpay_signature,
              },
            })
            if (verify.error) throw new Error(problem(verify.error, t('billing.verifyPayment')))
            resolve(true)
          } catch (cause) {
            reject(cause)
          }
        },
      }).open()
    })
  }

  async function startCheckout(plan: Plan | null, planKey: string, billingCycle: Cycle, action: PlanAction) {
    setBusy(true)
    setNotice(null)
    try {
      const headers = await requireHeaders(t)
      const body = { planKey, billingCycle, idempotencyKey: crypto.randomUUID() }
      const created = action === 'subscribe'
        ? await apiClient.POST('/billing/subscription', { headers, body })
        : await apiClient.POST('/billing/subscription/change', { headers, body })
      if (created.error || !created.data) {
        throw new Error(problem(created.error, created.response.status === 403 ? t('billing.ownerOnly') : t('billing.manage.changeFailed')))
      }
      const authorised = await authorise(created.data, `${plan?.name ?? planName(planKey)} · ${cycleWord(billingCycle)}`, headers)
      await load()
      if (!authorised) {
        setNotice({ tone: 'amber', text: t('billing.manage.checkoutDismissed') })
      } else {
        const startsAt = (created.data as { startsAt?: string | null }).startsAt ?? null
        setNotice({ tone: 'green', text: startsAt ? t('billing.manage.scheduled', { date: formatDate(startsAt) }) : t('billing.manage.done') })
      }
    } catch (cause) {
      setNotice({ tone: 'red', text: cause instanceof Error ? cause.message : t('billing.manage.changeFailed') })
    } finally {
      setBusy(false)
    }
  }

  async function runMutation(path: '/billing/subscription/cancel' | '/billing/subscription/change/cancel') {
    setBusy(true)
    setNotice(null)
    try {
      const headers = await requireHeaders(t)
      const result = path === '/billing/subscription/cancel'
        ? await apiClient.POST(path, { headers, body: { cancelAtCycleEnd: true } })
        : await apiClient.POST(path, { headers })
      if (result.error) throw new Error(problem(result.error, t('billing.unavailable')))
      await load()
    } catch (cause) {
      setNotice({ tone: 'red', text: cause instanceof Error ? cause.message : t('billing.unavailable') })
    } finally {
      setBusy(false)
    }
  }

  const kpis = [
    {
      label: t('billing.manage.planLabel'),
      value: live && subscription ? planName(subscription.planKey) : activeTrial ? t('billing.manage.statusTrial') : t('billing.noPaidPlan'),
      meta: live && subscription ? t(`billing.billingCycle.${subscription.billingCycle}` as MessageKey) : undefined,
    },
    { label: t('billing.manage.statusLabel'), value: <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge> },
    {
      label: subscription?.cancelAtCycleEnd ? t('billing.manage.endsLabel') : t('billing.manage.renewsLabel'),
      value: live ? formatDate(subscription?.currentEndAt) : '—',
    },
    {
      label: t('billing.manage.priceLabel'),
      value: live && subscription && currentPlan
        ? money(currentPlan[subscription.billingCycle].totalAmountMinor, currentPlan.currency)
        : '—',
      meta: live && subscription ? `/ ${cycleWord(subscription.billingCycle)}` : undefined,
    },
  ]

  const limitText = (value: number | 'unlimited' | undefined) => (value === 'unlimited' ? t('billing.usage.unlimited') : value ?? '—')
  const usageRows: Array<[string, number, number | 'unlimited']> = [
    [t('billing.locations'), status.usage.locations, status.entitlements.maxLocations],
    [t('billing.users'), status.usage.activeUsers, status.entitlements.maxActiveUsers],
    [t('billing.registers'), status.usage.activeRegisters, status.entitlements.maxActiveRegisters],
    [t('billing.usage.posTransactions'), status.usage.monthlyPosTransactions, status.entitlements.monthlyPosTransactions],
  ]

  const confirmCopy = (() => {
    if (!confirm) return null
    if (confirm.kind === 'cancel') {
      return { title: t('billing.manage.cancelConfirmTitle'), body: t('billing.manage.cancelConfirmBody', { date: formatDate(subscription?.currentEndAt) }), ok: t('billing.manage.cancelButton'), dismiss: t('billing.manage.keepPlan') }
    }
    if (confirm.kind === 'discard') {
      return { title: t('billing.manage.discardTitle'), body: t('billing.manage.discardBody', { plan: planName(pending?.planKey ?? '') }), ok: t('billing.manage.discardChange'), dismiss: t('billing.manage.notNow') }
    }
    const vars = {
      plan: confirm.plan.name,
      price: money(confirm.plan[cycle].totalAmountMinor, confirm.plan.currency),
      cycle: cycleWord(cycle),
      date: formatDate(subscription?.currentEndAt),
    }
    const key = { upgrade: 'Upgrade', downgrade: 'Downgrade', renew: 'Renew', subscribe: 'Subscribe', current: 'Subscribe' }[confirm.action]
    return {
      title: t(`billing.manage.confirm${key}Title` as MessageKey, vars),
      body: t(`billing.manage.confirm${key}Body` as MessageKey, vars),
      ok: t('billing.manage.continueToRazorpay'),
      dismiss: t('billing.manage.notNow'),
    }
  })()

  function confirmAction() {
    const current = confirm
    setConfirm(null)
    if (!current) return
    if (current.kind === 'cancel') void runMutation('/billing/subscription/cancel')
    else if (current.kind === 'discard') void runMutation('/billing/subscription/change/cancel')
    else void startCheckout(current.plan, current.plan.key, cycle, current.action)
  }

  return <>
    <PageHead title={t('billing.title')} sub={t('billing.subtitle')} />

    {notice ? <Card><CardPad><Badge tone={notice.tone}>{notice.text}</Badge></CardPad></Card> : null}

    <KpiRow items={kpis} />

    {subscription?.cancelAtCycleEnd && live ? (
      <Card><CardPad><p style={{ margin: 0 }}>{t('billing.manage.cancelScheduled', { date: formatDate(subscription.currentEndAt) })}</p></CardPad></Card>
    ) : null}

    {pending ? (
      <Card>
        <CardHead
          title={t(`billing.manage.pending${pending.kind === 'upgrade' ? 'Upgrade' : pending.kind === 'renewal' ? 'Renewal' : 'Downgrade'}` as MessageKey)}
          right={<Badge tone={pending.authorised ? 'green' : 'amber'}>{pending.authorised ? t('billing.manage.authorised') : t('billing.manage.awaitingAuthorisation')}</Badge>}
        />
        <CardPad>
          <p style={{ marginTop: 0 }}>
            {(() => {
              const vars = { plan: planName(pending.planKey), price: money(pending.totalAmountMinor, pending.currency), cycle: cycleWord(pending.billingCycle), date: formatDate(pending.startsAt) }
              if (!pending.authorised) return t('billing.manage.pendingUnauthorised', vars)
              return pending.startsAt ? t('billing.manage.pendingScheduled', vars) : t('billing.manage.pendingConfirming', vars)
            })()}
          </p>
          {!pending.authorised ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-pri" disabled={busy} onClick={() => void startCheckout(null, pending.planKey, pending.billingCycle, pending.kind === 'renewal' ? 'renew' : pending.kind)}>
                {t('billing.manage.continueAuthorisation')}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm({ kind: 'discard' })}>{t('billing.manage.discardChange')}</button>
            </div>
          ) : null}
        </CardPad>
      </Card>
    ) : null}

    {activeOffer ? (
      <Card>
        <CardHead title={t('billing.privateOffer')} right={t('billing.acceptBy', { date: dateTime.format(new Date(activeOffer.latestActivationAt)) })} />
        <CardPad>
          <p style={{ marginTop: 0 }}><strong>{planName(activeOffer.basePlanKey)} · {t(`billing.billingCycle.${activeOffer.billingCycle}` as MessageKey)}</strong></p>
          <p>{t('billing.included', { locations: activeOffer.includedLocations, registers: activeOffer.includedRegisters, users: activeOffer.includedUsers })}</p>
          <p>{t('billing.planAmount', { amount: money(activeOffer.baseAmountMinor, activeOffer.currency), tax: money(activeOffer.taxAmountMinor, activeOffer.currency) })}</p>
          <p><strong>{t('billing.recurringTotal', { amount: money(activeOffer.totalAmountMinor, activeOffer.currency), cycle: cycleWord(activeOffer.billingCycle) })}</strong></p>
          {activeOffer.trialDurationMinutes > 0 ? <p>{activeTrial ? t('billing.trialActive') : t('billing.trialStarts', { duration: trialDuration(activeOffer.trialDurationMinutes, t) })}</p> : null}
          <Link className="btn btn-pri" href={`/plans?region=${region}&offer=${activeOffer.id}`}>{activeTrial ? t('billing.reviewOffer') : t('billing.reviewAuthorize')}</Link>
        </CardPad>
      </Card>
    ) : null}

    <Card>
      <CardHead
        title={t('billing.manage.changeTitle')}
        sub={region === 'IN' ? t('billing.manage.changeSubIndia') : t('billing.manage.changeSubIntl')}
        right={<Seg items={[{ label: t('billing.monthly'), value: 'monthly' as Cycle }, { label: t('billing.annual'), value: 'annual' as Cycle }]} active={cycle} onSelect={setCycle} ariaLabel={t('billing.billingCycleLabel')} disabled={busy} />}
      />
      <CardPad>
        {plans.length === 0 ? (
          <EmptyState title={t('billing.loadPlans')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {plans.map((plan) => {
              const action = actionFor(plan)
              const configured = plan.providerConfigured[cycle]
              const disabled = busy || action === 'current' || Boolean(pending) || !configured
              return (
                <div key={plan.key} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 18, ...(action === 'current' ? { borderColor: 'var(--brand-1)' } : {}) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <strong style={{ fontSize: 16 }}>{plan.name}</strong>
                    {action === 'current' ? <Badge tone="blue">{t('billing.manage.currentPlan')}</Badge> : plan.popular ? <Badge tone="gold">{t('billing.mostPopular')}</Badge> : null}
                  </div>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>{money(plan[cycle].totalAmountMinor, plan.currency)}</span>
                    <span style={{ color: 'var(--ink-3, #64748b)' }}> / {cycleWord(cycle)}</span>
                  </div>
                  {plan.description ? <p style={{ margin: 0, color: 'var(--ink-3, #64748b)' }}>{plan.description}</p> : null}
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                    {plan.features.slice(0, 5).map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <button
                      type="button"
                      className={action === 'upgrade' || action === 'subscribe' || action === 'renew' ? 'btn btn-pri' : 'btn'}
                      style={{ width: '100%' }}
                      disabled={disabled}
                      onClick={() => setConfirm({ kind: 'plan', plan, action })}
                    >
                      {action === 'current' ? t('billing.manage.currentPlan') : t(`billing.manage.${action}` as MessageKey)}
                    </button>
                    {!configured && action !== 'current' ? <p style={{ margin: '6px 0 0', fontSize: 12 }}>{t('billing.manage.notConfigured')}</p> : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {pending ? <p style={{ margin: '12px 0 0' }}>{t('billing.manage.pendingBlocks')}</p> : null}
      </CardPad>
    </Card>

    <Card>
      <CardHead title={t('billing.manage.usageTitle')} sub={t('billing.manage.usageSub')} />
      <DataTable cols={[t('billing.manage.resource'), t('billing.manage.inUse'), t('billing.manage.limit')]}>
        {usageRows.map(([label, used, limit]) => (
          <tr key={label}>
            <td className="t-strong">{label}</td>
            <td className="num">{used}</td>
            <td className="num">{limitText(limit)}</td>
          </tr>
        ))}
      </DataTable>
    </Card>

    <Card>
      <CardHead title={t('billing.manage.invoicesTitle')} sub={t('billing.manage.invoicesSub')} />
      {!invoices?.available ? (
        <CardPad><p style={{ margin: 0 }}>{t('billing.manage.invoicesUnavailable')}</p></CardPad>
      ) : invoices.invoices.length === 0 ? (
        <EmptyState title={t('billing.manage.noInvoices')} body={t('billing.manage.noInvoicesBody')} />
      ) : (
        <DataTable cols={[t('billing.manage.invoiceDate'), t('billing.manage.invoicePlan'), t('billing.manage.invoiceAmount'), t('billing.manage.invoiceStatus'), '']}>
          {invoices.invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{formatDate(invoice.issuedAt)}</td>
              <td>{planName(invoice.planKey)}</td>
              <td className="num">{money(invoice.amountMinor, invoice.currency)}</td>
              <td><Badge tone={invoice.status === 'paid' ? 'green' : invoice.status === 'issued' ? 'amber' : 'grey'}>{invoice.status}</Badge></td>
              <td>{invoice.url ? <a className="btn btn-sm btn-ghost" href={invoice.url} target="_blank" rel="noreferrer">{t('billing.manage.viewInvoice')}</a> : null}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Card>

    {live && subscription && !subscription.cancelAtCycleEnd ? (
      <Card>
        <CardHead title={t('billing.manage.cancelTitle')} sub={t('billing.manage.cancelSub')} right={
          <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setConfirm({ kind: 'cancel' })}>{t('billing.manage.cancelButton')}</button>
        } />
      </Card>
    ) : null}

    {confirm && confirmCopy ? (
      <Modal
        title={confirmCopy.title}
        onClose={() => setConfirm(null)}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirm(null)}>{confirmCopy.dismiss}</button>
          <button type="button" className="btn btn-pri" onClick={confirmAction}>{confirmCopy.ok}</button>
        </>}
      >
        <p style={{ margin: 0 }}>{confirmCopy.body}</p>
      </Modal>
    ) : null}
  </>
}
