import { NextRequest, NextResponse } from 'next/server'
import { REGION_COOKIE } from '@/lib/marketing/region'

// Domain-based surface routing (Phase 8 multi-region rollout).
//
// in.ambelpos.com is the dedicated India entry point — its root `/` already
// serves the India marketing page (app/page.js) and needs no rewrite.
//
// Every other host (www.ambelpos.com, the bare domain, Vercel preview URLs,
// localhost) is the International/default entry point, whose landing page
// implementation lives at /us. The public root is rewritten to that component;
// real /us/* subpages remain the International route family. Marketing-only
// duplicates are consolidated below, while operational and auth routes stay
// on their existing paths and domains.
const INDIA_HOST = 'in.ambelpos.com'
const INTERNATIONAL_HOST = 'www.ambelpos.com'

// Public acquisition pages have a true regional counterpart. Operational,
// auth and onboarding routes are deliberately absent: they must not receive
// search canonicals or cross-region alternates.
const MARKETING_EQUIVALENTS = new Map<string, string>([
  ['/', '/'],
  ['/about', '/us/about'],
  ['/blog', '/us/blog'],
  ['/careers', '/us/careers'],
  ['/changelog', '/us/changelog'],
  ['/contact', '/us/contact'],
  ['/features', '/us/features'],
  ['/pricing', '/us/pricing'],
  ['/privacy', '/us/privacy'],
  ['/retail/beauty-wellness', '/us/retail/beauty-wellness'],
  ['/retail/electronics', '/us/retail/electronics'],
  ['/retail/fashion-apparel', '/us/retail/fashion-apparel'],
  ['/retail/multi-store', '/us/retail/multi-store'],
  ['/roadmap', '/us/roadmap'],
  ['/terms', '/us/terms'],
])

const INDIA_PATH_FOR = new Map(
  [...MARKETING_EQUIVALENTS].map(([indiaPath, internationalPath]) => [internationalPath, indiaPath]),
)

function regionalLinkHeader(indiaPath: string, internationalPath: string) {
  const indiaUrl = `https://${INDIA_HOST}${indiaPath}`
  const internationalUrl = `https://${INTERNATIONAL_HOST}${internationalPath}`
  return [
    `<${indiaUrl}>; rel="alternate"; hreflang="en-IN"`,
    `<${internationalUrl}>; rel="alternate"; hreflang="en-US"`,
    `<${internationalUrl}>; rel="alternate"; hreflang="x-default"`,
  ].join(', ')
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0]
  const isIndia = hostname === INDIA_HOST
  const isInternational = hostname === INTERNATIONAL_HOST
  const pathname = request.nextUrl.pathname

  // A regional marketing path on the wrong production hostname is a duplicate
  // of the intended page. Permanently consolidate it before adding canonicals.
  // Application routes stay untouched so sessions never cross domains.
  if (isIndia && INDIA_PATH_FOR.has(pathname) && pathname !== '/') {
    const target = new URL(request.url)
    target.hostname = INTERNATIONAL_HOST
    target.pathname = pathname === '/us' ? '/' : pathname
    return NextResponse.redirect(target, 308)
  }

  if (isInternational && MARKETING_EQUIVALENTS.has(pathname) && pathname !== '/') {
    const target = new URL(request.url)
    target.hostname = INDIA_HOST
    return NextResponse.redirect(target, 308)
  }

  // www.ambelpos.com/ is the public International homepage. `/us` remains the
  // internal page implementation, but should not compete as a second URL.
  if (isInternational && pathname === '/us') {
    const target = new URL(request.url)
    target.pathname = '/'
    return NextResponse.redirect(target, 308)
  }

  // Google (and any other inbound link) mostly points at the bare/www
  // domain, not in.ambelpos.com — so an India visitor who never explicitly
  // typed the India subdomain would otherwise land on the US marketing page
  // and, if they sign up, get provisioned on the US backend. Redirect them
  // (not just rewrite content) so the URL bar, cookies, and every later API
  // call are genuinely first-party to in.ambelpos.com. Scoped to `/` only —
  // this is a landing-page fix, not a blanket redirect: an already-logged-in
  // session on /app/* must never be bounced to a different domain's cookies.
  if (pathname === '/' && !isIndia) {
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
    pathname === '/' && !isIndia
      ? NextResponse.rewrite(new URL('/us', request.url))
      : NextResponse.next()

  const indiaPath = isIndia
    ? (MARKETING_EQUIVALENTS.has(pathname) ? pathname : undefined)
    : INDIA_PATH_FOR.get(pathname)
  const internationalPath = indiaPath ? MARKETING_EQUIVALENTS.get(indiaPath) : undefined

  if ((isIndia || isInternational) && indiaPath && internationalPath) {
    const canonicalUrl = isIndia
      ? `https://${INDIA_HOST}${indiaPath}`
      : `https://${INTERNATIONAL_HOST}${internationalPath}`
    response.headers.set(
      'Link',
      `<${canonicalUrl}>; rel="canonical", ${regionalLinkHeader(indiaPath, internationalPath)}`,
    )
  }

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
