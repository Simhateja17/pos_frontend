/*
 * US edition blog index — the `/blog` mirror for the International edition.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { BlogIndex } from "@/components/marketing/blog-pages";
import { getPublishedPosts } from "@/lib/marketing/blogs";

export const metadata = { title: "Blog | Ambel POS" };

export default async function USBlogPage() {
  const posts = await getPublishedPosts('INTL')
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5" /><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6" /></svg>
          The Ambel POS blog
        </div>
        <h1>Notes on retail,<br /><em>sales tax and building product.</em></h1>
        <p>Practical guides for retailers worldwide, product updates, and stories from stores running Ambel POS.</p>
      </section>

      <BlogIndex posts={posts} region="INTL" />
      <SiteFooter region="INTL" />
    </>
  );
}
