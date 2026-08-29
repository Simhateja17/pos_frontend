import { createClient } from '@supabase/supabase-js'

// India and International are two independent Supabase projects (separate
// Auth pools, not just separate app databases) — see next.config.mjs's
// host-matched /_backend rewrite for the same split on the API side. That
// rewrite is a server-side proxy, so it can pick a backend per-request from
// the Host header. This client can't do that: Supabase Auth calls go
// straight from the browser to supabase.co, bypassing Next entirely, so the
// project has to be chosen once, by hostname, at module load.
//
// Getting this wrong doesn't fail loudly at signup — it fails one step
// later: the OTHER project's Auth server hands back a session whose JWT
// this client's project didn't sign, so the very next authenticated request
// (GET /auth/v1/user) comes back 403 as an "invalid" session.
const INDIA_HOST = 'in.ambelpos.com'

// Static prerendering and SSR evaluate this module with no `window` at all —
// there is no request-scoped hostname to pick a region by, and this client
// is never actually called during that pass (every real .auth.* call happens
// from a browser event/effect). Treat "no window" as "region unknown, don't
// care": fall back through whatever config exists so the build never crashes
// on a region that happens to be unconfigured in this environment. The
// browser re-evaluates this module fresh at hydration with a real
// window.location — that's the only place a call is ever made, and the only
// place a truly missing config should fail loudly.
const hasWindow = typeof window !== 'undefined'
const isIndia = hasWindow && window.location.hostname === INDIA_HOST

// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (unsuffixed) is the pre-existing India
// config already set in Vercel — kept as the India fallback so this change
// needs no edit to that env var. Only the two _INTL vars are new.
const inUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_IN ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const inKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_IN ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const intlUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_INTL
const intlKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_INTL

const supabaseUrl = hasWindow ? (isIndia ? inUrl : intlUrl) : (inUrl ?? intlUrl)
const supabaseAnonKey = hasWindow ? (isIndia ? inKey : intlKey) : (inKey ?? intlKey)

function missingConfigMessage() {
  const region = isIndia ? 'India' : 'International'
  const vars = isIndia
    ? 'NEXT_PUBLIC_SUPABASE_URL_IN / NEXT_PUBLIC_SUPABASE_ANON_KEY_IN (or the legacy NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    : 'NEXT_PUBLIC_SUPABASE_URL_INTL / NEXT_PUBLIC_SUPABASE_ANON_KEY_INTL'
  return (
    `Missing Supabase configuration for the ${region} region. Set ${vars} ` +
    'in frontend/.env.local (copy .env.example), then restart `npm run dev` ' +
    '— Next.js only reads env files at startup.'
  )
}

// Fail loudly, but at the point of USE rather than at import.
//
// This module is imported by pages that never touch Auth — the `/us` landing
// page pulls it in only to read live pricing. Throwing at module scope took
// those down with it: the throw lands during hydration, outside any Suspense
// boundary, so React discards the server HTML and the whole root goes blank.
// A missing auth key must not be able to white-screen a marketing page.
//
// The stub keeps the original signal exactly where it is actionable: the
// message is logged the moment a misconfigured bundle loads, and any real
// `.auth.*` / `.from(...)` call still throws the same error instead of
// silently talking to the wrong project.
function missingConfigClient(): ReturnType<typeof createClient> {
  const fail = () => {
    throw new Error(missingConfigMessage())
  }
  return new Proxy({} as ReturnType<typeof createClient>, {
    get: fail,
    apply: fail,
  })
}

/**
 * Whether this region actually has Auth credentials in the running bundle.
 *
 * Screens that REQUIRE a session (the dashboard shell, onboarding) should keep
 * using `supabase` directly and let it throw — a missing key there is a real
 * failure and must not be papered over. Screens where the session is only
 * cosmetic — the marketing pages, which read it to pick "Sign in" vs "Open the
 * app" — should check this first and treat `false` as signed out, so a local
 * env gap costs a button label instead of the whole page.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && hasWindow) {
  console.error(missingConfigMessage())
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : missingConfigClient()

/**
 * Admin has a separate browser storage namespace from the merchant POS.  Both
 * clients may exist in one browser tab (for example while support is being
 * investigated), but an employee session must never replace or refresh the
 * merchant's session and vice versa.
 */
export const adminSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { storageKey: 'ambel.admin.auth.token' },
    })
  : missingConfigClient()
