import { INTERNATIONAL_ORIGIN, INTERNATIONAL_ROUTES, sitemapXmlWithPosts } from "@/lib/seo/sitemaps";
import { getPublishedPosts } from "@/lib/marketing/blogs";

export const revalidate = 300;

export async function GET() {
  const posts = await getPublishedPosts('INTL');
  return new Response(sitemapXmlWithPosts(INTERNATIONAL_ORIGIN, INTERNATIONAL_ROUTES, posts, '/us/blog'), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
