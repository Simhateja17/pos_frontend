import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Changelog — Ambel POS" };

const ENTRIES: [string, string, string, string][] = [
  ["Jan 2026", "NEW", "AI Copilot for Inventory", "Copilot now proposes reorder quantities using Prophet-based forecasting, with the data basis shown before you approve any purchase order."],
  ["Jan 2026", "IMPROVED", "Faster multi-store sync", "Cross-branch stock sync latency reduced from ~4s to under 900ms on the standard plan."],
  ["Dec 2025", "NEW", "Delivery challan → tax invoice", "Convert a delivery challan to a GST tax invoice in one click once goods are delivered."],
  ["Dec 2025", "FIX", "GSTR-1 export rounding", "Fixed a rounding discrepancy in GSTR-1 exports affecting invoices with mixed tax slabs."],
  ["Nov 2025", "NEW", "WhatsApp campaign builder", "DND-safe, DLT-registered WhatsApp templates with audience segmentation from the CRM module."],
  ["Nov 2025", "IMPROVED", "Offline billing reliability", "Local queue now retries failed syncs with exponential backoff instead of requiring a manual refresh."],
  ["Oct 2025", "NEW", "Staff AI coaching score", "Real-time nudges for cashiers on the POS screen based on upsell rate, bill time and discount usage."],
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

export default function ChangelogPage() {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
          Changelog
        </div>
        <h1>What&apos;s new in<br /><em>Ambel POS.</em></h1>
        <p>Shipped features, improvements and fixes — updated as we release them.</p>
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
      <SiteFooter />
    </>
  );
}
