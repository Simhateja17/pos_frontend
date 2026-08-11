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
    name: "Starter",
    price: "₹799",
    wasPrice: "₹1,499",
    period: "/mo",
    sub: "1 store · 2 counters",
    features: ["Billing, inventory, orders", "UPI, card, cash payments", "GST-ready reports", "Up to 5 staff accounts", "Email support"],
    ctaLabel: "Get started free",
    ctaHref: "/app/dashboard",
  },
  {
    name: "Growth",
    price: "₹1,999",
    wasPrice: "₹3,999",
    period: "/mo",
    sub: "Up to 3 stores · unlimited counters",
    features: ["Everything in Starter", "Loyalty, gift cards & CRM", "Sales channels (online + social)", "Delivery challan & receivables", "AI Copilot (100 queries/mo)", "WhatsApp campaigns", "Priority support"],
    featured: true,
    ctaLabel: "Choose a paid plan",
    ctaHref: "/app/dashboard",
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "Unlimited stores & counters",
    features: ["Everything in Growth", "Unlimited AI Copilot queries", "Custom report builder & API", "Integration marketplace", "Dedicated account manager", "SLA guarantee · 99.98% uptime"],
    ctaLabel: "Talk to sales",
    ctaHref: "/app/dashboard",
  },
];

export function PricingGrid({ animate = false }: { animate?: boolean }) {
  const cls = (base: string) => (animate ? `${base} animate-in` : base);
  return (
    <div className="pricing-grid">
      {PLANS.map((p) => (
        <div className={cls(p.featured ? "price-card featured" : "price-card")} style={p.featured ? { position: "relative" } : undefined} key={p.name}>
          {p.featured && <div className="price-popular">Most popular</div>}
          <div className="price-plan" style={p.featured ? { color: "rgba(255,255,255,.75)" } : undefined}>{p.name}</div>
          {/* The live price is what centres under the plan name, so the struck list
              price hangs off it from out of flow — in flow it counts toward the
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
