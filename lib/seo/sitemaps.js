export const INDIA_ORIGIN = "https://in.ambelpos.com";
export const INTERNATIONAL_ORIGIN = "https://www.ambelpos.com";

const INDIA_ROUTES = [
  ["/", "weekly", 1],
  ["/about", "monthly", 0.7],
  ["/blog", "weekly", 0.8],
  ["/careers", "monthly", 0.4],
  ["/changelog", "weekly", 0.6],
  ["/contact", "monthly", 0.6],
  ["/features", "monthly", 0.8],
  ["/pricing", "monthly", 0.8],
  ["/privacy", "yearly", 0.2],
  ["/retail/beauty-wellness", "monthly", 0.7],
  ["/retail/electronics", "monthly", 0.7],
  ["/retail/fashion-apparel", "monthly", 0.7],
  ["/retail/multi-store", "monthly", 0.7],
  ["/roadmap", "monthly", 0.6],
  ["/terms", "yearly", 0.2],
];

// The International homepage is presented at www.ambelpos.com/ by middleware.
// Its remaining public pages retain their real /us/* paths.
const INTERNATIONAL_ROUTES = [
  ["/", "weekly", 1],
  ["/us/about", "monthly", 0.7],
  ["/us/blog", "weekly", 0.8],
  ["/us/careers", "monthly", 0.4],
  ["/us/changelog", "weekly", 0.6],
  ["/us/contact", "monthly", 0.6],
  ["/us/features", "monthly", 0.8],
  ["/us/pricing", "monthly", 0.8],
  ["/us/privacy", "yearly", 0.2],
  ["/us/retail/beauty-wellness", "monthly", 0.7],
  ["/us/retail/electronics", "monthly", 0.7],
  ["/us/retail/fashion-apparel", "monthly", 0.7],
  ["/us/retail/multi-store", "monthly", 0.7],
  ["/us/roadmap", "monthly", 0.6],
  ["/us/terms", "yearly", 0.2],
];

export function sitemapXml(origin, routes) {
  const urls = routes
    .map(
      ([path, changeFrequency, priority]) => `  <url>
    <loc>${origin}${path}</loc>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\n`;
}

export function indiaSitemapXml() {
  return sitemapXml(INDIA_ORIGIN, INDIA_ROUTES);
}

export function internationalSitemapXml() {
  return sitemapXml(INTERNATIONAL_ORIGIN, INTERNATIONAL_ROUTES);
}
