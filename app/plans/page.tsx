'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'

function PlansRouter() {
  const region = useSearchParams().get('region') === 'INTL' ? 'INTL' : 'IN'
  return <SubscriptionCheckout region={region} successPath="/store-type" />
}

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansRouter />
    </Suspense>
  )
}
