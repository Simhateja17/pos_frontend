'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { authHeaders as sharedAuthHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { EntitlementUsagePanel } from './entitlement-usage-panel'
import styles from './subscription-checkout.module.css'
import { CurrencyMark } from '@/components/marketing/currency-mark'

type Region = 'IN' | 'INTL'
type Catalog = components['schemas']['BillingPlanCatalog']
type Plan = components['schemas']['BillingPlanOption']
type BillingStatus = components['schemas']['BillingStatus']
type Cycle = 'monthly' | 'annual'

type Props = {
  region: Region
  successPath: string
  title?: string
  subtitle?: string
  initialPlanKey?: string
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

async function authHeaders(): Promise<Record<string, string>> {
  const headers = await sharedAuthHeaders()
  if (!headers) throw new Error('Your session has expired. Sign in again to continue.')
  return headers
}

function money(minor: number, currency: string, region: Region): string {
  return new Intl.NumberFormat(region === 'IN' ? 'en-IN' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(minor / 100)
}

async function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Razorpay Checkout could not be loaded.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'))
    document.body.appendChild(script)
  })
  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable in this browser.')
}

function providerError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const message = (error as { error?: unknown }).error
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

export function SubscriptionCheckout({ region, successPath, title, subtitle, initialPlanKey }: Props) {
  const router = useRouter()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [cycle, setCycle] = useState<Cycle>('annual')
  const [selectedKey, setSelectedKey] = useState(initialPlanKey ?? 'growth')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [attemptKey, setAttemptKey] = useState<string | null>(null)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)

  const storageKeyFor = (planKey: string, billingCycle: Cycle) => `couture.billing.attempt.${region}.${planKey}.${billingCycle}`
  const attemptStorageKey = storageKeyFor(selectedKey, cycle)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const headers = await authHeaders()
        const { data, error: requestError } = await apiClient.GET('/billing/plans', {
          params: { query: { region } }, headers,
        })
        if (requestError || !data) throw new Error(providerError(requestError, 'We could not load the plans right now.'))
        if (!active) return
        setCatalog(data)
        if (!data.plans.some((plan) => plan.key === selectedKey)) setSelectedKey(data.plans[0]?.key ?? '')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'We could not load the plans right now.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [region])

  useEffect(() => {
    setAttemptKey(typeof window === 'undefined' ? null : window.sessionStorage.getItem(attemptStorageKey))
  }, [attemptStorageKey])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const headers = await authHeaders()
        const { data } = await apiClient.GET('/billing/status', { headers })
        if (active && data) setBillingStatus(data)
      } catch {
        // Status is advisory until checkout starts. A failed status request
        // should not block a new payment attempt.
      }
    })()
    return () => { active = false }
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
      const headers = await authHeaders()
      const status = billingStatus ?? await refreshBillingStatus(headers)
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
          throw new Error(providerError(onboarding.error, 'We could not load your onboarding status.'))
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
              throw new Error(providerError(selection.error, 'We could not save your plan selection.'))
            }
          }
        }
      }
      const { data, error: createError, response } = await apiClient.POST('/billing/subscription', {
        headers,
        body: { planKey: selected.key, billingCycle: cycle, idempotencyKey: currentAttemptKey },
      })
      if (createError || !data) {
        throw new Error(providerError(createError, response.status === 403 ? 'Only the account owner can start a subscription.' : 'We could not start this subscription.'))
      }

      await loadCheckoutScript()
      const Checkout = window.Razorpay
      if (!Checkout) throw new Error('Razorpay Checkout is unavailable in this browser.')
      const options: Record<string, unknown> = {
        key: data.razorpayKeyId,
        subscription_id: data.razorpaySubscriptionId,
        name: 'Ambel POS',
        description: `${selected.name} · ${cycle === 'annual' ? 'Annual' : 'Monthly'} subscription`,
        theme: { color: '#0058BA' },
        modal: {
          ondismiss: () => {
            setPaying(false)
            setMessage('Checkout was closed. You can reopen this payment or select another plan.')
          },
        },
        handler: async (checkout: CheckoutResponse) => {
          try {
            if (!checkout.razorpay_payment_id || !checkout.razorpay_subscription_id || !checkout.razorpay_signature) {
              throw new Error('Razorpay returned an incomplete payment response.')
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
            if (verify.error || !verify.data) throw new Error(providerError(verify.error, 'We could not verify the payment yet.'))
            if (verify.data.entitlement === 'active' || await waitForActive(headers)) {
              window.sessionStorage.removeItem(attemptStorageKey)
              router.push(successPath)
              return
            }
            setMessage('Payment received. We are waiting for Razorpay to confirm the subscription. This page is safe to refresh.')
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'We could not verify the payment yet. Please retry.')
          } finally {
            setPaying(false)
          }
        },
      }
      new Checkout(options).open()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not open secure checkout.')
      setPaying(false)
    }
  }

  return (
    <main className={styles.page}>
      <button type="button" className={styles.back} onClick={() => router.back()}>← Back</button>

      {/* Same hero treatment as the India /pricing page. */}
      <header className={`content-hero ${styles.hero}`}>
        <div className="section-tag">
          <CurrencyMark region={region} />
          Secure checkout
        </div>
        <h1>{title ?? <>Choose your <em>subscription plan.</em></>}</h1>
        <p>{subtitle ?? (region === 'IN' ? 'Choose a paid plan to activate your store. Prices include applicable GST.' : 'Choose a paid USD plan to activate your store. Taxes are shown separately where configured.')}</p>
        <div className={styles.mode} role="group" aria-label="Billing cycle">
          <button type="button" className={cycle === 'monthly' ? styles.active : ''} onClick={() => selectCycle('monthly')}>Monthly</button>
          <button type="button" className={cycle === 'annual' ? styles.active : ''} onClick={() => selectCycle('annual')}>Annual</button>
        </div>
      </header>

      <div className={styles.canvas}>
        {error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
        {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}
        {loading ? <p className={styles.message}>Loading plans…</p> : (
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
                      {plan.popular && <span className="price-popular">Most popular</span>}
                      {/* Order mirrors the marketing pricing grid: plan label, price,
                          billing note, then the one-line pitch above the features. */}
                      <div className="price-plan" style={plan.popular ? { color: 'rgba(255,255,255,.75)' } : undefined}>{plan.name}</div>
                      <div className="price-h">
                        <span className="price-now">
                          {money(planAmount, plan.currency, region)}
                          <span className="price-per" style={plan.popular ? { color: 'rgba(255,255,255,.7)' } : undefined}>/mo equivalent</span>
                        </span>
                      </div>
                      <div className="price-sub" style={{ marginBottom: 6, ...(plan.popular ? { color: 'rgba(255,255,255,.65)' } : {}) }}>
                        {cycle === 'annual' ? `Billed ${money(planQuote.totalAmountMinor, plan.currency, region)} annually · no annual discount` : 'Billed every month'}
                      </div>
                      <div className="price-sub" style={plan.popular ? { color: 'rgba(255,255,255,.65)' } : undefined}>{plan.description}</div>
                      <ul className="price-features" style={plan.popular ? { color: 'rgba(255,255,255,.9)' } : undefined}>
                        {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                      </ul>
                      {plan.addons.length > 0 && (
                        <ul className="price-features" aria-label="Available add-ons" style={plan.popular ? { color: 'rgba(255,255,255,.9)' } : undefined}>
                          {plan.addons.map((addon) => <li key={addon.key}>{addon.label}: {money(addon.unitAmountMinor, plan.currency, region)} / month</li>)}
                        </ul>
                      )}
                    </button>
                    {isSelected && (
                      <div className={styles.quote} aria-label="Payment summary">
                        <div className={styles.quoteRow}><span>{region === 'IN' ? 'Plan amount before GST' : 'Plan amount'}</span><strong>{money(planQuote.baseAmountMinor, plan.currency, region)}</strong></div>
                        <div className={styles.quoteRow}><span>{planQuote.taxLabel}</span><strong>{money(planQuote.taxAmountMinor, plan.currency, region)}</strong></div>
                        <div className={`${styles.quoteRow} ${styles.quoteTotal}`}><span>Total payable</span><strong>{money(planQuote.totalAmountMinor, plan.currency, region)}</strong></div>
                        {!plan.providerConfigured[cycle] && <p className={styles.providerNote}>This test plan is waiting for its Razorpay Plan ID. No payment can be opened until the backend configuration is supplied.</p>}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
            <div className={styles.enterprise}>Need a tailored rollout? <a href="mailto:sales@Ambel.in">Contact sales</a>.</div>
            <button type="button" className={styles.action} onClick={openCheckout} disabled={!selected || paying || (!available && !activeSelectedSubscription)}>
              {paying
                  ? activeSelectedSubscription ? 'Continuing...' : 'Opening secure checkout...'
                  : activeSelectedSubscription
                    ? 'Continue setup ->'
                    : `Pay ${quote ? money(quote.totalAmountMinor, selected?.currency ?? 'USD', region) : ''} and activate ->`}
            </button>
            <p className={styles.legal}>Your subscription is created only once per payment attempt. Razorpay handles the hosted payment, recurring charge receipts and invoices; Ambel POS unlocks access only after server verification.</p>
            <EntitlementUsagePanel region={region} status={billingStatus} />
          </>
        )}
      </div>
    </main>
  )
}
