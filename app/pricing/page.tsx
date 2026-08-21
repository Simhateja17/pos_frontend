import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { PricingGrid } from "@/components/marketing/pricing-plans";

export const metadata = { title: "Pricing | Ambel POS" };

const FAQ: [string, string][] = [
  ["Are the India prices tax inclusive?", "Yes. India subscription prices are shown as GST-inclusive totals in the secure checkout."],
  ["Do you charge per POS transaction?", "No. Starter, Growth and Pro all include unlimited POS transactions."],
  ["Can I change plans later?", "Plan changes are scheduled for a future billing cycle. Your data is retained while an active subscription is in place."],
  ["How do Pro add-ons work?", "Pro includes six locations, ten users and six registers. Add locations at ₹299 each, registers at ₹199 each, or users at ₹99 each."],
  ["What is included in every plan?", "POS billing, inventory management, ML reorder intelligence, GST-ready reports and CSV export, and offline billing and sync."],
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.5 5h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2" /></svg>
          Simple, transparent pricing
        </div>
        <h1>Choose clearly.<br /><em>Grow with confidence.</em></h1>
        <p>Three straightforward India plans. Prices are per month, with no per-transaction fees and no free tier.</p>
      </section>

      <section className="content-section">
        <PricingGrid />
      </section>

      <section className="how-section">
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 className="section-h" style={{ margin: "0 auto", textAlign: "center", maxWidth: "none" }}>Pricing questions, answered.</h2>
          <div className="content-prose" style={{ marginTop: 40 }}>
            {FAQ.map(([q, a]) => (
              <div key={q} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, margin: "0 0 8px" }}>{q}</h2>
                <p style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to transform<br />your store?</h2>
        <p>Choose the India plan that matches your active locations, users and registers, then activate your store.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/signup">Choose a plan</a>
          <a className="btn-cta-g" href="/app/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
