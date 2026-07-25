import type { components, paths } from './schema'
import { apiClient } from './client'
import { supabase } from '@/lib/supabase/client'

export type AppContext = components['schemas']['AppContext']
export type Dashboard = components['schemas']['Dashboard']
export type DashboardRange = components['schemas']['DashboardRange']
export type SaleList = components['schemas']['SaleList']
export type CustomerList = components['schemas']['CustomerList']
export type PaymentRead = components['schemas']['PaymentRead']
export type SaleRecordQuery = NonNullable<paths['/sales/records']['get']['parameters']['query']>
export type CustomerRecordQuery = NonNullable<paths['/customers/records']['get']['parameters']['query']>
export type PaymentRecordQuery = NonNullable<paths['/sales/payments']['get']['parameters']['query']>

export class AuthenticatedRequestError extends Error {
  constructor(
    public readonly kind: 'unauthenticated' | 'forbidden' | 'network' | 'unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'AuthenticatedRequestError'
  }
}

async function authorizationHeader() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
  }

  return { Authorization: `Bearer ${session.access_token}` }
}

export async function getAuthenticatedAppContext(): Promise<AppContext> {
  try {
    const { data, error, response } = await apiClient.GET('/context', {
      headers: await authorizationHeader(),
    })

    if (response.status === 401) {
      throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    }

    if (response.status === 403) {
      throw new AuthenticatedRequestError('forbidden', 'Your account cannot access this store context.')
    }

    if (error || !data) {
      throw new AuthenticatedRequestError('unavailable', 'Store context is unavailable right now. Please retry.')
    }

    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error

    throw new AuthenticatedRequestError(
      'network',
      'We could not reach the store context. Check your connection and retry.',
    )
  }
}

export async function getAuthenticatedDashboard(range: DashboardRange): Promise<Dashboard> {
  try {
    const { data, error, response } = await apiClient.GET('/dashboard', {
      params: { query: { range } },
      headers: await authorizationHeader(),
    })

    if (response.status === 401) {
      throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    }

    if (response.status === 403) {
      throw new AuthenticatedRequestError('forbidden', 'Your account cannot access this dashboard.')
    }

    if (error || !data) {
      throw new AuthenticatedRequestError('unavailable', 'Current store data is unavailable right now. Please retry.')
    }

    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error

    throw new AuthenticatedRequestError(
      'network',
      'We could not reach current store data. Check your connection and retry.',
    )
  }
}

async function authenticatedRead<T>(
  request: () => Promise<{ data?: T; error?: unknown; response: Response }>,
  message: string,
): Promise<T> {
  try {
    const { data, error, response } = await request()
    if (response.status === 401) throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    if (response.status === 403) throw new AuthenticatedRequestError('forbidden', 'Your account cannot access these store records.')
    if (error || !data) throw new AuthenticatedRequestError('unavailable', message)
    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error
    throw new AuthenticatedRequestError('network', 'We could not reach store records. Check your connection and retry.')
  }
}

export function getAuthenticatedSales(query: SaleRecordQuery): Promise<SaleList> {
  return authenticatedRead(
    async () => apiClient.GET('/sales/records', { params: { query }, headers: await authorizationHeader() }),
    'Sales records are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedCustomers(query: CustomerRecordQuery): Promise<CustomerList> {
  return authenticatedRead(
    async () => apiClient.GET('/customers/records', { params: { query }, headers: await authorizationHeader() }),
    'Customer records are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedPayments(query: PaymentRecordQuery): Promise<PaymentRead> {
  return authenticatedRead(
    async () => apiClient.GET('/sales/payments', { params: { query }, headers: await authorizationHeader() }),
    'Payment records are unavailable right now. Please retry.',
  )
}
