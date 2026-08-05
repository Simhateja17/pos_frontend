import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "About — Couture POS" };

const VALUES = [
  ["Built for Indian retail", "Every workflow — GST, HSN codes, UPI settlement, DLT-compliant WhatsApp — is designed around how Indian retailers actually operate, not adapted from a Western template."],
  ["Offline is not optional", "Internet drops. Billing shouldn't. Every core workflow works offline-first and syncs the moment connectivity returns."],
  ["AI that shows its work", "Our Copilot proposes actions with the data behind them, and always asks before it touches your store."],
  ["Ship with retailers, not at them", "Roadmap priorities come from store owners and cashiers using the product daily, not from a boardroom."],
];

const TEAM = [
  ["LT", "#0058BA", "Lakshmi Thulasi", "Co-Founder & Director"],
  ["SP", "#0E7490", "Dr. Siva Prathap", "Co-Founder & Director"],
  ["ST", "#6D28D9", "Simha Teja", "Co-Founder & Director"],
  ["P", "#B45309", "Poojitha", "Developer"],
  ["S", "#15803D", "Surendra", "Developer"],
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.6" /><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0" /></svg>
          About Couture POS
        </div>
        <h1>We&apos;re building the retail<br /><em>backbone of India.</em></h1>
        <p>Couture POS started in 2023 with a simple observation: Indian retailers were stitching together five different tools to run one store. We set out to build the one that does it all.</p>
      </section>

      <section className="content-section">
        <div className="content-wrap content-prose">
          <h2>Our story</h2>
          <p>Couture POS was founded by two former retail-tech engineers who watched a Jaipur boutique owner run billing on one app, inventory on a spreadsheet, and GST filing through a CA — every month, by hand. We built the first version of Couture POS over a weekend to fix that one store's workflow. Three years later, it runs 2,400+ stores across India.</p>
          <p>We&apos;re headquartered in Bengaluru with team members across Jaipur, Mumbai and Pune — the same cities where our earliest customers opened their doors to us.</p>
          <h2>What we believe</h2>
        </div>
        <div className="features-grid" style={{ marginTop: 24 }}>
          {VALUES.map(([title, body]) => (
            <div className="feat-card" key={title}>
              <div className="feat-h">{title}</div>
              <p className="feat-p">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="social-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">Leadership</div>
          <h2 className="section-h">The people building it.</h2>
          <div className="social-grid" style={{ marginTop: 32 }}>
            {TEAM.map(([initials, color, name, role]) => (
              <div className="soc-card" key={name} style={{ textAlign: "center" }}>
                <div className="soc-ava" style={{ background: color, margin: "0 auto 12px" }}>{initials}</div>
                <div className="soc-name">{name}</div>
                <div className="soc-role">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Want to build this with us?</h2>
        <p>We&apos;re hiring across engineering, product and retail success.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/careers">View open roles</a>
          <a className="btn-cta-g" href="/contact">Get in touch →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
