/*
 * US edition roadmap — the `/roadmap` mirror for the International edition.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Roadmap | Ambel POS" };

const COLUMNS: [string, string, [string, string][]][] = [
  [
    "In progress",
    "#0058BA",
    [
      ["Automated sales tax filing", "Prepare and submit state returns from inside Ambel POS, with a filing calendar per nexus state."],
      ["Marketplace order sync", "Two-way order and stock sync with Amazon and Etsy seller accounts."],
      ["Copilot for staff scheduling", "AI-suggested shift rosters based on foot-traffic forecasts and labor budget."],
    ],
  ],
  [
    "Planned",
    "#B45309",
    [
      ["Gift card network", "Sell and redeem gift cards across every location and the online storefront on one balance."],
      ["Tap to Pay on iPhone", "Accept contactless cards on the phone in your associate's pocket, no reader needed."],
      ["Franchise royalty engine", "Automated royalty calculation and settlement for franchise networks."],
    ],
  ],
  [
    "Exploring",
    "#6D28D9",
    [
      ["Self-checkout kiosk mode", "Kiosk experience for high-traffic stores, with age-gate and attendant override."],
      ["Predictive stockout alerts", "Location-level alerts before a fast-moving SKU sells out, not after."],
      ["Embedded working capital", "Cash-advance offers for retailers based on verified sales history."],
    ],
  ],
];

export default function USRoadmapPage() {
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.6c2.9 1.6 4.8 4.6 4.8 8 0 2-.9 3.8-1.9 4.9l-2.9 1.9-2.9-1.9c-1-1.1-1.9-2.9-1.9-4.9 0-3.4 1.9-6.4 4.8-8z" /></svg>
          Roadmap
        </div>
        <h1>What we&apos;re building<br /><em>next.</em></h1>
        <p>A living view of what&apos;s in progress, planned and being explored. Priorities shift based on feedback from stores running Ambel POS today.</p>
      </section>

      <section className="content-section">
        <div className="roadmap-board">
          {COLUMNS.map(([title, color, items]) => (
            <div className="roadmap-col" key={title}>
              <h3><span className="roadmap-dot" style={{ background: color }}></span>{title}</h3>
              {items.map(([h, body]) => (
                <div className="roadmap-card" key={h}>
                  <h4>{h}</h4>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 40, color: "var(--muted)", fontSize: 14.5 }}>
          Have a request? Tell us via the <a href="/us/contact" style={{ color: "var(--brand-1)" }}>contact page</a>.
        </p>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
