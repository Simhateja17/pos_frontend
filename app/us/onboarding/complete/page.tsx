'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'

export default function USOnboardingCompletePage() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your subscription…')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('Your session has expired. Sign in again.')
        const { data } = await apiClient.GET('/billing/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (!data?.accessAllowed || data.entitlement !== 'active') {
          router.replace('/us/onboarding/1')
          return
        }
        if (active) setMessage('Your subscription is active. Your US store account is ready.')
      } catch (cause) {
        if (active) setMessage(cause instanceof Error ? cause.message : 'We could not confirm the subscription.')
      }
    })()
    return () => { active = false }
  }, [router])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
      <section style={{ maxWidth: 560, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 36, textAlign: 'center', boxShadow: '0 12px 36px rgba(15,23,42,.08)' }}>
        <div style={{ fontSize: 42, color: '#0f9f6e' }}>✓</div>
        <h1>Subscription confirmed</h1>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>{message}</p>
        <Link href="/us/dashboard" style={{ display: 'inline-block', marginTop: 16, padding: '12px 18px', borderRadius: 10, color: '#fff', background: '#0f5ec7', fontWeight: 700 }}>Open dashboard →</Link>
      </section>
    </main>
  )
}
