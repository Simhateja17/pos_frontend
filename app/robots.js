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
    sitemap: [
      "https://in.ambelpos.com/sitemap-india.xml",
      "https://www.ambelpos.com/sitemap-international.xml",
    ],
  };
}
