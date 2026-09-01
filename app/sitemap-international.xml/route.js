import { internationalSitemapXml } from "@/lib/seo/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return new Response(internationalSitemapXml(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
