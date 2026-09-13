'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders as sharedAuthHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { billingCycleForCatalog, billingCyclesForCatalog } from '@/lib/billing/private-offer-path'
import styles from './subscription-checkout.module.css'
import { CurrencyMark } from '@/components/marketing/currency-mark'
import { type MessageKey, useT } from '@/lib/i18n/i18n'

type Region = 'IN' | 'INTL'
type Catalog = components['schemas']['BillingPlanCatalog'] & {
  privateOfferId?: string
  billingCycle?: Cycle
  trialDurationMinutes?: number
  latestActivationAt?: string
}
type Plan = components['schemas']['BillingPlanOption']
type BillingStatus = components['schemas']['BillingStatus']
type Cycle = 'monthly' | 'annual'

type Props = {
  region: Region
  successPath: string
  title?: string
  subtitle?: string
  initialPlanKey?: string
  privateOfferId?: string
}

type CheckoutResponse = {
  razorpay_payment_id?: string
  razorpay_subscription_id?: string
  razorpay_signature?: string
}

type RazorpayInstance = { open: () => void }
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

async function authHeaders(expiredMessage: string): Promise<Record<string, string>> {
  const headers = await sharedAuthHeaders()
  if (!headers) throw new Error(expiredMessage)
  return headers
}

function money(minor: number, currency: string, region: Region): string {
  return new Intl.NumberFormat(region === 'IN' ? 'en-IN' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(minor / 100)
}

async function loadCheckoutScript(scriptError: string, unavailable: string): Promise<void> {
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(scriptError)), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(scriptError))
    document.body.appendChild(script)
  })
  if (!window.Razorpay) throw new Error(unavailable)
}

function providerError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const message = (error as { error?: unknown }).error
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

export function SubscriptionCheckout({ region, successPath, title, subtitle, initialPlanKey, privateOfferId }: Props) {
  const t = useT()
  const router = useRouter()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [cycle, setCycle] = useState<Cycle>('annual')
  const [selectedKey, setSelectedKey] = useState(initialPlanKey ?? 'growth')
  const [resolvedPrivateOfferId, setResolvedPrivateOfferId] = useState<string | null>(privateOfferId ?? null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [attemptKey, setAttemptKey] = useState<string | null>(null)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [billingStatusLoading, setBillingStatusLoading] = useState(true)

  const storageKeyFor = (planKey: string, billingCycle: Cycle) => `couture.billing.attempt.${region}.${resolvedPrivateOfferId ?? 'standard'}.${planKey}.${billingCycle}`
  const attemptStorageKey = storageKeyFor(selectedKey, cycle)
  const visibleCycles = billingCyclesForCatalog({
    privateOfferId: resolvedPrivateOfferId,
    billingCycle: catalog?.billingCycle,
  })

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const headers = await authHeaders(t('billing.sessionExpired'))
        const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/_backend' : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/billing/plans?region=${region}${privateOfferId ? `&offer=${encodeURIComponent(privateOfferId)}` : ''}`, { headers })
        const data = response.ok ? await response.json() as Catalog : null
        const requestError = response.ok ? null : await response.json().catch(() => ({ error: t('billing.loadOffer') }))
        if (requestError || !data) throw new Error(providerError(requestError, t('billing.loadPlans')))
        if (!active) return
        setCatalog(data)
        setResolvedPrivateOfferId(data.privateOfferId ?? privateOfferId ?? null)
        setCycle((current) => billingCycleForCatalog(current, data))
        if (!data.plans.some((plan) => plan.key === selectedKey)) setSelectedKey(data.plans[0]?.key ?? '')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : t('billing.loadPlans'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
    // t is intentionally omitted: changing locale must not refetch the plan catalogue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, privateOfferId])

  useEffect(() => {
    // Route changes can replace a private-offer URL with the public catalogue
    // while this component remains mounted. Do not carry the old offer into a
    // later standard checkout attempt.
    setResolvedPrivateOfferId(privateOfferId ?? null)
  }, [privateOfferId])

  useEffect(() => {
    setAttemptKey(typeof window === 'undefined' ? null : window.sessionStorage.getItem(attemptStorageKey))
  }, [attemptStorageKey])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const headers = await authHeaders(t('billing.sessionExpired'))
        const { data } = await apiClient.GET('/billing/status', { headers })
        if (active && data) setBillingStatus(data)
      } catch {
        // Status is advisory until checkout starts. A failed status request
        // should not block a new payment attempt.
      } finally {
        if (active) setBillingStatusLoading(false)
      }
    })()
    return () => { active = false }
    // t is intentionally omitted: changing locale must not refetch billing status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region])

  const selected = useMemo<Plan | undefined>(() => catalog?.plans.find((plan) => plan.key === selectedKey), [catalog, selectedKey])
  const quote = selected?.[cycle]
  const available = Boolean(selected?.providerConfigured[cycle])
  const activeSelectedSubscription = Boolean(
    billingStatus?.accessAllowed
    && billingStatus.hasSubscription
    && billingStatus.planKey === selectedKey
    && (!billingStatus.subscription || billingStatus.subscription.billingCycle === cycle)
  )
  const activeTrial = Boolean(billingStatus?.accessAllowed && billingStatus.entitlementSource === 'trial')

  async function refreshBillingStatus(headers: Record<string, string>) {
    const { data } = await apiClient.GET('/billing/status', { headers })
    if (data) setBillingStatus(data)
    return data ?? null
  }

  function selectPlan(key: string) {
    if (typeof window !== 'undefined' && key !== selectedKey) {
      window.sessionStorage.removeItem(attemptStorageKey)
      window.sessionStorage.removeItem(storageKeyFor(key, cycle))
    }
    setSelectedKey(key)
    setAttemptKey(null)
    setMessage(null)
    setError(null)
  }

  function selectCycle(nextCycle: Cycle) {
    if (typeof window !== 'undefined' && nextCycle !== cycle) {
      window.sessionStorage.removeItem(attemptStorageKey)
      window.sessionStorage.removeItem(storageKeyFor(selectedKey, nextCycle))
    }
    setCycle(nextCycle)
    setAttemptKey(null)
    setMessage(null)
    setError(null)
  }

  async function waitForActive(headers: Record<string, string>) {
    for (let index = 0; index < 6; index += 1) {
      const { data } = await apiClient.GET('/billing/status', { headers })
      if (data?.entitlement === 'active') return true
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
    }
    return false
  }

  async function openCheckout() {
    if (!selected || !quote) return
    setError(null)
    setMessage(null)
    setPaying(true)
    try {
      const headers = await authHeaders(t('billing.sessionExpired'))
      const status = billingStatus ?? await refreshBillingStatus(headers)
      if (status?.accessAllowed && status.entitlementSource === 'trial') {
        router.push(region === 'IN' ? '/app' : '/us/dashboard')
        return
      }
      if (
        status?.accessAllowed
        && status.hasSubscription
        && status.planKey === selected.key
        && (!status.subscription || status.subscription.billingCycle === cycle)
      ) {
        router.push(successPath)
        return
      }
      const currentAttemptKey = attemptKey ?? crypto.randomUUID()
      setAttemptKey(currentAttemptKey)
      window.sessionStorage.setItem(attemptStorageKey, currentAttemptKey)
      if (region === 'IN') {
        // Persist the plan selection only for an unfinished onboarding record.
        // Once onboarding is complete, billing owns the new plan choice and the
        // old step-save endpoint correctly returns 409 for required steps. That
        // 409 must not prevent the actual Razorpay subscription request.
        const onboarding = await apiClient.GET('/onboarding', { headers })
        if (onboarding.error || !onboarding.data) {
          throw new Error(providerError(onboarding.error, t('billing.loadOnboarding')))
        }
        if (!onboarding.data.completed) {
          const selection = await apiClient.PUT('/onboarding/steps/{step}', {
            params: { path: { step: 1 } },
            headers,
            // onboarding_data.1 is a compatibility record. The subscription
            // row and its entitlement snapshot remain the authority for the
            // Starter/Growth/Pro keys.
            body: {
              trialPlan: selected.key === 'starter' ? 'starter' : selected.key === 'pro' ? 'pro' : 'growth',
              billingCycle: cycle,
            },
          })
          if (selection.error) {
            const alreadyComplete = selection.response.status === 409
              && providerError(selection.error, '') === 'Onboarding is already complete'
            if (!alreadyComplete) {
              throw new Error(providerError(selection.error, t('billing.savePlan')))
            }
          }
        }
      }
      const { data, error: createError, response } = await apiClient.POST('/billing/subscription', {
        headers,
        body: { planKey: selected.key, billingCycle: cycle, idempotencyKey: currentAttemptKey, ...(resolvedPrivateOfferId ? { privateOfferId: resolvedPrivateOfferId } : {}) } as never,
      })
      if (createError || !data) {
        throw new Error(providerError(createError, response.status === 403 ? t('billing.ownerOnly') : t('billing.startSubscription')))
      }

      await loadCheckoutScript(t('billing.checkoutScript'), t('billing.checkoutUnavailable'))
      const Checkout = window.Razorpay
      if (!Checkout) throw new Error(t('billing.checkoutUnavailable'))
      const options: Record<string, unknown> = {
        key: data.razorpayKeyId,
        subscription_id: data.razorpaySubscriptionId,
        name: 'Ambel POS',
        description: `${selected.name} · ${cycle === 'annual' ? 'Annual' : 'Monthly'} subscription`,
        theme: { color: '#0058BA' },
        modal: {
          ondismiss: () => {
            setPaying(false)
            setMessage(t('billing.checkoutClosed'))
          },
        },
        handler: async (checkout: CheckoutResponse) => {
          try {
            if (!checkout.razorpay_payment_id || !checkout.razorpay_subscription_id || !checkout.razorpay_signature) {
              throw new Error(t('billing.incompletePayment'))
            }
            const verify = await apiClient.POST('/billing/subscription/verify', {
              headers,
              body: {
                attemptId: data.attemptId,
                razorpayPaymentId: checkout.razorpay_payment_id,
                razorpaySubscriptionId: checkout.razorpay_subscription_id,
                razorpaySignature: checkout.razorpay_signature,
              },
            })
            if (verify.error || !verify.data) throw new Error(providerError(verify.error, t('billing.verifyPayment')))
            if (verify.data.entitlement === 'active' || await waitForActive(headers)) {
              window.sessionStorage.removeItem(attemptStorageKey)
              router.push(successPath)
              return
            }
            setMessage(t('billing.paymentReceived'))
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('billing.verifyPaymentRetry'))
          } finally {
            setPaying(false)
          }
        },
      }
      new Checkout(options).open()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('billing.openCheckout'))
      setPaying(false)
    }
  }

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => router.back()}>{t('billing.back')}</button>

      {/* Same hero treatment as the India /pricing page. */}
      <header className={`content-hero ${styles.hero}`}>
        <div className="section-tag">
          <CurrencyMark region={region} />
          {t('billing.secureCheckout')}
        </div>
        <h1>{title ?? <>{t('billing.chooseYour')} <em>{t('billing.subscriptionPlan')}</em></>}</h1>
        <p>{subtitle ?? (region === 'IN' ? t('billing.paidPlanIndia') : t('billing.paidPlanInternational'))}</p>
        <div className={styles.mode} role="group" aria-label={t('billing.billingCycleLabel')}>
          {visibleCycles.map((visibleCycle) => (
            <button
              key={visibleCycle}
              type="button"
              className={cycle === visibleCycle ? styles.active : ''}
              onClick={() => selectCycle(visibleCycle)}
              aria-pressed={cycle === visibleCycle}
            >
              {visibleCycle === 'monthly' ? t('billing.monthly') : t('billing.annual')}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.canvas}>
        {error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
        {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}
        {activeTrial && <p className={`${styles.message} ${styles.success}`} role="status">{t('billing.activeTrialMessage')}</p>}
        {loading ? <p className={styles.message}>{t('billing.loadingPlans')}</p> : (
          <>
            <div className={`pricing-grid ${styles.grid}`}>
              {catalog?.plans.map((plan) => {
                const planQuote = plan[cycle]
                const planAmount = cycle === 'annual' ? Math.round(planQuote.totalAmountMinor / 12) : planQuote.totalAmountMinor
                const isSelected = selectedKey === plan.key
                return (
                  <article
                    key={plan.key}
                    className={[
                      'price-card',
                      plan.popular ? 'featured' : '',
                      plan.popular ? styles.onFeatured : '',
                      isSelected ? (plan.popular ? styles.cardFeaturedSelected : styles.cardSelected) : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button type="button" className={styles.cardButton} onClick={() => selectPlan(plan.key)} aria-pressed={isSelected}>
                      {plan.popular && <span className="price-popular">{t('billing.mostPopular')}</span>}
                      {/* Order mirrors the marketing pricing grid: plan label, price,
                          billing note, then the one-line pitch above the features. */}
                      <div className="price-plan" style={plan.popular ? { color: 'rgba(255,255,255,.75)' } : undefined}>{plan.name}</div>
                      <div className="price-h">
                        <span className="price-now">
                          {money(planAmount, plan.currency, region)}
                          <span className="price-per" style={plan.popular ? { color: 'rgba(255,255,255,.7)' } : undefined}>{t('billing.perMonthEquivalent')}</span>
                        </span>
                      </div>
                      <div className="price-sub" style={{ marginBottom: 6, ...(plan.popular ? { color: 'rgba(255,255,255,.65)' } : {}) }}>
                        {cycle === 'annual' ? t('billing.billedAnnually', { amount: money(planQuote.totalAmountMinor, plan.currency, region) }) : t('billing.billedMonthly')}
                      </div>
                      <div className="price-sub" style={plan.popular ? { color: 'rgba(255,255,255,.65)' } : undefined}>{plan.description}</div>
                      <ul className="price-features" style={plan.popular ? { color: 'rgba(255,255,255,.9)' } : undefined}>
                        {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                      {plan.addons.length > 0 && (
                        <ul className="price-features" aria-label={t('billing.availableAddons')} style={plan.popular ? { color: 'rgba(255,255,255,.9)' } : undefined}>
                          {plan.addons.map((addon) => <li key={addon.key}>{addon.label}: {money(addon.unitAmountMinor, plan.currency, region)} {t('billing.perMonth')}</li>)}
                        </ul>
                      )}
                    </button>
                    {isSelected && (
                      <div className={styles.quote} aria-label={t('billing.paymentSummary')}>
                        <div className={styles.quoteRow}><span>{region === 'IN' ? t('billing.planAmountBeforeGst') : t('billing.planAmountPlain')}</span><strong>{money(planQuote.baseAmountMinor, plan.currency, region)}</strong></div>
                        <div className={styles.quoteRow}><span>{planQuote.taxLabel}</span><strong>{money(planQuote.taxAmountMinor, plan.currency, region)}</strong></div>
                        <div className={`${styles.quoteRow} ${styles.quoteTotal}`}><span>{t('billing.totalPayable')}</span><strong>{money(planQuote.totalAmountMinor, plan.currency, region)}</strong></div>
                        {!plan.providerConfigured[cycle] && <p className={styles.providerNote}>{t('billing.providerNote')}</p>}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
            <div className={styles.enterprise}>{t('billing.tailoredRollout')} <a href="mailto:support@ambelpos.com">{t('billing.contactSales')}</a>.</div>
            <button type="button" className={styles.action} onClick={openCheckout} disabled={!selected || paying || billingStatusLoading || (!available && !activeSelectedSubscription && !activeTrial)}>
              {paying
                  ? activeSelectedSubscription ? t('billing.continuing') : t('billing.openingCheckout')
                  : activeTrial
                    ? t('billing.continueLabel')
                    : activeSelectedSubscription
                    ? t('billing.continueSetup')
                    : t('billing.payActivate', { amount: quote ? money(quote.totalAmountMinor, selected?.currency ?? 'USD', region) : '' })}
            </button>
            <p className={styles.legal}>{t('billing.legal')}</p>
          </>
        )}
      </div>
    </main>
  )
}
