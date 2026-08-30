export function checkoutPathWithOffer(region: 'IN' | 'INTL', offerId?: string | null): string {
  const query = `region=${region}`
  return offerId ? `/plans?${query}&offer=${encodeURIComponent(offerId)}` : `/plans?${query}`
}
