import "@/app/landing.css";
import { CurrencyMark } from "@/components/marketing/currency-mark";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { PricingPeriod } from "@/components/marketing/pricing-period";
import { detectRegion } from "@/lib/marketing/region";
import { getLivePlans } from "@/lib/marketing/pricing";

export const metadata = {
  title: "Pricing | Ambel POS",
  description: "Ambel POS pricing starts at ₹799/month for 2 locations, tax-inclusive. Unlimited POS transactions, ML reorder intelligence and offline billing on every plan.",
};

function faqFor(region: "IN" | "INTL"): [string, string][] {
  return [
    ...(region === "IN"
      ? [["Are the India prices tax inclusive?", "Yes. India subscription prices are shown as GST-inclusive totals in the secure checkout."] as [string, string]]
      : []),
    ["Do you charge per POS transaction?", "No. Starter, Growth and Pro all include unlimited POS transactions."],
    ["Can I change plans later?", "Plan changes are scheduled for a future billing cycle. Your data is retained while an active subscription is in place."],
    ["How do Pro add-ons work?", "Pro includes a generous base allowance of locations, users and registers. Add more of any of the three at a small per-unit price once you outgrow it."],
    ["What is included in every plan?", "POS billing, inventory management, ML reorder intelligence, tax-ready reports and CSV export, and offline billing and sync."],
  ];
}

export default async function PricingPage() {
  const region = detectRegion();
  const plans = await getLivePlans(region);
  const FAQ = faqFor(region);

  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <CurrencyMark region={region} />
          Simple, transparent pricing
        </div>
        <h1>Choose clearly.<br /><em>Grow with confidence.</em></h1>
        <p>Three straightforward plans. Prices are per month, with no per-transaction fees and no free tier.</p>
      </section>

      <section className="content-section">
        <PricingPeriod plans={plans} />
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
        <p>Choose the plan that matches your active locations, users and registers, then activate your store.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href={`/signup?region=${region}`}>Choose a plan</a>
          <a className="btn-cta-g" href="/app/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
