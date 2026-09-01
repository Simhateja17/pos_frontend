import { INDIA_ORIGIN, INTERNATIONAL_ORIGIN } from "@/lib/seo/sitemaps";

export const dynamic = "force-static";

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${INDIA_ORIGIN}/sitemap-india.xml</loc></sitemap>
  <sitemap><loc>${INTERNATIONAL_ORIGIN}/sitemap-international.xml</loc></sitemap>
</sitemapindex>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
