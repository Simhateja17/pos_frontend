const SITE_URL = "https://www.ambelpos.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app",
        "/checkout",
        "/login",
        "/signup",
        "/plans",
        "/terminal",
        "/settings",
        "/shifts",
        "/store-type",
        "/onboarding",
        "/us/auth",
        "/us/dashboard",
        "/us/onboarding",
        "/_backend",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
