'use client'

import { SubscriptionCheckout } from '@/components/billing/subscription-checkout'

export default function PlansPage() {
  return <SubscriptionCheckout region="IN" successPath="/store-type" />
}
