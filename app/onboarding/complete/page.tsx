'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import type { components } from '@/lib/api/schema'

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
        if (!state.data.completed && state.data.currentStep < 8) {
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

  if (!completion) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#030912] via-[#06337A] to-[#0058BA] p-5 text-center text-white"><div><p>{message}</p><button className="mt-4 underline" onClick={() => setRetry((value) => value + 1)}>Retry confirmation</button></div></main>

  const rows = [
    ['Business', completion.summary.businessName], ['Store', completion.summary.storeName], ['Category', completion.summary.storeCategory], ['Plan', completion.summary.trialPlan], ['Billing counters', completion.summary.billingCounters], ['GST registration', completion.summary.gstStatus],
  ]
  return <main className="grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-[#030912] via-[#06337A] to-[#0058BA] p-5 text-white"><div className="w-full max-w-2xl text-center"><div className="mx-auto grid size-20 place-items-center rounded-full border-2 border-emerald-400/50 bg-emerald-400/10 text-4xl text-emerald-300">✓</div><h1 className="mt-8 font-heading text-4xl font-bold">Your store is ready!</h1><p className="mt-3 text-lg text-white/65">Your server-confirmed configuration is ready for your team.</p><div className="mt-9 rounded-2xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-6 border-b border-white/10 py-4 last:border-0"><span className="text-white/55">{label}</span><strong>{value}</strong></div>)}</div><Link href="/app/dashboard" className="mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-white font-bold text-[#0058BA]">Launch Dashboard →</Link><Link href="/onboarding/1" className="mt-4 inline-block text-sm text-white/50">Review setup again</Link></div></main>
}
