import type { components, paths } from './schema'
import { apiClient } from './client'
import { supabase } from '@/lib/supabase/client'

export type AppContext = components['schemas']['AppContext']
export type Dashboard = components['schemas']['Dashboard']
export type DashboardRange = components['schemas']['DashboardRange']
export type SaleList = components['schemas']['SaleList']
export type CustomerList = components['schemas']['CustomerList']
export type PaymentRead = components['schemas']['PaymentRead']
export type Supplier = components['schemas']['Supplier']
export type CreateSupplierRequest = components['schemas']['CreateSupplierRequest']
export type UpdateSupplierRequest = components['schemas']['UpdateSupplierRequest']
export type ReorderSuggestion = components['schemas']['ReorderSuggestion']
export type ReorderSuggestionList = components['schemas']['ReorderSuggestionList']
export type ReorderSkipped = components['schemas']['ReorderSkipped']
export type Product = components['schemas']['Product']
export type Variant = components['schemas']['Variant']
export type PurchaseOrder = components['schemas']['PurchaseOrder']
export type PurchaseOrderStatus = components['schemas']['PurchaseOrderStatus']
export type CreatePurchaseOrderRequest = components['schemas']['CreatePurchaseOrderRequest']
export type ReceivePurchaseOrderRequest = components['schemas']['ReceivePurchaseOrderRequest']
export type ReceiptResult = components['schemas']['ReceiptResult']
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

export function getAuthenticatedSuppliers(): Promise<Supplier[]> {
  return authenticatedRead(
    async () => apiClient.GET('/suppliers', { headers: await authorizationHeader() }),
    'Supplier records are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedSupplier(body: CreateSupplierRequest): Promise<Supplier> {
  return authenticatedRead(
    async () => apiClient.POST('/suppliers', { body, headers: await authorizationHeader() }),
    'That supplier could not be saved. Please retry.',
  )
}

export function updateAuthenticatedSupplier(supplierId: string, body: UpdateSupplierRequest): Promise<Supplier> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/suppliers/{supplierId}', {
        params: { path: { supplierId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That supplier could not be updated. Please retry.',
  )
}

export function getAuthenticatedReorderSuggestions(): Promise<ReorderSuggestionList> {
  return authenticatedRead(
    async () => apiClient.GET('/reorder/suggestions', { headers: await authorizationHeader() }),
    'Reorder suggestions are unavailable right now. Please retry.',
  )
}

export function generateAuthenticatedReorderSuggestions(): Promise<ReorderSuggestionList> {
  return authenticatedRead(
    async () => apiClient.POST('/reorder/generate', { headers: await authorizationHeader() }),
    'Reorder suggestions could not be recalculated. Please retry.',
  )
}

export function getAuthenticatedProducts(): Promise<Product[]> {
  return authenticatedRead(
    async () => apiClient.GET('/products', { headers: await authorizationHeader() }),
    'Your catalog is unavailable right now. Please retry.',
  )
}

export function getAuthenticatedPurchaseOrders(): Promise<PurchaseOrder[]> {
  return authenticatedRead(
    async () => apiClient.GET('/purchase-orders', { headers: await authorizationHeader() }),
    'Purchase orders are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedPurchaseOrder(body: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
  return authenticatedRead(
    async () => apiClient.POST('/purchase-orders', { body, headers: await authorizationHeader() }),
    'That purchase order could not be created. Please retry.',
  )
}

export function updateAuthenticatedPurchaseOrder(
  poId: string,
  body: { status?: 'sent' | 'cancelled'; expectedDate?: string; notes?: string },
): Promise<PurchaseOrder> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/purchase-orders/{poId}', {
        params: { path: { poId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That purchase order could not be updated. Please retry.',
  )
}

export function receiveAuthenticatedPurchaseOrder(
  poId: string,
  body: ReceivePurchaseOrderRequest,
): Promise<ReceiptResult> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/purchase-orders/{poId}/receive', {
        params: { path: { poId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That goods receipt could not be recorded. Please retry.',
  )
}
