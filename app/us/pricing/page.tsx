/*
 * US edition pricing page — the `/pricing` mirror for the International
 * edition.
 *
 * The shared `/pricing` page detects the visitor's region and offers a
 * switcher; this one is unambiguously the US edition, so it pins the region
 * to INTL and always renders USD plans fetched from the US backend. No
 * switcher here: a visitor who lands on /us/pricing asked for US pricing.
 *
 * Unlike `/pricing` — which reads cookies and is therefore always rendered
 * per-request — this page has no dynamic inputs, so Next prerenders it at
 * build time. That makes an unreachable backend a *build* failure rather than
 * a single bad response, which would take the whole deployment down. The
 * fetch is caught and degrades to the same "temporarily unavailable" notice
 * the US landing page shows, so a backend blip never blocks a release.
 */
import "@/app/landing.css";
import { CurrencyMark } from "@/components/marketing/currency-mark";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { PricingGrid } from "@/components/marketing/pricing-plans";
import { getLivePlans, type LivePlan } from "@/lib/marketing/pricing";

export const metadata = { title: "Pricing | Ambel POS" };

const FAQ: [string, string][] = [
  ["Do you charge per POS transaction?", "No. Starter, Growth and Pro all include unlimited POS transactions. You pay a flat monthly price for the plan."],
  ["How is sales tax handled on my subscription?", "US subscription prices are shown exclusive of tax. Any applicable state or local tax is calculated and shown in the secure checkout."],
  ["Can I change plans later?", "Plan changes are scheduled for a future billing cycle. Your data is retained while an active subscription is in place."],
  ["How do Pro add-ons work?", "Pro includes a generous base allowance of locations, users and registers. Add more of any of the three at a small per-unit price once you outgrow it."],
  ["What is included in every plan?", "Checkout, inventory management, ML reorder intelligence, multi-state sales tax reports with CSV export, and offline checkout with sync."],
];

export default async function USPricingPage() {
  let plans: LivePlan[] = [];
  let plansFailed = false;
  try {
    plans = await getLivePlans("INTL");
  } catch (error) {
    console.error("Failed to load US pricing plans", error);
    plansFailed = true;
  }

  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero">
        <div className="section-tag">
          <CurrencyMark region="INTL" />
          Simple, transparent pricing
        </div>
        <h1>Choose clearly.<br /><em>Grow with confidence.</em></h1>
        <p>Three straightforward plans in USD. Prices are per month, with no per-transaction fees and no free tier.</p>
      </section>

      <section className="content-section">
        {plansFailed ? (
          <p className="section-sub" style={{ margin: "0 auto", textAlign: "center" }}>
            Pricing is temporarily unavailable. Please refresh in a moment, or{" "}
            <a href="/us/contact" style={{ color: "var(--brand-1)" }}>talk to us</a> and
            we&apos;ll walk you through the plans.
          </p>
        ) : (
          <PricingGrid plans={plans} />
        )}
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
        <p>Choose the plan that matches your locations, users and registers, then activate your store.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/us/auth">Choose a plan</a>
          <a className="btn-cta-g" href="/us/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
