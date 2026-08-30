export function checkoutPathWithOffer(region: 'IN' | 'INTL', offerId?: string | null): string {
  const query = `region=${region}`
  return offerId ? `/plans?${query}&offer=${encodeURIComponent(offerId)}` : `/plans?${query}`
}

export function billingCycleForCatalog(
  current: 'monthly' | 'annual',
  catalog: { privateOfferId?: string; billingCycle?: 'monthly' | 'annual' },
): 'monthly' | 'annual' {
  return catalog.privateOfferId && catalog.billingCycle ? catalog.billingCycle : current
}
