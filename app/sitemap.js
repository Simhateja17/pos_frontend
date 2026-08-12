const SITE_URL = "https://www.ambelpos.com";

const PUBLIC_ROUTES = [
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
  ["/us", "monthly", 0.7],
];

export default function sitemap() {
  return PUBLIC_ROUTES.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
