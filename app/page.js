"use client";

import "./landing.css";
import { CurrencyMark } from "@/components/marketing/currency-mark";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AmbelMark } from "@/components/brand/ambel-mark";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { FEAT_ICONS, FEATURES } from "@/components/marketing/features-data";
import { PricingPeriod } from "@/components/marketing/pricing-period";
import { REGION_SITE } from "@/components/marketing/site-links";

const MOCK_SB = ["Dashboard", "Billing", "Reorder advice", "Inventory", "Purchases", "Transfers", "Shifts", "Returns", "Reports"];
const MOCK_KPI = [
  ["Today Sales", "₹4.84 L", true],
  ["Bills", "342", false],
  ["Avg Bill", "₹1,415", false],
  ["Margin", "37.4%", false],
];
const MOCK_LIST = [
  { bg: "#EEF4FF", color: "var(--brand-1)", bill: "INV-24850", who: "UPI · 3 items", amt: "₹4,280" },
  { bg: "#FEF3E0", color: "#B45309", bill: "INV-24849", who: "Cash · 1 item", amt: "₹1,240" },
  { bg: "#ECFDF5", color: "#0f8f63", bill: "INV-24848", who: "Card · 7 items", amt: "₹8,650" },
];
const MOCK_BARS = [38, 52, 44, 68, 60, 72, 58, 80, 70, 76];

const STEPS = [
  ["Shop\ndetails", "Your GSTIN, shop name and what should print on the bill"],
  ["Send your\ncatalogue", "Photos, supplier bills, an Excel file or a handwritten list on WhatsApp"],
  ["Check\nyour stock", "We load it in; you confirm the counts and prices are right"],
  ["Connect\nprinter", "Printer and barcode scanner, checked with a test print and a test scan"],
  ["First\nbill", "Run one test bill, look at the GST on it, and open the counter"],
];

const GALLERY = [
  ["Billing", "#0A2348", "Scan, discount, split payment, GST, bill printed"],
  ["Reorder advice", "#06337A", "What to order, how much, and the reason behind it"],
  ["Inventory", "#1A3A5C", "Variants, stock per shop, barcode labels"],
  ["Dashboard", "#0E2642", "Today's sales, margin, low stock, what needs attention"],
  ["Purchases", "#0A2348", "Suppliers, orders, and receiving goods in parts"],
  ["Transfers", "#06337A", "Send stock between shops, sent and received tracked apart"],
  ["Shifts", "#1A3A5C", "Opening cash, mid-day check, closing count, short or over"],
  ["Returns", "#0E2642", "Pull up an old bill for a return, refund or exchange"],
  ["Reports", "#0A2348", "Sales, stock value and movement, all downloadable"],
  ["Offline", "#06337A", "Bills saved on the counter machine, sent up later"],
];
const GC_BAR_W = [88, 72, 94];
const GC_BAR_BG = ["#EEF4FF", "#F5F6F9", "#fff"];

function featBadges(b3, b4) {
  return (
    <>
      {b3 === "NEW" && <span className="feat-badge new">NEW</span>}
      {b4 === "★" && <span className="feat-badge star">★ Distinctive</span>}
      {b4 === "AI" && <span className="feat-badge new">AI-powered</span>}
      {b3 === "IMPROVE" && <span className="feat-badge new">IMPROVING</span>}
    </>
  );
}

export default function LandingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [plans, setPlans] = useState([]);
  // "loading" | "loaded" | "error" — distinguishes "hasn't returned yet" from
  // "failed", since both start out as an empty plans array.
  const [plansState, setPlansState] = useState("loading");
  const goApp = () => {
    window.location.href = "/app/dashboard";
  };

  const watchDemo = () => {
    window.open("https://youtu.be/ngv2Bx-u-c4", "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let active = true;
    // Same-origin through the existing /_backend rewrite (see lib/api/client.ts)
    // — this route needs no auth/session, so a plain fetch is fine here.
    void fetch("/_backend/public/plans?region=IN")
      .then((res) => {
        if (!res.ok) throw new Error(`plans fetch failed: ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (!active) return;
        setPlans(body.plans ?? []);
        setPlansState("loaded");
      })
      .catch((err) => {
        // Swallowing this used to mean a backend hiccup made the whole
        // pricing section vanish with zero trace in the console — logging
        // it keeps that failure visible without surfacing raw errors to
        // visitors (see the plain-language fallback below instead).
        console.error("Failed to load pricing plans", err);
        if (active) setPlansState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthenticated(Boolean(session));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Reveal-on-scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".animate-in").forEach((el) => io.observe(el));

    // Count-up stats
    function countUp(el) {
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      if (isNaN(target)) return;
      const decimals = (String(target).split(".")[1] || "").length;
      const fmt = (v) => (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN"));
      const dur = 1400,
        start = performance.now();
      function frame(now) {
        let p = Math.min(1, (now - start) / dur);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt(target * p) + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = prefix + fmt(target) + suffix;
      }
      requestAnimationFrame(frame);
    }
    const statsIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll("[data-count]").forEach(countUp);
            statsIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll(".stats-band").forEach((el) => statsIo.observe(el));

    // Feature card cursor glow
    const featCards = document.querySelectorAll(".feat-card");
    const glowHandlers = [];
    featCards.forEach((card) => {
      const h = (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      };
      card.addEventListener("pointermove", h);
      glowHandlers.push([card, h]);
    });

    // Reduced motion
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      document.querySelectorAll('[style*="animation"]').forEach((el) => (el.style.animation = "none"));
    }

    return () => {
      io.disconnect();
      statsIo.disconnect();
      glowHandlers.forEach(([c, h]) => c.removeEventListener("pointermove", h));
    };
  }, []);

  return (
    <>
      {/* NAV */}
      <SiteHeader authenticated={authenticated} />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-badge"><span></span> GST on every bill · Survives a connection drop · Built for retail shops</div>
        <h1 className="hero-h1">Billing software for your shop<br /><em>that also tells you what to order.</em></h1>
        <p className="hero-sub">Send us your product photos, supplier bills, an Excel file or even a handwritten list on WhatsApp. We put your catalogue in for you, so billing, stock and GST are working together from your very first bill.</p>
        <div className="hero-actions">
          <a
            className="btn-hero btn-hero-pri"
            href={REGION_SITE.IN.demoHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round" }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Book a demo
          </a>
          <button className="btn-hero btn-hero-sec" onClick={watchDemo}>Watch 2-min demo</button>
        </div>
        <div className="hero-trust">
          <span>✓ No setup fee</span>
          <span className="dot"></span>
          <span>✓ GST-compliant from day 1</span>
          <span className="dot"></span>
          <span>✓ Billing survives a drop</span>
          <span className="dot"></span>
          <span>✓ No per-bill charges</span>
        </div>

        {/* product mock */}
        <div className="hero-mock" style={{ position: "relative" }}>
          <div className="mock-glow"></div>
          <div className="mock-frame">
            <div className="mock-bar">
              <div className="mock-dot" style={{ background: "#FF5F57" }}></div>
              <div className="mock-dot" style={{ background: "#FEBC2E" }}></div>
              <div className="mock-dot" style={{ background: "#28C840" }}></div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 6, height: 22, marginLeft: 8 }}></div>
            </div>
            <div className="mock-content">
              <div className="mock-sb">
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 12px", color: "#fff", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center" }}>
                    <AmbelMark size={24} title="Ambel POS" />
                  </div>
                  Ambel POS
                </div>
                {MOCK_SB.map((t, i) => (
                  <div className={"mock-sb-item" + (i === 0 ? " a" : "")} key={i}>
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
                    {t}
                  </div>
                ))}
              </div>
              <div className="mock-main">
                <div className="mock-topbar">
                  <div style={{ width: 80, height: 12, background: "var(--bg-2)", borderRadius: 4 }}></div>
                  <div style={{ flex: 1, height: 16, background: "#F0F0F5", borderRadius: 6, margin: "0 10px" }}></div>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-2)" }}></div>
                </div>
                <div className="mock-kpi-row">
                  {MOCK_KPI.map((k, i) => (
                    <div className="mock-kpi" key={i}>
                      <div className="mk-label" style={k[2] ? { color: "rgba(255,255,255,.7)" } : undefined}>{k[0]}</div>
                      <div className="mk-val">{k[1]}</div>
                    </div>
                  ))}
                </div>
                <div className="mock-chart">
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Sales trend</div>
                  <div className="chart-bar" id="mock-bars">
                    {MOCK_BARS.map((v, i) => {
                      const pct = Math.round((v / 80) * 100) + "%";
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                          <div className="mbar" style={{ borderRadius: "3px 3px 0 0", background: i === MOCK_BARS.length - 1 ? "var(--brand-1)" : "#E8EFFE", height: pct, ["--h"]: pct, animation: `growMock .8s var(--ease) ${i * 0.06}s` }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mock-list">
                  {MOCK_LIST.map((r, i) => (
                    <div className="ml-row" key={i}>
                      <div className="ml-dot" style={{ background: "var(--bg-2)", color: r.color }}>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 2.8h6.7l4.8 4.8V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z" /><path d="M13 2.8V7a1.2 1.2 0 0 0 1.2 1.2H18M8.5 13h7M8.5 16.5h4.5" /></svg>
                      </div>
                      <div className="ml-text">{r.bill} · {r.who}</div>
                      <div className="ml-amt">{r.amt}</div>
                      <div className="ml-badge" style={{ background: r.bg, color: r.color }}>Paid</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND: real product facts only, no customer/usage numbers we
          can't back with retained evidence (see docs/AMBEL_POS_SEO_AUDIT_2026-09-02.html) */}
      <div className="stats-band animate-in">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num is-word">WhatsApp</div><div className="stat-label">Send your catalogue, we put it in</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="799" data-prefix="₹">₹0</span></div><div className="stat-label">Starting plan, per month</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="18" data-suffix="%">0%</span></div><div className="stat-label">Slabs handled on every line</div></div>
          <div className="stat-item"><div className="stat-num is-word">No&nbsp;signal</div><div className="stat-label">Billing carries on, syncs when it returns</div></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z" /></svg>
            Built for Indian retail
          </div>
          <h2 className="section-h animate-in">Everything the counter needs,<br /><em>and nothing it doesn&apos;t.</em></h2>
          <p className="section-sub animate-in">Everything listed here is built and working today. If something is not ready yet, you will not find it on this page.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feat-card animate-in" key={i}>
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: FEAT_ICONS[f[0]] || "" }} />
                </div>
                <div className="feat-h">{f[1]}</div>
                <p className="feat-p">{f[2]}</p>
                {featBadges(f[3], f[4])}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.6c2.9 1.6 4.8 4.6 4.8 8 0 2-.9 3.8-1.9 4.9l-2.9 1.9-2.9-1.9c-1-1.1-1.9-2.9-1.9-4.9 0-3.4 1.9-6.4 4.8-8z" /></svg>
            Open the counter the same week
          </div>
          <h2 className="section-h animate-in" style={{ margin: "0 auto" }}>From empty shop to first bill,<br /><em>we do the hard part.</em></h2>
          <div className="steps-row" style={{ marginTop: 52 }}>
            {STEPS.map((s, i) => {
              const [l1, l2] = s[0].split("\n");
              return (
                <div className="step-item animate-in" key={i}>
                  <div className="step-num">{i + 1}</div>
                  {/* two spans instead of a <br> so the line break is a CSS
                      decision: the mobile timeline runs the title on one line */}
                  <div className="step-h"><span>{l1}</span>{" "}<span>{l2}</span></div>
                  <p className="step-p">{s[1]}</p>
                </div>
              );
            })}
          </div>
          <button className="btn-primary" style={{ height: 52, padding: "0 32px", borderRadius: 14, fontSize: 16, fontFamily: "var(--display)", fontWeight: 700, marginTop: 40 }} onClick={goApp}>Start onboarding →</button>
        </div>
      </section>

      {/* SCREEN GALLERY */}
      <section className="gallery-section" id="screens">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="11" rx="2.2" /></svg>
Built for retail professionals
          </div>
          <h2 className="section-h animate-in">Plain screens,<br />built for <em>a busy counter.</em></h2>
        </div>
        <div style={{ overflow: "hidden", marginTop: 0, WebkitMask: "linear-gradient(90deg,transparent,black 8%,black 92%,transparent)" }}>
          <div className="gallery-track" id="gtrack">
            {[...GALLERY, ...GALLERY].map((g, i) => (
              <div className="gallery-card" key={i}>
                <div className="gc-bar" style={{ background: g[1] }}>
                  <div className="gc-dot" style={{ background: "#FF5F57" }}></div>
                  <div className="gc-dot" style={{ background: "#FEBC2E" }}></div>
                  <div className="gc-dot" style={{ background: "#28C840" }}></div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,.15)", borderRadius: 5, height: 14, marginLeft: 6 }}></div>
                </div>
                <div className="gc-body">
                  <div className="gc-title">{g[0]}</div>
                  <div style={{ color: "var(--muted)", lineHeight: 1.55 }}>{g[2]}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    {[0, 1, 2].map((j) => (
                      <div key={j} style={{ height: 9, borderRadius: 4, background: GC_BAR_BG[j], border: "1px solid var(--border)", width: GC_BAR_W[j] + "%" }}></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <CurrencyMark region="IN" />
            Simple, transparent pricing
          </div>
          <h2 className="section-h animate-in" style={{ margin: "0 auto" }}>Choose clearly. <em>Scale with confidence.</em></h2>
          <p className="section-sub animate-in" style={{ margin: "14px auto 0" }}>No per-transaction fees. No hidden charges. Cancel any time.</p>
          {plansState === "loaded" && plans.length > 0 && <PricingPeriod plans={plans} />}
          {plansState === "error" && (
            <p className="section-sub" style={{ margin: "28px auto 0" }}>
              Pricing is temporarily unavailable. Please refresh, or see the{" "}
              <a href="/pricing">full pricing page</a>.
            </p>
          )}
        </div>
      </section>

      {/* THE REORDER ADVICE: the differentiator, stated plainly. Claims here
          are limited to what ml/forecast.py and ml/eligibility.py actually do. */}
      <section className="social-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            The part other billing software leaves to you
          </div>
          <h2 className="section-h animate-in">Your shop tells you<br /><em>what to order next.</em></h2>
          <p className="section-sub animate-in">Most software can tell you what you sold. The hard question is what to buy next week, and every owner answers it from memory. Ambel POS looks at how fast each item has been moving and how long your supplier takes, then gives you a quantity and the reason for it. For an item that is too new to judge, it says <strong>&ldquo;not enough history&rdquo;</strong> rather than putting up a number it cannot stand behind, so you know exactly which advice to trust.</p>
          <p className="section-sub animate-in">Running a <a href="/retail/grocery-supermarket">grocery or supermarket</a>? See how it fits your counter.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <svg className="cta-rings" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice"><circle cx="600" cy="200" r="180" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" /><circle cx="600" cy="200" r="280" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" /><circle cx="600" cy="200" r="380" fill="none" stroke="rgba(255,255,255,.03)" strokeWidth="1" /></svg>
        <h2 className="animate-in">Stop guessing<br />what to order.</h2>
        <p className="animate-in">Pick a plan, send us your catalogue on WhatsApp, and start billing.</p>
        <div className="cta-actions">
          <button className="btn-cta-w" onClick={goApp}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "var(--brand-1)", fill: "none", strokeWidth: 2, strokeLinecap: "round" }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Choose a plan
          </button>
          <button className="btn-cta-g" onClick={goApp}>Explore prototype →</button>
        </div>
        <p className="cta-note">Secure checkout · monthly or annual billing · cancel at cycle end</p>
      </section>

      {/* FOOTER */}
      <SiteFooter />
    </>
  );
}
