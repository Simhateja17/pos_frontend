/*
 * US edition blog index — the `/blog` mirror for the International edition.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Blog | Ambel POS" };

const POSTS: [string, string, string, string, string][] = [
  ["Sales Tax", "#0A2348", "Retail tax in 2026: the thresholds that changed this year", "Jan 18, 2026 · 6 min read", "N"],
  ["Product", "#06337A", "Inside the AI Copilot: how we designed for trust, not automation", "Jan 9, 2026 · 8 min read", "A"],
  ["Retail Ops", "#1A3A5C", "Why offline-first checkout matters more than your Wi-Fi contract", "Dec 22, 2025 · 5 min read", "O"],
  ["Case Study", "#0E2642", "How The Dresser cut checkout time 40% across three stores", "Dec 12, 2025 · 7 min read", "D"],
  ["Inventory", "#0A2348", "Size-curve analysis: reordering apparel without guesswork", "Nov 28, 2025 · 6 min read", "S"],
  ["Omnichannel", "#06337A", "BOPIS that customers actually trust: promise times, staging, follow-up", "Nov 14, 2025 · 5 min read", "B"],
];

export default function USBlogPage() {
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

      <section className="content-section">
        <div className="blog-grid">
          {POSTS.map(([cat, color, title, meta, initial]) => (
            <div className="blog-card" key={title}>
              <div className="blog-thumb" style={{ background: color }}>
                <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 34, color: "rgba(255,255,255,.85)" }}>{initial}</span>
              </div>
              <div className="blog-body">
                <div className="blog-cat">{cat}</div>
                <div className="blog-title">{title}</div>
                <div className="blog-meta">{meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
