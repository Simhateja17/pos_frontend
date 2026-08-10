/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The register's device identity is stored in an HttpOnly cookie. Calling the
  // API from a different site makes that a third-party cookie, which Chrome may
  // block even with SameSite=None. Keep browser API calls same-origin and let
  // Next proxy them to the backend instead.
  async rewrites() {
    const backendApi = (process.env.BACKEND_API_URL ?? 'https://posbackend.withcouture.me/api').replace(/\/$/, '')
    return [
      {
        source: '/_backend/:path*',
        destination: `${backendApi}/:path*`,
      },
    ]
  },
};

export default nextConfig;
