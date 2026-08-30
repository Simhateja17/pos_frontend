import { authHeaders } from '@/lib/api/auth-headers'
export { checkoutPathWithOffer } from './private-offer-path'

const apiBase = process.env.NODE_ENV === 'production'
  ? '/_backend'
  : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

type PrivateOfferPayload = {
  offers?: Array<{ id?: unknown; status?: unknown }>
}

/**
 * Return the currently offered negotiated plan, if one exists. This is used
 * only while routing a blocked account to checkout; the full offer remains
 * owner-only and is loaded by the billing page/checkout itself.
 */
export async function getAuthenticatedPrivateOfferId(): Promise<string | null> {
  try {
    const headers = await authHeaders()
    if (!headers) return null
    const response = await fetch(`${apiBase}/billing/private-offers`, { headers })
    if (!response.ok) return null
    const payload = await response.json() as PrivateOfferPayload
    const offer = payload.offers?.find((candidate) => candidate.status === 'offered' && typeof candidate.id === 'string')
    return typeof offer?.id === 'string' ? offer.id : null
  } catch {
    return null
  }
}
