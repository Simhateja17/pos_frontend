'use client'

// See app/plans/page.tsx: the subscription checkout is styled by landing.css,
// which is imported at the route rather than inside the component.
import '@/app/landing.css'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'
import { Card, CardPad } from '@/components/couture/ui'
import { resolveUSPostAuthDestination, US_DASHBOARD_PATH } from '@/lib/billing/post-auth-destination'

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <Card style={{ maxWidth: 520, width: '100%' }}>
        <CardPad style={{ padding: 36, textAlign: 'center' }}>{children}</CardPad>
      </Card>
    </main>
  )
}

export default function USOnboardingStepPage() {
  const params = useParams<{ step: string }>()
  const router = useRouter()
  // Checkout is the first onboarding step, so it stays reachable by direct
  // link and by the back button. An already-entitled tenant that lands here
  // has nothing to buy — POST /billing/subscription answers it with a 409 —
  // so send it on to the dashboard instead of rendering a dead-end plan
  // picker. 'checking' gates the first paint so entitled accounts never see
  // the checkout flash before the redirect.
  const [state, setState] = useState<'checking' | 'checkout'>('checking')

  useEffect(() => {
    if (params.step !== '1') return
    let active = true
    ;(async () => {
      const destination = await resolveUSPostAuthDestination()
      if (!active) return
      if (destination === US_DASHBOARD_PATH) router.replace(US_DASHBOARD_PATH)
      else setState('checkout')
    })()
    return () => { active = false }
  }, [params.step, router])

  if (params.step !== '1') {
    return (
      <Panel>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-.025em' }}>
          Payment is the first onboarding step.
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 8 }}>
          Complete or reopen the paid subscription checkout before continuing.
        </p>
        <Link className="btn btn-pri" href="/us/onboarding/1" style={{ marginTop: 20 }}>
          Return to subscription checkout →
        </Link>
      </Panel>
    )
  }

  if (state === 'checking') {
    return (
      <Panel>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>Checking your subscription…</p>
      </Panel>
    )
  }

  return <SubscriptionCheckout region="INTL" successPath="/us/onboarding/complete" />
}
