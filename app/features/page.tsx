import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { FEAT_ICONS, FEATURES } from "@/components/marketing/features-data";

export const metadata = { title: "Features — Ambel POS" };

function featBadges(b3: string, b4: string) {
  return (
    <>
      {b3 === "NEW" && <span className="feat-badge new">NEW</span>}
      {b4 === "★" && <span className="feat-badge star">★ Distinctive</span>}
      {b4 === "AI" && <span className="feat-badge new">AI-powered</span>}
      {b3 === "IMPROVE" && <span className="feat-badge new">IMPROVING</span>}
    </>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z" /></svg>
          Built for Indian retail
        </div>
        <h1>Everything your store needs,<br /><em>nothing it doesn&apos;t.</em></h1>
        <p>22 deeply-integrated modules, all designed around GST compliance, Indian payment rails, and the real complexity of multi-store fashion retail.</p>
      </section>

      <section className="content-section">
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feat-card" key={f[1]}>
              <div className="feat-icon">
                <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: FEAT_ICONS[f[0]] || "" }} />
              </div>
              <div className="feat-h">{f[1]}</div>
              <p className="feat-p">{f[2]}</p>
              {featBadges(f[3], f[4])}
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>See it running<br />on your own catalog.</h2>
        <p>Import your products in minutes and try every module free for 14 days.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/signup">Choose a plan</a>
          <a className="btn-cta-g" href="/app/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
