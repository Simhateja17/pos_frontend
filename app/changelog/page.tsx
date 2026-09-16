import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = {
  title: "Changelog | Ambel POS",
  description: "Release notes for Ambel POS. We are starting a public changelog now rather than backfilling one.",
};

const ENTRIES: [string, string, string, string][] = [];

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
        <p>Shipped features, improvements and fixes, published as we release them.</p>
      </section>

      <section className="content-section">
        {ENTRIES.length > 0 ? (
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
        ) : (
          <div className="content-wrap content-prose">
            <h2>Nothing published yet</h2>
            <p>We have not kept a public release log until now, and we would rather start one honestly than backfill it from memory. Entries will appear here from our next release onward.</p>
            <p>If you want to know whether a specific capability is in the product today, the <a href="/features">features page</a> lists only what is built and working.</p>
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
