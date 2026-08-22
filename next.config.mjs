/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The register's device identity is stored in an HttpOnly cookie. Calling the
  // API from a different site makes that a third-party cookie, which Chrome may
  // block even with SameSite=None. Keep browser API calls same-origin and let
  // Next proxy them to the backend instead.
  async rewrites() {
    // Phase 8 multi-region: in.ambelpos.com's API calls go to the India VM;
    // every other host (www/bare domain, previews, localhost) goes to the
    // International VM. `beforeFiles` rules are checked in order — the
    // host-matched India rule wins first, everything else falls through to
    // the unconditional INTL rule below it.
    const indiaApi = (process.env.BACKEND_API_URL_IN ?? 'https://api-in.ambelpos.com/api').replace(/\/$/, '')
    const intlApi = (process.env.BACKEND_API_URL_INTL ?? 'https://api-us.ambelpos.com/api').replace(/\/$/, '')
    return {
      beforeFiles: [
        {
          source: '/_backend/:path*',
          has: [{ type: 'host', value: 'in.ambelpos.com' }],
          destination: `${indiaApi}/:path*`,
        },
        {
          source: '/_backend/:path*',
          destination: `${intlApi}/:path*`,
        },
      ],
    }
  },
};

export default nextConfig;
