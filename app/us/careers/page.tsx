/*
 * US edition careers page — the `/careers` mirror for the International
 * edition.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Careers | Ambel POS" };

const PERKS = [
  ["Remote-friendly", "Work from our Austin hub, or remotely from anywhere in the US."],
  ["Health cover", "Medical, dental and vision for you and your dependents."],
  ["Learning budget", "Annual budget for courses, books and conferences."],
  ["Equity", "Every full-time hire gets stock options in the company."],
];

const ROLES: [string, string, string][] = [
  ["Senior Backend Engineer", "Engineering · Austin, TX / Remote", "Full-time"],
  ["Frontend Engineer, Checkout", "Engineering · Austin, TX / Remote", "Full-time"],
  ["ML Engineer, Forecasting", "Engineering · Austin, TX", "Full-time"],
  ["Product Designer", "Product · Austin, TX / Remote", "Full-time"],
  ["Retail Success Manager", "Customer Success · Denver, CO", "Full-time"],
  ["Sales Tax & Compliance Analyst", "Operations · Remote (US)", "Full-time"],
];

export default function USCareersPage() {
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /></svg>
          Careers at Ambel POS
        </div>
        <h1>Help independent retailers<br /><em>run better stores.</em></h1>
        <p>We&apos;re a small team solving a big, unglamorous problem: making retail software that actually fits how stores work behind the counter. Come build it with us.</p>
      </section>

      <section className="features-section" style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="section-h">Why work here.</h2>
          <div className="features-grid" style={{ marginTop: 32 }}>
            {PERKS.map(([title, body]) => (
              <div className="feat-card" key={title}>
                <div className="feat-h">{title}</div>
                <p className="feat-p">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="content-wrap" style={{ maxWidth: 860, marginBottom: 32 }}>
          <h2 className="section-h" style={{ maxWidth: "none" }}>Open roles.</h2>
        </div>
        {ROLES.map(([title, meta, type]) => (
          <div className="job-card" key={title}>
            <div>
              <h4>{title}</h4>
              <span>{meta}</span>
            </div>
            <span className="job-tag">{type}</span>
          </div>
        ))}
        <p style={{ textAlign: "center", marginTop: 24, color: "var(--muted)", fontSize: 14.5 }}>
          Don&apos;t see a fit? Write to us at <a href="mailto:careers@ambelpos.com" style={{ color: "var(--brand-1)" }}>careers@ambelpos.com</a>.
        </p>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
