'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { REGION_COOKIE, type MarketingRegion } from './region'

// A visitor who manually corrects the region is trusted over IP detection
// from then on — one year, same as a normal "remember my preference" cookie.
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setRegion(region: MarketingRegion, path: string) {
  cookies().set(REGION_COOKIE, region, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath(path)
}
