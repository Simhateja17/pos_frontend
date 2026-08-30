import { adminSupabase as supabase } from '@/lib/supabase/client'

const apiBaseUrl =
  process.env.NODE_ENV === 'production'
    ? '/_backend'
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export type AdminRole = 'platform_owner' | 'support_admin' | 'read_only'
export type AdminRegion = 'IN' | 'INTL'

export type AdminIdentity = {
  id: string
  email: string
  displayName: string
  role: AdminRole
  region: AdminRegion
  status: 'invited' | 'active' | 'suspended'
}

export type AdminContext = {
  admin: AdminIdentity
  aal: 'aal1' | 'aal2'
  factors: Array<{ id: string; factor_type: string; status: string; friendly_name?: string | null }>
  hasTotp: boolean
  requiresMfaSetup: boolean
}

export type AdminOverview = {
  region: AdminRegion
  generatedAt: string
  signups: { totalTenants: number; activeTrials: number }
  subscriptions: { active: number; expired: number }
  activeMerchantUsers: number
  operationalFailures: { windowHours: number; emails: number; imports: number; forecasts: number }
}

export type TenantSearchResult = {
  id: string
  businessName: string
  tradeName: string | null
  country: string | null
  city: string | null
  createdAt: string
}

export type AdminTenantListResult = TenantSearchResult & {
  userCount?: number
  activeUserCount?: number
  subscriptionCount?: number
  activeSubscriptionCount?: number
  latestSubscriptionStatus?: string | null
}

export type TenantDetail = {
  tenant: {
    id: string
    businessName: string
    tradeName: string | null
    address: { city: string; state: string; country: string; postalCode: string }
    createdAt: string
  }
  stores: Array<{ id: string; name: string; city: string | null; country: string; isActive: boolean }>
  users: Array<{ id: string; name: string; email: string | null; role: string; isActive: boolean }>
  subscriptions: Array<Record<string, unknown>>
  billingTimeline: Array<Record<string, unknown>>
  entitlements: Array<Record<string, unknown>>
  operationalFailures: { emails: Array<Record<string, unknown>>; imports: Array<Record<string, unknown>>; forecasts: Array<Record<string, unknown>> }
}

export class AdminApiError extends Error {
  constructor(public readonly status: number, public readonly body: Record<string, unknown> | null, message?: string) {
    super(message ?? (typeof body?.error === 'string' ? body.error : 'Admin request failed'))
    this.name = 'AdminApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (authenticated) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new AdminApiError(401, { error: 'Admin authentication required' })
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, credentials: 'include' })
  } catch {
    throw new AdminApiError(0, null, 'The Admin Panel could not reach its regional backend')
  }
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('json') ? await response.json().catch(() => null) : null
  if (!response.ok) throw new AdminApiError(response.status, body)
  return body as T
}

export async function requestAdminOtp(email: string) {
  return request<{ ok: boolean }>('/admin/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) }, false)
}

export async function verifyAdminOtp(email: string, otp: string) {
  const result = await request<{
    admin: AdminIdentity
    session: { accessToken: string; refreshToken: string }
    aal: 'aal1'
    requiresMfaSetup: boolean
  }>('/admin/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) }, false)
  const { error } = await supabase.auth.setSession({ access_token: result.session.accessToken, refresh_token: result.session.refreshToken })
  if (error) throw new AdminApiError(401, { error: 'Could not establish the regional admin session' }, error.message)
  return result
}

export async function getAdminContext() {
  return request<AdminContext>('/admin/auth/context')
}

export async function adminLogout() {
  try {
    await request('/admin/auth/logout', { method: 'POST' })
  } finally {
    await supabase.auth.signOut({ scope: 'local' })
  }
}

export async function getAdminOverview() {
  return request<AdminOverview>('/admin/overview')
}

export async function searchAdminTenants(query: string) {
  return request<{ query: string; region: AdminRegion; total: number; results: TenantSearchResult[] }>(`/admin/tenants/search?q=${encodeURIComponent(query)}`)
}

export async function listRecentAdminTenants(options: { limit?: number; cursor?: number } = {}) {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 20),
    cursor: String(options.cursor ?? 0),
  })
  return request<{ region: AdminRegion; total: number; cursor: number; limit: number; results: AdminTenantListResult[] }>(`/admin/tenants/recent?${params}`)
}

export async function getAdminTenant(tenantId: string) {
  return request<TenantDetail>(`/admin/tenants/${encodeURIComponent(tenantId)}`)
}

export async function resendMerchantInvitation(tenantId: string) {
  return request<{ ok: boolean }>(`/admin/tenants/${encodeURIComponent(tenantId)}/invitation/resend`, { method: 'POST' })
}

export async function revokeMerchantSessions(tenantId: string) {
  return request<{ ok: boolean }>(`/admin/tenants/${encodeURIComponent(tenantId)}/sessions/revoke`, { method: 'POST' })
}

export async function getAdminTeam() {
  return request<{ admins: Array<AdminIdentity & { invitedAt: string; activatedAt: string | null; suspendedAt: string | null }>; region: AdminRegion }>('/admin/team')
}

export async function inviteAdmin(payload: { email: string; displayName: string; role: AdminRole }) {
  return request<{ admin: AdminIdentity }>('/admin/team/invite', { method: 'POST', body: JSON.stringify(payload) })
}

export async function suspendAdmin(adminId: string) {
  return request<{ admin: AdminIdentity }>(`/admin/team/${encodeURIComponent(adminId)}/suspend`, { method: 'POST' })
}

export async function activateAdmin(adminId: string) {
  return request<{ admin: AdminIdentity }>(`/admin/team/${encodeURIComponent(adminId)}/activate`, { method: 'POST' })
}

export async function resetAdminMfa(adminId: string, payload: { targetEmail: string; reason: string }) {
  return request<{ ok: boolean; requiresMfaSetup: boolean }>(`/admin/team/${encodeURIComponent(adminId)}/mfa/reset`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getAdminAudit(params: { format?: 'csv'; action?: string } = {}) {
  const search = new URLSearchParams()
  if (params.format) search.set('format', params.format)
  if (params.action) search.set('action', params.action)
  if (params.format === 'csv') {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const response = await fetch(`${apiBaseUrl}/admin/audit?${search}`, { headers: { Authorization: `Bearer ${token ?? ''}` }, credentials: 'include' })
    if (!response.ok) throw new AdminApiError(response.status, await response.json().catch(() => null))
    return response.text()
  }
  return request<{ events: Array<Record<string, unknown>> }>(`/admin/audit?${search}`)
}

export async function createSupportRequest(payload: { tenantId: string; ticketId: string; reason: string }) {
  return request<{ request: Record<string, unknown> }>('/admin/support/requests', { method: 'POST', body: JSON.stringify(payload) })
}

export async function listSupportRequests() {
  return request<{ requests: Array<Record<string, unknown>> }>('/admin/support/requests')
}

export async function startSupportSession(requestId: string) {
  return request<{ sessionToken: string; expiresAt: string; requestId: string }>(`/admin/support/requests/${encodeURIComponent(requestId)}/start`, { method: 'POST' })
}

export async function terminateSupportSession(requestId: string) {
  return request<{ request: Record<string, unknown> }>(`/admin/support/requests/${encodeURIComponent(requestId)}/terminate`, { method: 'POST' })
}

export async function getSupportTenant(requestId: string, sessionToken: string) {
  return request<Record<string, unknown>>(`/admin/support/sessions/${encodeURIComponent(requestId)}/tenant`, { headers: { 'X-Support-Session': sessionToken } }, false)
}

export async function createEntitlementOverride(payload: { tenantId: string; entitlementKey: string; overrideValue: number; justification: string; ticketId: string; expiresAt: string }) {
  return request<{ override: Record<string, unknown> }>('/admin/entitlement-overrides', { method: 'POST', body: JSON.stringify(payload) })
}

export async function retryAdminOperation(payload: { operationKind: string; operationId: string; idempotencyKey: string }) {
  return request<{ retry: Record<string, unknown> }>('/admin/operations/retry', { method: 'POST', body: JSON.stringify(payload) })
}

export async function enrollTotp(friendlyName = 'Ambel Admin') {
  const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName, issuer: 'Ambel POS' })
  if (result.error || !result.data) throw new AdminApiError(400, { error: result.error?.message ?? 'Could not start authenticator enrollment' })
  return result.data
}

export async function verifyTotp(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error || !challenge.data) throw new AdminApiError(400, { error: challenge.error?.message ?? 'Could not start authenticator challenge' })
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code })
  if (verified.error || !verified.data) throw new AdminApiError(401, { error: verified.error?.message ?? 'Invalid authenticator code' })
  const { error } = await supabase.auth.setSession({ access_token: verified.data.access_token, refresh_token: verified.data.refresh_token })
  if (error) throw new AdminApiError(401, { error: 'Could not refresh the administrator session' }, error.message)
  return verified.data
}

export async function getVerifiedTotpFactor() {
  const factors = await supabase.auth.mfa.listFactors()
  if (factors.error) throw new AdminApiError(401, { error: factors.error.message })
  return factors.data?.totp?.[0] ?? factors.data?.all.find((factor) => factor.factor_type === 'totp' && factor.status === 'verified') ?? null
}
