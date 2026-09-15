'use client'

// The checkout renders on the India pricing design system (.price-card et al),
// which lives in landing.css. Imported here, at the route, for the same reason
// /pricing does: the sheet carries a global reset that must not travel with the
// component into the app shell.
import '@/app/landing.css'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'

function PlansRouter() {
  const region = useSearchParams().get('region') === 'INTL' ? 'INTL' : 'IN'
  const offer = useSearchParams().get('offer') ?? undefined
  // Owners arriving from the mobile activation email go back to the app.
  const successPath = useSearchParams().get('return') === 'app' ? '/activate/complete' : '/store-type'
  return <SubscriptionCheckout region={region} successPath={successPath} privateOfferId={offer} />
}

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansRouter />
    </Suspense>
  )
}
