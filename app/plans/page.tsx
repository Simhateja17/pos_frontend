'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import styles from '@/components/india-migration.module.css'
const DRAFT = 'couture.india.onboarding.unsent.selection'
const plans = [{ id:'starter', name:'Starter', monthly:'₹999', annual:'₹799', scope:'1 store · 2 counters', features:['GST-native billing & cart','UPI, card & cash payments','Inventory up to 2,000 SKUs','5 staff accounts','GST reports & export'] },{ id:'growth', name:'Growth', monthly:'₹2,499', annual:'₹1,999', scope:'Up to 3 stores · unlimited counters', features:['Everything in Starter','Loyalty, gift cards & CRM','Sales channels','AI Copilot','WhatsApp campaigns','Priority support'] },{ id:'enterprise', name:'Enterprise', monthly:'Custom', annual:'Custom', scope:'Unlimited stores & counters', features:['Everything in Growth','Unlimited AI queries','Custom report builder & API','Franchise management','Dedicated account manager'] }] as const
export default function PlansPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(true)
  const [selected, setSelected] = useState<'starter' | 'growth' | 'enterprise'>('growth')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT) ?? '{}')
    setAnnual(saved.billingCycle !== 'monthly')
    setSelected(saved.trialPlan ?? 'growth')
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const { data } = await apiClient.GET('/onboarding', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (data?.data[1]) {
        setSelected(data.data[1].trialPlan)
        setAnnual(data.data[1].billingCycle === 'annual')
      }
    })().catch(() => setMessage('Your saved plan will be loaded when the connection is available.'))
  }, [])

  /**
   * Records the chosen tier and goes straight to the app. Nothing is charged —
   * no billing gateway is integrated — and no tier gates any feature yet, so
   * this must not block the owner from reaching a working till.
   */
  async function beginTrial() {
    const billingCycle = annual ? 'annual' : 'monthly'
    const saved = JSON.parse(sessionStorage.getItem(DRAFT) ?? '{}')
    sessionStorage.setItem(DRAFT, JSON.stringify({ ...saved, trialPlan: selected, billingCycle }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await apiClient.PUT('/onboarding/steps/{step}', {
          params: { path: { step: 1 } },
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { trialPlan: selected, billingCycle },
        })
      }
    } catch {
      // The selection is already in sessionStorage; a failed save must not
      // strand the owner on the pricing page.
    }

    // Business type comes after the plan so the very first screens stay about
    // the account, and this one is skippable.
    router.push('/store-type')
  }

  return (
    <main className={styles.selectionPage}>
      <div className={styles.selectionCanvas}>
        <button className={styles.backButton} onClick={() => router.back()}>← Back</button>
        <header className={styles.selectionHeader}>
          <h1>Choose your plan.</h1>
          <p>No credit card required · 14-day free trial on any plan</p>
        </header>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.billingToggle}>
          <button className={!annual ? styles.toggleActive : ''} onClick={() => setAnnual(false)}>Monthly</button>
          <button className={annual ? styles.toggleActive : ''} onClick={() => setAnnual(true)}>Annual · Save 20%</button>
        </div>
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`${styles.planCard} ${selected === plan.id ? styles.planCardSelected : ''}`}
            >
              {plan.id === 'growth' && <span className={styles.popular}>Most popular</span>}
              <p className={styles.planName}>{plan.name}</p>
              <div className={styles.planPrice}>
                <strong>{annual ? plan.annual : plan.monthly}</strong>
                {plan.monthly !== 'Custom' && <span>/mo</span>}
                <p className={styles.planScope}>{plan.scope}</p>
              </div>
              <ul className={styles.featureList}>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </button>
          ))}
        </div>
        <button className={styles.primaryAction} onClick={beginTrial}>Start 14-day free trial →</button>
      </div>
    </main>
  )
}
