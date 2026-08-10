import createClient from 'openapi-fetch'
import type { paths } from './schema'

// In production this must stay same-origin. The Next rewrite in next.config.mjs
// forwards it to the backend while allowing the counter-device cookie to be
// first-party on www.ambelpos.com.
const apiBaseUrl =
  process.env.NODE_ENV === 'production'
    ? '/_backend'
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: 'include',
})

export const REGISTER_LOCKED_EVENT = 'ambel:register-locked'

export function notifyRegisterLocked() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem('registerLocked', 'true')
  window.sessionStorage.removeItem('operatorToken')
  window.dispatchEvent(new Event(REGISTER_LOCKED_EVENT))
}

// A 423 is an identity-state transition, not a generic network failure. Tell
// the app shell immediately so paired registers return to the PIN screen
// instead of leaving individual record pages to render misleading connection
// errors while retrying the same blocked request.
apiClient.use({
  onResponse({ response }) {
    if (response.status === 423) notifyRegisterLocked()
  },
})
