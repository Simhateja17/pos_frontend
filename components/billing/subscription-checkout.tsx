'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import type { components } from '@/lib/api/schema'
import styles from './subscription-checkout.module.css'

type Region = 'IN' | 'US'
type Catalog = components['schemas']['BillingPlanCatalog']
type Plan = components['schemas']['BillingPlanOption']
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
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your session has expired. Sign in again to continue.')
  return { Authorization: `Bearer ${session.access_token}` }
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
  const [selectedKey, setSelectedKey] = useState(initialPlanKey ?? (region === 'IN' ? 'growth' : 'professional'))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [attemptKey, setAttemptKey] = useState<string | null>(null)

  const attemptStorageKey = `couture.billing.attempt.${region}.${selectedKey}.${cycle}`

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

  const selected = useMemo<Plan | undefined>(() => catalog?.plans.find((plan) => plan.key === selectedKey), [catalog, selectedKey])
  const quote = selected?.[cycle]
  const available = Boolean(selected?.providerConfigured[cycle])

  function selectPlan(key: string) {
    setSelectedKey(key)
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
      const currentAttemptKey = attemptKey ?? crypto.randomUUID()
      setAttemptKey(currentAttemptKey)
      window.sessionStorage.setItem(attemptStorageKey, currentAttemptKey)
      if (region === 'IN' && (selected.key === 'starter' || selected.key === 'growth')) {
        const selection = await apiClient.PUT('/onboarding/steps/{step}', {
          params: { path: { step: 1 } },
          headers,
          body: { trialPlan: selected.key, billingCycle: cycle },
        })
        if (selection.error) throw new Error(providerError(selection.error, 'We could not save your plan selection.'))
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
        name: 'Couture POS',
        description: `${selected.name} · ${cycle === 'annual' ? 'Annual' : 'Monthly'} subscription`,
        theme: { color: '#0f5ec7' },
        modal: { ondismiss: () => setMessage('Checkout was closed. Your payment attempt is saved; you can reopen it without creating a duplicate subscription.') },
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
      <div className={styles.canvas}>
        <button type="button" className={styles.back} onClick={() => router.back()}>← Back</button>
        <header className={styles.header}>
          <h1>{title ?? 'Choose your subscription plan.'}</h1>
          <p>{subtitle ?? (region === 'IN' ? 'Choose a paid plan to activate your store. Prices shown include applicable GST.' : 'Choose a paid USD plan to activate your store. Taxes are shown separately where configured.')}</p>
          <div className={styles.mode} role="group" aria-label="Billing cycle">
            <button type="button" className={cycle === 'monthly' ? styles.active : ''} onClick={() => { setCycle('monthly'); setAttemptKey(null) }}>Monthly</button>
            <button type="button" className={cycle === 'annual' ? styles.active : ''} onClick={() => { setCycle('annual'); setAttemptKey(null) }}>Annual</button>
          </div>
        </header>
        {error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
        {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}
        {loading ? <p className={styles.message}>Loading plans…</p> : (
          <>
            <div className={styles.grid}>
              {catalog?.plans.map((plan) => {
                const planQuote = plan[cycle]
                const planAmount = cycle === 'annual' ? Math.round(planQuote.totalAmountMinor / 12) : planQuote.totalAmountMinor
                return (
                  <article key={plan.key} className={`${styles.card} ${selectedKey === plan.key ? styles.cardSelected : ''}`}>
                    <button type="button" className={styles.cardButton} onClick={() => selectPlan(plan.key)} aria-pressed={selectedKey === plan.key}>
                      {plan.popular && <span className={styles.popular}>Most popular</span>}
                      <h2 className={styles.name}>{plan.name}</h2>
                      <p className={styles.description}>{plan.description}</p>
                      <div className={styles.price}><strong>{money(planAmount, plan.currency, region)}</strong><span>/mo equivalent</span></div>
                      <p className={styles.annualNote}>{cycle === 'annual' ? `Billed ${money(planQuote.totalAmountMinor, plan.currency, region)} annually` : 'Billed every month'}</p>
                      <ul className={styles.features}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                    </button>
                    {selectedKey === plan.key && <div className={styles.quote} aria-label="Payment summary">
                      <div className={styles.quoteRow}><span>{region === 'IN' ? 'Plan amount before GST' : 'Plan amount'}</span><strong>{money(planQuote.baseAmountMinor, plan.currency, region)}</strong></div>
                      <div className={styles.quoteRow}><span>{planQuote.taxLabel}</span><strong>{money(planQuote.taxAmountMinor, plan.currency, region)}</strong></div>
                      <div className={`${styles.quoteRow} ${styles.quoteTotal}`}><span>Total payable</span><strong>{money(planQuote.totalAmountMinor, plan.currency, region)}</strong></div>
                      {!plan.providerConfigured[cycle] && <p className={styles.providerNote}>This test plan is waiting for its Razorpay Plan ID. No payment can be opened until the backend configuration is supplied.</p>}
                    </div>}
                  </article>
                )
              })}
            </div>
            <div className={styles.enterprise}>Need a custom rollout? <a href="mailto:sales@couturepos.com">Contact sales for Enterprise</a>.</div>
            <button type="button" className={styles.action} onClick={openCheckout} disabled={!selected || !available || paying}>
              {paying ? 'Opening secure checkout…' : `Pay ${quote ? money(quote.totalAmountMinor, selected?.currency ?? 'USD', region) : ''} and activate →`}
            </button>
            <p className={styles.legal}>Your subscription is created only once per payment attempt. Razorpay handles the hosted payment, recurring charge receipts and invoices; Couture POS unlocks access only after server verification.</p>
          </>
        )}
      </div>
    </main>
  )
}
