import { AmbelMark } from "@/components/brand/ambel-mark";
import type { MarketingRegion } from "@/lib/marketing/region";
import { REGION_SITE } from "@/components/marketing/site-links";

const LOGO = <AmbelMark size={38} />;

export default function SiteFooter({ region = "IN" }: { region?: MarketingRegion }) {
  const site = REGION_SITE[region];

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="nav-logo">
            <div className="nav-logo-mark">{LOGO}</div>
            <span className="nav-logo-text">Ambel POS</span>
          </div>
          <p>{site.tagline}</p>
        </div>
        {site.footerColumns.map(([title, links]) => (
          <div className="footer-col" key={title}>
            <h4>{title}</h4>
            {links.map(([label, href]) => (
              <a href={href} key={label}>{label}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 Couture Services Private Limited</span>
        <div style={{ display: "flex", gap: 20 }}>
          {site.legalLinks.map(([label, href]) => (
            <a href={href} key={label}>{label}</a>
          ))}
          {site.footerMeta.map((meta) => (
            <span key={meta}>{meta}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
