const SITE_URL = "https://www.ambelpos.com";

// India edition marketing pages (also served from in.ambelpos.com).
const IN_ROUTES = [
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

// US/International edition. Mirrors IN_ROUTES one-for-one under /us — the
// footer of every /us page links only into this set, so each entry is a real
// crawlable destination rather than an anchor on the landing page.
const US_ROUTES = [
  ["/us", "weekly", 0.9],
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

const PUBLIC_ROUTES = [...IN_ROUTES, ...US_ROUTES];

export default function sitemap() {
  return PUBLIC_ROUTES.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
