import { cookies, headers } from 'next/headers'

export type MarketingRegion = 'IN' | 'INTL'

export const REGION_COOKIE = 'ambel-region'

// Vercel populates x-vercel-ip-country for every request at the edge — no
// separate geolocation lookup needed. Anything other than a confirmed India
// hit defaults to International: showing an INR price to a Western visitor
// reads as a broken page, while showing a USD price to an Indian visitor
// before we know better just looks like normal "detecting your region"
// behaviour, and the switcher is right there to fix it either way.
export function detectRegion(): MarketingRegion {
  const cookieOverride = cookies().get(REGION_COOKIE)?.value
  if (cookieOverride === 'IN' || cookieOverride === 'INTL') return cookieOverride

  const countryHeader = headers().get('x-vercel-ip-country')
  return countryHeader === 'IN' ? 'IN' : 'INTL'
}
