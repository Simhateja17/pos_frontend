'use client'

import { useParams } from 'next/navigation'
import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'

export default function USOnboardingStepPage() {
  const params = useParams<{ step: string }>()
  if (params.step !== '1') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <h1>Payment is the first onboarding step.</h1>
          <p>Complete or reopen the paid subscription checkout before continuing.</p>
          <a href="/us/onboarding/1">Return to subscription checkout →</a>
        </div>
      </main>
    )
  }
  return <SubscriptionCheckout region="US" successPath="/us/onboarding/complete" />
}
