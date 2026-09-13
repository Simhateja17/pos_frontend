/** Keep the UI edition aligned with the hostname-selected Auth and API. */
export function operationalRegionPath(hostname: string, pathname: string): string | null {
  const india = hostname === 'in.ambelpos.com'
  const international = hostname === 'www.ambelpos.com' || hostname === 'ambelpos.com'
  if (international && (pathname === '/app' || pathname.startsWith('/app/'))) {
    if (pathname === '/app' || pathname === '/app/' || pathname === '/app/dashboard') return '/us/dashboard'
    return `/us/dashboard${pathname.slice('/app'.length)}`
  }
  if (india && (pathname === '/us/dashboard' || pathname.startsWith('/us/dashboard/'))) {
    if (pathname === '/us/dashboard' || pathname === '/us/dashboard/') return '/app/dashboard'
    return `/app${pathname.slice('/us/dashboard'.length)}`
  }
  return null
}
