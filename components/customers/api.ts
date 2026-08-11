import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'

export type Customer = {
  id: string
  name: string | null
  billingName: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateCode: string | null
  postalCode: string | null
  country: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerList = {
  items: Customer[]
  total: number
  nextCursor: string | null
}

export type CustomerPurchase = {
  id: string
  documentId: string | null
  documentNumber: string | null
  documentType: string | null
  date: string
  store: { id: string; name: string } | null
  total: string
  status: string
  paymentMethods: string[]
}

export type CustomerPurchaseList = {
  items: CustomerPurchase[]
  total: number
  nextCursor: string | null
}

export type CustomerWrite = {
  billingName?: string | null
  phone?: string | null
  email?: string | null
  gstin?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  stateCode?: string | null
  postalCode?: string | null
  country?: string | null
  notes?: string | null
}

export class CustomerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'CustomerApiError'
  }
}

const untypedApiClient = apiClient as any

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error.error
  }
  return fallback
}

async function headersOrThrow(): Promise<Record<string, string>> {
  const headers = await authHeaders()
  if (!headers) throw new CustomerApiError(401, 'Your session has expired. Sign in again to continue.')
  return headers
}

async function read<T>(request: () => Promise<{ data?: T; error?: unknown; response: Response }>, fallback: string): Promise<T> {
  const result = await request()
  if (result.error || !result.data) {
    throw new CustomerApiError(result.response.status, errorMessage(result.error, fallback))
  }
  return result.data
}

export function getCustomerRecords(search?: string, cursor?: string): Promise<CustomerList> {
  return read(
    async () => untypedApiClient.GET('/customers/records', {
      params: { query: { search: search || undefined, cursor, limit: 25 } },
      headers: await headersOrThrow(),
    }),
    'Customer records are unavailable right now. Please retry.',
  )
}

export function getCustomer(customerId: string): Promise<Customer> {
  return read(
    async () => untypedApiClient.GET('/customers/{customerId}', {
      params: { path: { customerId } },
      headers: await headersOrThrow(),
    }),
    'This customer profile is unavailable right now. Please retry.',
  )
}

export function createCustomer(body: CustomerWrite): Promise<Customer> {
  return read(
    async () => untypedApiClient.POST('/customers', { body, headers: await headersOrThrow() }),
    'That customer could not be saved. Please retry.',
  )
}

export function updateCustomer(customerId: string, body: CustomerWrite): Promise<Customer> {
  return read(
    async () => untypedApiClient.PATCH('/customers/{customerId}', {
      params: { path: { customerId } },
      body,
      headers: await headersOrThrow(),
    }),
    'That customer could not be saved. Please retry.',
  )
}

export function getCustomerPurchases(customerId: string, cursor?: string): Promise<CustomerPurchaseList> {
  return read(
    async () => untypedApiClient.GET('/customers/{customerId}/purchases', {
      params: { path: { customerId }, query: { cursor, limit: 25 } },
      headers: await headersOrThrow(),
    }),
    'Purchase history is unavailable right now. Please retry.',
  )
}
