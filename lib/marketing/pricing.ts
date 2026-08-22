import type { MarketingRegion } from './region'

export type LiveAddon = {
  key: 'location' | 'register' | 'user'
  label: string
  unitAmountMinor: number
}

export type LivePlan = {
  key: string
  region: MarketingRegion
  currency: 'INR' | 'USD'
  name: string
  description: string
  popular: boolean
  features: string[]
  entitlements: {
    maxLocations: number | 'unlimited'
    maxActiveUsers: number | 'unlimited'
    maxActiveRegisters: number | 'unlimited'
  }
  addons: LiveAddon[]
  monthly: { totalAmountMinor: number; taxMode: 'included' | 'exclusive'; taxLabel: string }
  annual: { totalAmountMinor: number; taxMode: 'included' | 'exclusive'; taxLabel: string }
}

// Server-only: the marketing site stays one deployment covering both
// regions, so it needs both backends reachable, not the single build-time
// BACKEND_API_URL the authenticated app's client-side rewrite uses. Both
// fall back to the one live backend until the India/International VM split
// (Phase 3, still in progress) actually stands up a second one.
function backendUrlFor(region: MarketingRegion): string {
  const fallback = 'https://posbackend.withcouture.me/api'
  const url = region === 'IN'
    ? process.env.BACKEND_API_URL_IN ?? fallback
    : process.env.BACKEND_API_URL_INTL ?? fallback
  return url.replace(/\/$/, '')
}

export async function getLivePlans(region: MarketingRegion): Promise<LivePlan[]> {
  const url = `${backendUrlFor(region)}/public/plans?region=${region}`
  const response = await fetch(url, { next: { revalidate: 300 } })
  if (!response.ok) throw new Error(`Pricing fetch failed: ${response.status}`)
  const body = await response.json() as { plans: LivePlan[] }
  return body.plans
}
