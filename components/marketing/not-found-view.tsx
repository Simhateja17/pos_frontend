/*
 * The 404 body, shared by both editions.
 *
 * Same rationale as `site-links.ts`: India and the US render the SAME markup
 * and the same `app/landing.css` design system, and only the link targets
 * differ — so a change to the 404 lands on both editions at once instead of
 * drifting. The CSS is imported here rather than in each page so a new caller
 * cannot forget it.
 */
import "@/app/landing.css";
import type { MarketingRegion } from "@/lib/marketing/region";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import NotFoundPath from "@/components/marketing/not-found-path";
import { REGION_SITE } from "@/components/marketing/site-links";

const TILES: [slug: string, label: string, sub: string, icon: string][] = [
  [
    "/features",
    "Features",
    "All 22 modules",
    '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
  ],
  [
    "/pricing",
    "Pricing",
    "Plans and billing",
    '<path d="M7.5 5h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2"/>',
  ],
  [
    "/changelog",
    "Changelog",
    "What shipped recently",
    '<path d="M12 7.2V12l3 1.8"/><circle cx="12" cy="12" r="8.6"/>',
  ],
  [
    "/contact",
    "Contact support",
    "We reply in a day",
    '<path d="M3.5 6.5h17v11a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M4 7l8 6.4L20 7"/>',
  ],
];

export default function NotFoundView({ region }: { region: MarketingRegion }) {
  const site = REGION_SITE[region];
  // The India pages live at the root (`/features`); the US mirrors under
  // `/us/features`. Never send a US visitor to India-specific copy.
  const prefix = region === "INTL" ? "/us" : "";

  return (
    <>
      <SiteHeader region={region} />

      <section className="nf-hero">
        <div className="hero-bg" />
        <div className="hero-grid" />

        <div className="nf-code">404</div>
        <h1>
          This page isn&apos;t <em>in stock.</em>
        </h1>
        <p>
          We couldn&apos;t find what you were looking for. The link may be mistyped, or the page may have
          moved since it was shared with you.
        </p>

        <NotFoundPath />

        <div className="hero-actions">
          <a className="btn-hero btn-hero-pri" href={site.home}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
              <path d="M3.6 10.6 12 3.8l8.4 6.8V19a1.6 1.6 0 0 1-1.6 1.6H5.2A1.6 1.6 0 0 1 3.6 19z" />
              <path d="M9.6 20.6v-6.4h4.8v6.4" />
            </svg>
            Back to home
          </a>
          <a className="btn-hero btn-hero-sec" href={site.appHref}>
            Open the app →
          </a>
        </div>

        <div className="nf-links">
          {TILES.map(([slug, label, sub, icon]) => (
            <a className="nf-link" href={prefix + slug} key={slug}>
              <div className="ico">
                <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: icon }} />
              </div>
              <div>
                <b>{label}</b>
                <span>{sub}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter region={region} />
    </>
  );
}
