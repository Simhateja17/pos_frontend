import { INDIA_ORIGIN, INDIA_ROUTES, sitemapXmlWithPosts } from "@/lib/seo/sitemaps";
import { getPublishedPosts } from "@/lib/marketing/blogs";

export const revalidate = 300;

export async function GET() {
  const posts = await getPublishedPosts('IN');
  return new Response(sitemapXmlWithPosts(INDIA_ORIGIN, INDIA_ROUTES, posts, '/blog'), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
