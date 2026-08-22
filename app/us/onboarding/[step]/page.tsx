'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'
import { Card, CardPad } from '@/components/couture/ui'

export default function USOnboardingStepPage() {
  const params = useParams<{ step: string }>()

  if (params.step !== '1') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
        <Card style={{ maxWidth: 520, width: '100%' }}>
          <CardPad style={{ padding: 36, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-.025em' }}>
              Payment is the first onboarding step.
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 8 }}>
              Complete or reopen the paid subscription checkout before continuing.
            </p>
            <Link className="btn btn-pri" href="/us/onboarding/1" style={{ marginTop: 20 }}>
              Return to subscription checkout →
            </Link>
          </CardPad>
        </Card>
      </main>
    )
  }

  return <SubscriptionCheckout region="US" successPath="/us/onboarding/complete" />
}
