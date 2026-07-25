import type { components } from './schema'
import { apiClient } from './client'
import { supabase } from '@/lib/supabase/client'

export type AppContext = components['schemas']['AppContext']

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
