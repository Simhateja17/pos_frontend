/*
 * US edition changelog — the `/changelog` mirror for the International
 * edition. Same timeline markup as the India page; the entries describe the
 * US build (sales tax, BOPIS, card readers) instead of the India one.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Changelog | Ambel POS" };

const ENTRIES: [string, string, string, string][] = [
  ["Jan 2026", "NEW", "Local tax-jurisdiction resolution", "Sales tax now resolves down to local jurisdictions, not just regional ones, so accurate rates apply on every ticket."],
  ["Jan 2026", "IMPROVED", "Faster multi-location sync", "Cross-location stock sync latency reduced from ~4s to under 900ms on the standard plan."],
  ["Dec 2025", "NEW", "Exemption certificate vault", "Store and expire resale and non-profit certificates per customer, applied automatically at checkout."],
  ["Dec 2025", "FIX", "Rounding on mixed-rate tickets", "Fixed a penny discrepancy when a single ticket mixed taxable and tax-exempt lines across two jurisdictions."],
  ["Nov 2025", "NEW", "BOPIS pickup shelves", "Staging shelf assignment, promise times and late-pickup follow-up built into the associate view."],
  ["Nov 2025", "IMPROVED", "Offline checkout reliability", "Store-and-forward card authorisations now retry with exponential backoff instead of requiring a manual refresh."],
  ["Oct 2025", "NEW", "Shopify two-way sync", "Orders, inventory and fulfilment status flow both ways between the storefront and the register in near real time."],
  ["Oct 2025", "NEW", "Size × colour matrix editor", "Bulk-create apparel variants from a single style in one grid instead of one row at a time."],
];

const TAG_COLOR: Record<string, string> = {
  NEW: "rgba(0,88,186,.1)",
  IMPROVED: "rgba(16,163,127,.12)",
  FIX: "rgba(245,158,11,.12)",
};
const TAG_TEXT: Record<string, string> = {
  NEW: "var(--brand-1)",
  IMPROVED: "#0f8f63",
  FIX: "#B45309",
};

export default function USChangelogPage() {
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
          Changelog
        </div>
        <h1>What&apos;s new in<br /><em>Ambel POS.</em></h1>
        <p>Shipped features, improvements and fixes, updated as we release them.</p>
      </section>

      <section className="content-section">
        <div className="timeline">
          {ENTRIES.map(([date, tag, title, body], i) => (
            <div className="timeline-item" key={i}>
              <div className="timeline-date">{date}</div>
              <div>
                <span className="timeline-tag" style={{ background: TAG_COLOR[tag], color: TAG_TEXT[tag] }}>{tag}</span>
                <div className="timeline-h">{title}</div>
                <p className="timeline-p">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
