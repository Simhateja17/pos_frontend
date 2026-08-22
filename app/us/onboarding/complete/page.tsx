'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { Card, CardPad } from '@/components/couture/ui'

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
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <Card style={{ maxWidth: 520, width: '100%' }}>
        <CardPad style={{ padding: 36, textAlign: 'center' }}>
          {/* `.lico b-green` is the design system's tinted icon tile. */}
          <div className="lico b-green" style={{ width: 52, height: 52, margin: '0 auto 16px' }}>
            <Check strokeWidth={2.4} />
          </div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-.025em' }}>Subscription confirmed</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 8 }}>{message}</p>
          <Link className="btn btn-pri" href="/us/dashboard" style={{ marginTop: 20 }}>
            Open dashboard →
          </Link>
        </CardPad>
      </Card>
    </main>
  )
}
