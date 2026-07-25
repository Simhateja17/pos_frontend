import { createClient } from '@supabase/supabase-js'
import { expect, test as base } from '@playwright/test'
import type { AppContext } from '@/lib/api/authenticated-client'

type AuthenticatedFixtures = {
  appContext: AppContext
  authenticatedPage: import('@playwright/test').Page
}

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for authenticated E2E tests.`)
  return value
}

function assertNonProduction() {
  if (process.env.E2E_NON_PRODUCTION !== 'true') {
    throw new Error('Set E2E_NON_PRODUCTION=true only for a disposable, non-production test environment.')
  }
}

export const test = base.extend<AuthenticatedFixtures>({
  appContext: async ({}, use) => {
    assertNonProduction()
    const supabaseUrl = requiredEnvironment('E2E_SUPABASE_URL')
    const supabaseAnonKey = requiredEnvironment('E2E_SUPABASE_ANON_KEY')
    const email = requiredEnvironment('E2E_SUPABASE_EMAIL')
    const password = requiredEnvironment('E2E_SUPABASE_PASSWORD')
    const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000/api'
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error || !data.session) throw new Error('Unable to create the disposable E2E session.')

    const response = await fetch(`${apiUrl}/context`, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    })
    if (!response.ok) throw new Error(`The disposable E2E session could not load /context (${response.status}).`)

    await use((await response.json()) as AppContext)
    await client.auth.signOut()
  },
  authenticatedPage: async ({ page, appContext }, use) => {
    const supabaseUrl = requiredEnvironment('E2E_SUPABASE_URL')
    const supabaseAnonKey = requiredEnvironment('E2E_SUPABASE_ANON_KEY')
    const email = requiredEnvironment('E2E_SUPABASE_EMAIL')
    const password = requiredEnvironment('E2E_SUPABASE_PASSWORD')
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error || !data.session) throw new Error('Unable to create the disposable E2E session.')

    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    await page.addInitScript(
      ({ key, session }) => window.localStorage.setItem(key, session),
      {
        key: `sb-${projectRef}-auth-token`,
        session: JSON.stringify(data.session),
      },
    )
    await use(page)

    // Keep the fixture context live until the page assertions have completed.
    expect(appContext.tenant.id).toBeTruthy()
    await client.auth.signOut()
  },
})

export { expect }
