import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'

export type Receivable = {
  customerId: string
  name: string | null
  billingName: string | null
  phone: string | null
  email: string | null
  balance: string
  creditLimit: string | null
  recentActivityAt: string | null
}

export type ReceivablesList = {
  items: Receivable[]
  total: number
  outstandingTotal: string
}

export type ReceivablesSort = 'balance_desc' | 'balance_asc' | 'name_asc' | 'recent'

export async function getReceivables(search: string | undefined, sort: ReceivablesSort): Promise<ReceivablesList> {
  // Keep the error body flexible while the backend rolls this route into the
  // generated contract; the success payload remains the generated shape.
  const result = await (apiClient as any).GET('/receivables', {
    params: { query: { search: search || undefined, sort, limit: 100 } },
    headers: await authHeaders(),
  })
  if (result.error || !result.data) {
    const message = result.error && typeof result.error === 'object' && 'error' in result.error && typeof result.error.error === 'string'
      ? result.error.error
      : 'Receivables are unavailable right now. Please retry.'
    throw new Error(message)
  }
  return result.data
}
