import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { PricingGrid } from "@/components/marketing/pricing-plans";

export const metadata = { title: "Pricing — Ambel POS" };

const FAQ: [string, string][] = [
  ["Is there a setup fee?", "No. Every plan includes onboarding, catalog import and hardware pairing support at no extra cost."],
  ["Can I switch plans later?", "Yes — upgrade or downgrade at any time. Changes apply from your next billing cycle, and we prorate upgrades made mid-cycle."],
  ["Do you charge per transaction?", "No. All plans are flat monthly or annual fees regardless of how many bills you process."],
  ["Can I change plans later?", "Plan changes are scheduled for a future billing cycle. Your data is retained while an active subscription is in place."],
  ["Is GST filing included?", "GSTR-1 ready reports and exports are included on every plan. Direct filing to the GST portal is available as an add-on."],
  ["Do you offer discounts for annual billing?", "Yes — paying annually saves 2 months compared to monthly billing on Starter and Growth."],
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
        <h1>Start free.<br /><em>Scale without limits.</em></h1>
        <p>No per-transaction fees. No hidden charges. Cancel any time.</p>
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
        <p>Join 2,400+ retailers already running on Ambel POS. Choose a paid plan and activate your store.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/signup">Choose a plan</a>
          <a className="btn-cta-g" href="/app/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
