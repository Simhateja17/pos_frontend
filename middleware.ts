import { NextRequest, NextResponse } from 'next/server'
import { REGION_COOKIE } from '@/lib/marketing/region'

// Domain-based surface routing (Phase 8 multi-region rollout).
//
// in.ambelpos.com is the dedicated India entry point — its root `/` already
// serves the India marketing page (app/page.js) and needs no rewrite.
//
// Every other host (www.ambelpos.com, the bare domain, Vercel preview URLs,
// localhost) is the International/default entry point, whose landing page
// lives at /us instead of root. Only `/` is rewritten — every other path
// (including /us/* itself and /app/*) is left untouched, since app/us/page.js
// already navigates via absolute paths like `/us/auth`.
const INDIA_HOST = 'in.ambelpos.com'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0]
  const isIndia = hostname === INDIA_HOST

  // Google (and any other inbound link) mostly points at the bare/www
  // domain, not in.ambelpos.com — so an India visitor who never explicitly
  // typed the India subdomain would otherwise land on the US marketing page
  // and, if they sign up, get provisioned on the US backend. Redirect them
  // (not just rewrite content) so the URL bar, cookies, and every later API
  // call are genuinely first-party to in.ambelpos.com. Scoped to `/` only —
  // this is a landing-page fix, not a blanket redirect: an already-logged-in
  // session on /app/* must never be bounced to a different domain's cookies.
  if (request.nextUrl.pathname === '/' && !isIndia) {
    const cookieOverride = request.cookies.get(REGION_COOKIE)?.value
    const geoCountry = request.headers.get('x-vercel-ip-country')
    const wantsIndia = cookieOverride === 'IN' || (cookieOverride !== 'INTL' && geoCountry === 'IN')
    if (wantsIndia) {
      const target = new URL(request.url)
      target.hostname = INDIA_HOST
      target.pathname = '/'
      return NextResponse.redirect(target)
    }
  }

  const response =
    request.nextUrl.pathname === '/' && !isIndia
      ? NextResponse.rewrite(new URL('/us', request.url))
      : NextResponse.next()

  // lib/marketing/region.ts's detectRegion() otherwise decides IN vs INTL
  // from a cookie override or Vercel's geo-IP header, independent of which
  // domain served the request — a visitor on the dedicated India domain with
  // a non-India IP (VPN, travel) would otherwise see USD pricing on /pricing
  // while everything else on the page is India-branded. The domain is the
  // stronger, deliberate signal: force the cookie to 'IN' here. The default
  // (non-India) domain is intentionally left untouched — its whole point is
  // letting the existing geo-IP guess / manual region switcher keep working.
  if (isIndia) {
    response.cookies.set(REGION_COOKIE, 'IN', { path: '/' })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|_backend).*)'],
}
