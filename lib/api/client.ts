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
