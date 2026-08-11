import { supabase } from '@/lib/supabase/client'
import { getActiveStoreId } from '@/lib/store-context'

/**
 * The headers every authenticated request needs.
 *
 * Two identities can be in play at once on a shared till: the long-lived
 * Supabase session the device is logged in with (Authorization), and the
 * cashier who has since PIN-switched into it (X-Operator-Token, minted by
 * POST /terminal/pin/switch).
 *
 * The PIN pad used to store that operator token and nothing ever sent it, so
 * a PIN-switch changed no server-side behaviour at all — every request still
 * read as the logged-in owner. Sending it here is what makes the switch real:
 * the backend's operatorContext middleware verifies it and populates
 * req.actingStaff, which requireRole and GET /context both prefer over the
 * session's own role.
 *
 * sessionStorage (not localStorage) is deliberate and matches where the PIN
 * pad writes it — the acting operator is scoped to this terminal tab and is
 * cleared on idle-timeout/logout.
 */
export async function authHeaders(): Promise<Record<string, string> | undefined> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return undefined

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

  const operatorToken =
    typeof window !== 'undefined' ? window.sessionStorage.getItem('operatorToken') : null
  if (operatorToken) headers['X-Operator-Token'] = operatorToken

  const storeId = getActiveStoreId()
  if (storeId) headers['X-Store-Id'] = storeId

  return headers
}
