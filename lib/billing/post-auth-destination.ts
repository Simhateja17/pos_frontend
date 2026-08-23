import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'

export const US_CHECKOUT_PATH = '/us/onboarding/1'
export const US_DASHBOARD_PATH = '/us/dashboard'

/**
 * How long the entitlement probe may take before we stop waiting on it.
 *
 * Bounding this is not a nicety. `authHeaders()` calls
 * `supabase.auth.getSession()`, which refreshes an expired access token over
 * the network, and `/billing/status` is a network call of its own — so on a
 * stale refresh token or an offline till this resolves in never, not in
 * milliseconds. An unbounded probe turns into a permanent "Checking your
 * subscription…" screen, which is a worse dead end than the one it fixes.
 */
const PROBE_TIMEOUT_MS = 2500

function timeout<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

async function probeEntitlement(): Promise<string> {
  const headers = await authHeaders()
  if (!headers) return US_CHECKOUT_PATH
  const { data } = await apiClient.GET('/billing/status', { headers })
  return data?.accessAllowed ? US_DASHBOARD_PATH : US_CHECKOUT_PATH
}

/**
 * Where an authenticated US operator belongs.
 *
 * Subscription checkout is the *first* onboarding step, not a permanent one.
 * Sending every sign-in to it stranded paying accounts on the plan picker:
 * the only action there is "pay", and POST /billing/subscription answers an
 * already-subscribed tenant with 409 "This account already has a
 * subscription", so the page offered no way forward at all.
 *
 * `accessAllowed` — not `entitlement === 'active'` — is the right test: it is
 * the same projection the backend's requireSubscription middleware enforces,
 * so the client's idea of "may use the app" stays identical to the server's,
 * renewal grace period included.
 *
 * Every failure mode (no session, failed request, slow network) falls back to
 * checkout: an account we cannot prove is entitled is one that still has to
 * pay, and that fallback is exactly the previous behaviour.
 */
export async function resolveUSPostAuthDestination(): Promise<string> {
  try {
    return await Promise.race([probeEntitlement(), timeout(US_CHECKOUT_PATH, PROBE_TIMEOUT_MS)])
  } catch {
    return US_CHECKOUT_PATH
  }
}
