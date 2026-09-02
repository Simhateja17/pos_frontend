import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = {
  title: "Roadmap | Ambel POS",
  description: "What Ambel POS is building next: in-progress, planned and exploratory features across GST filing, marketplace sync, billing and store operations.",
};

const COLUMNS: [string, string, [string, string][]][] = [
  [
    "In progress",
    "#0058BA",
    [
      ["Direct GST filing API", "File GSTR-1 straight to the GST portal without leaving Ambel POS."],
      ["Marketplace order sync", "Two-way order and stock sync with Amazon and Flipkart Seller accounts."],
      ["Copilot for staff scheduling", "AI-suggested shift rosters based on footfall forecasts."],
    ],
  ],
  [
    "Planned",
    "#B45309",
    [
      ["Multi-currency billing", "Bill in USD/AED for export-facing boutiques, with INR settlement."],
      ["Voice billing", "Add items to a cart by voice for high-volume festive counters."],
      ["Franchise royalty engine", "Automated royalty calculation and settlement for franchise networks."],
    ],
  ],
  [
    "Exploring",
    "#6D28D9",
    [
      ["In-store kiosk mode", "Self-checkout kiosk experience for high-footfall stores."],
      ["Predictive stockout alerts", "Store-level alerts before a fast-moving SKU sells out, not after."],
      ["Embedded lending", "Working-capital offers for retailers based on verified sales history."],
    ],
  ],
];

export default function RoadmapPage() {
  return (
    <>
      <SiteHeader />
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
              <h2 className="roadmap-col-h"><span className="roadmap-dot" style={{ background: color }}></span>{title}</h2>
              {items.map(([h, body]) => (
                <div className="roadmap-card" key={h}>
                  <h3>{h}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 40, color: "var(--muted)", fontSize: 14.5 }}>
          Have a request? Tell us via the <a href="/contact" style={{ color: "var(--brand-1)" }}>contact page</a>.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
