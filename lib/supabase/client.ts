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
const isIndia = typeof window !== 'undefined' && window.location.hostname === INDIA_HOST

// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (unsuffixed) is the pre-existing India
// config already set in Vercel — kept as the India fallback so this change
// needs no edit to that env var. Only the two _INTL vars are new.
const supabaseUrl = isIndia
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_IN ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL_INTL

const supabaseAnonKey = isIndia
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_IN ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_INTL

if (!supabaseUrl || !supabaseAnonKey) {
  const region = isIndia ? 'India' : 'International'
  const vars = isIndia
    ? 'NEXT_PUBLIC_SUPABASE_URL_IN / NEXT_PUBLIC_SUPABASE_ANON_KEY_IN (or the legacy NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    : 'NEXT_PUBLIC_SUPABASE_URL_INTL / NEXT_PUBLIC_SUPABASE_ANON_KEY_INTL'
  throw new Error(
    `Missing Supabase configuration for the ${region} region. Set ${vars} ` +
      'in frontend/.env.local (copy .env.example), then restart `npm run dev` ' +
      '— Next.js only reads env files at startup.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
