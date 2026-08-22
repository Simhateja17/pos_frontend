import type { Region } from "@/components/marketing/regions";

type Plan = {
  name: string;
  price: string;
  /** List price, struck through beside `price`. Omit on plans sold at list. */
  wasPrice?: string;
  period?: string;
  sub: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export const PLANS: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    sub: "1 location · 1 user · 1 register",
    features: ["POS billing and cart", "Inventory management", "GST-ready reports and CSV export", "Offline billing and sync", "Email support"],
    ctaLabel: "Create free account",
    ctaHref: "/signup",
  },
  {
    name: "Standard",
    price: "₹649",
    period: "/mo",
    sub: "1 location · 3 users · 1 register",
    features: ["Everything in Free", "Unlimited POS transactions", "GST-ready reports and CSV export", "Offline billing and sync", "Email support"],
    ctaLabel: "Choose Standard",
    ctaHref: "/signup",
  },
  {
    name: "Professional",
    price: "₹1,299",
    period: "/mo",
    sub: "3 locations · 10 users · 3 registers",
    features: ["Everything in Standard", "Unlimited POS transactions", "GST-ready reports and CSV export", "Offline billing and sync", "Priority support"],
    featured: true,
    ctaLabel: "Choose Professional",
    ctaHref: "/signup",
  },
  {
    name: "Premium",
    price: "₹2,099",
    period: "/mo",
    sub: "5 locations · 15 users · 5 registers",
    features: ["Everything in Professional", "Unlimited POS transactions", "GST-ready reports and CSV export", "Offline billing and sync", "Priority support"],
    ctaLabel: "Choose Premium",
    ctaHref: "/signup",
  },
];


/**
 * US edition plans. Same `Plan` shape and the same `.price-card` markup as
 * India, so both editions render through one component and one stylesheet.
 */
export const US_PLANS: Plan[] = [
  {
    name: "Essentials",
    price: "$29",
    period: "/mo",
    sub: "1 location · 2 registers · unlimited staff",
    features: ["POS checkout and cart", "Sales tax automation", "Digital receipts (email/SMS)", "Offline billing and sync", "Email support"],
    ctaLabel: "Get started",
    ctaHref: "/us/auth",
  },
  {
    name: "Professional",
    price: "$79",
    period: "/mo",
    sub: "Up to 5 locations · unlimited staff",
    features: ["Everything in Essentials", "Omnichannel sync (Shopify)", "BOPIS and ship-from-store", "Advanced reports and margin", "Phone and email support"],
    featured: true,
    ctaLabel: "Choose Professional",
    ctaHref: "/us/auth",
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "Unlimited locations and registers",
    features: ["Everything in Professional", "Custom reporting and API", "Dedicated account manager", "99.98% uptime SLA", "Priority onboarding"],
    ctaLabel: "Talk to sales",
    ctaHref: "/contact",
  },
];

export function PricingGrid({ animate = false, region = "IN" }: { animate?: boolean; region?: Region }) {
  const cls = (base: string) => (animate ? `${base} animate-in` : base);
  const plans = region === "US" ? US_PLANS : PLANS;
  return (
    <div className="pricing-grid">
      {plans.map((p) => (
        <div className={cls(p.featured ? "price-card featured" : "price-card")} style={p.featured ? { position: "relative" } : undefined} key={p.name}>
          {p.featured && <div className="price-popular">Most popular</div>}
          <div className="price-plan" style={p.featured ? { color: "rgba(255,255,255,.75)" } : undefined}>{p.name}</div>
          {/* The live price is what centres under the plan name, so the struck list
              price hangs off it from out of flow: in flow it counts toward the
              centred line's width and shoves the real number off-centre.
              <s> marks it superseded; the sr-only prefix keeps the pair from being
              read out as two unrelated numbers. */}
          <div className="price-h">
            <span className="price-now">
              {p.wasPrice && <s className="price-was"><span className="sr-only">Was </span>{p.wasPrice}</s>}
              {p.price}
              {p.period && <span className="price-per" style={p.featured ? { color: "rgba(255,255,255,.7)" } : undefined}>{p.period}</span>}
            </span>
          </div>
          <div className="price-sub" style={p.featured ? { color: "rgba(255,255,255,.65)" } : undefined}>{p.sub}</div>
          <ul className="price-features" style={p.featured ? { color: "rgba(255,255,255,.9)" } : undefined}>
            {p.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <a className={p.featured ? "price-btn price-btn-white" : "price-btn price-btn-default"} style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }} href={p.ctaHref}>
            {p.ctaLabel}
          </a>
        </div>
      ))}
    </div>
  );
}
