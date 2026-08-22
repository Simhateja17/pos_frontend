import type { LivePlan } from "@/lib/marketing/pricing";

const CURRENCY_SYMBOL: Record<LivePlan["currency"], string> = { INR: "₹", USD: "$" };

function formatMoney(amountMinor: number, currency: LivePlan["currency"]) {
  const major = amountMinor / 100;
  const symbol = CURRENCY_SYMBOL[currency];
  const formatted = Number.isInteger(major) ? major.toLocaleString(currency === "INR" ? "en-IN" : "en-US") : major.toFixed(2);
  return `${symbol}${formatted}`;
}

function formatAddonUnit(amountMinor: number, currency: LivePlan["currency"]) {
  return formatMoney(amountMinor, currency);
}

export function PricingGrid({ plans, animate = false }: { plans: LivePlan[]; animate?: boolean }) {
  const cls = (base: string) => (animate ? `${base} animate-in` : base);
  return (
    <div className="pricing-grid">
      {plans.map((plan) => (
        <div className={cls(plan.popular ? "price-card featured" : "price-card")} style={plan.popular ? { position: "relative" } : undefined} key={plan.key}>
          {plan.popular && <div className="price-popular">Most popular</div>}
          <div className="price-plan" style={plan.popular ? { color: "rgba(255,255,255,.75)" } : undefined}>{plan.name}</div>
          <div className="price-h">
            <span className="price-now">
              {formatMoney(plan.monthly.totalAmountMinor, plan.currency)}
              <span className="price-per" style={plan.popular ? { color: "rgba(255,255,255,.7)" } : undefined}>/mo</span>
            </span>
          </div>
          <div className="price-sub" style={plan.popular ? { color: "rgba(255,255,255,.65)" } : undefined}>
            {plan.currency === "INR" ? plan.monthly.taxLabel : "Prices shown exclude tax"}
          </div>
          <ul className="price-features" style={plan.popular ? { color: "rgba(255,255,255,.9)" } : undefined}>
            {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          {plan.addons.length > 0 && (
            <div className="price-sub" style={{ marginTop: 4, ...(plan.popular ? { color: "rgba(255,255,255,.65)" } : {}) }}>
              Beyond the included limits: {plan.addons.map((addon) => `+${formatAddonUnit(addon.unitAmountMinor, plan.currency)}/${addon.key}`).join(" · ")}
            </div>
          )}
          <a
            className={plan.popular ? "price-btn price-btn-white" : "price-btn price-btn-default"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            href={`/signup?plan=${plan.key}&region=${plan.region}`}
          >
            Choose {plan.name}
          </a>
        </div>
      ))}
    </div>
  );
}
