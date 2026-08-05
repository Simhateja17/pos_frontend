import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Blog — Couture POS" };

const POSTS: [string, string, string, string, string][] = [
  ["GST", "#0A2348", "GSTR-1 filing checklist for multi-store retailers in 2026", "Jan 18, 2026 · 6 min read", "M"],
  ["Product", "#06337A", "Inside the AI Copilot: how we designed for trust, not automation", "Jan 9, 2026 · 8 min read", "A"],
  ["Retail Ops", "#1A3A5C", "Why offline-first billing matters more than ever this monsoon", "Dec 22, 2025 · 5 min read", "O"],
  ["Case Study", "#0E2642", "How Rangreza Ethnic cut billing time 40% across 3 stores", "Dec 12, 2025 · 7 min read", "R"],
  ["Inventory", "#0A2348", "Size-curve analysis: reordering apparel without guesswork", "Nov 28, 2025 · 6 min read", "S"],
  ["Payments", "#06337A", "UPI settlement reconciliation, explained for non-accountants", "Nov 14, 2025 · 5 min read", "P"],
];

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5" /><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6" /></svg>
          The Couture POS blog
        </div>
        <h1>Notes on retail,<br /><em>GST and building product.</em></h1>
        <p>Practical guides for Indian retailers, product updates, and stories from stores running on Couture POS.</p>
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
      <SiteFooter />
    </>
  );
}
