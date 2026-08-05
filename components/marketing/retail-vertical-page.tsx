import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

type Feature = { title: string; body: string };
type Stat = [string, string];

export default function RetailVerticalPage({
  tag,
  title,
  emphasis,
  subtitle,
  stats,
  features,
}: {
  tag: string;
  title: string;
  emphasis: string;
  subtitle: string;
  stats: Stat[];
  features: Feature[];
}) {
  return (
    <>
      <SiteHeader />
      <section className="content-hero">
        <div className="section-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z" /></svg>
          {tag}
        </div>
        <h1>{title}<br /><em>{emphasis}</em></h1>
        <p>{subtitle}</p>
      </section>

      <div className="stats-band" style={{ marginBottom: 0 }}>
        <div className="stats-inner" style={{ gridTemplateColumns: `repeat(${stats.length},1fr)` }}>
          {stats.map(([num, label]) => (
            <div className="stat-item" key={label}>
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="features-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="section-h">Built for how {tag.toLowerCase()} actually runs.</h2>
          <div className="features-grid" style={{ marginTop: 40 }}>
            {features.map((f) => (
              <div className="feat-card" key={f.title}>
                <div className="feat-h">{f.title}</div>
                <p className="feat-p">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to run {tag.toLowerCase()}<br />on Couture POS?</h2>
        <p>Choose a paid plan and migrate your existing catalog in minutes.</p>
        <div className="cta-actions">
          <a className="btn-cta-w" href="/signup">Choose a plan</a>
          <a className="btn-cta-g" href="/app/dashboard">Explore prototype →</a>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
