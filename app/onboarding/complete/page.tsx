'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ONBOARDING_STEPS } from '@/components/onboarding/onboarding-wizard'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import type { components } from '@/lib/api/schema'
import styles from './complete.module.css'

type Completion = components['schemas']['OnboardingCompletionResponse']

async function headers() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your session has expired. Sign in again to continue.')
  return { Authorization: `Bearer ${session.access_token}` }
}

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [message, setMessage] = useState('Confirming your saved setup…')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const auth = await headers()
        const state = await apiClient.GET('/onboarding', { headers: auth })
        if (!state.data) throw new Error('We could not load your saved setup.')
        if (!state.data.completed && !state.data.requiredStepsComplete) {
          router.replace(`/onboarding/${Math.max(1, state.data.currentStep + 1)}`)
          return
        }
        const { data, error, response } = await apiClient.POST('/onboarding/complete', { headers: auth, body: {} })
        if (response.status === 409) {
          router.replace(`/onboarding/${Math.max(1, state.data.currentStep + 1)}`)
          return
        }
        if (error || !data) throw new Error('We could not confirm your setup. Please retry.')
        if (active) setCompletion(data)
      } catch (cause) {
        if (active) setMessage(cause instanceof Error ? cause.message : 'We could not confirm your setup. Please retry.')
      }
    })()
    return () => { active = false }
  }, [retry, router])

  if (!completion) return <main className={styles.page}><div><p>{message}</p><button className={styles.retry} onClick={() => setRetry((value) => value + 1)}>Retry confirmation</button></div></main>

  const rows: [string, string][] = ([
    ['Business', completion.summary.businessName], ['Store', completion.summary.storeName], ['Category', completion.summary.storeCategory], ['Plan', completion.summary.trialPlan], ['Billing counters', completion.summary.billingCounters], ['GST registration', completion.summary.gstStatus],
  ] as [string, string | null][]).filter((row): row is [string, string] => row[1] !== null)
  const pending = completion.pendingSteps
  return <main className={styles.page}><div className={styles.canvas}><div className={styles.check}>✓</div><h1 className={styles.title}>Your store is ready!</h1><p className={styles.subtitle}>Your server-confirmed configuration is ready for your team.</p><div className={styles.summary}>{rows.map(([label, value]) => <div key={label} className={styles.row}><span>{label}</span><strong>{value}</strong></div>)}</div>{pending.length > 0 && <div className={styles.summary}>{pending.map((number) => <div key={number} className={styles.row}><span>{ONBOARDING_STEPS[number - 1].tag}</span><Link href={`/onboarding/${number}`}>Finish later →</Link></div>)}</div>}<Link href="/app/dashboard" className={styles.launch}>Launch Dashboard →</Link><Link href="/onboarding/1" className={styles.review}>Review setup again</Link></div></main>
}
