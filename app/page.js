"use client";

import "./landing.css";
import { CurrencyMark } from "@/components/marketing/currency-mark";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AmbelMark } from "@/components/brand/ambel-mark";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { FEAT_ICONS, FEATURES } from "@/components/marketing/features-data";
import { PricingGrid } from "@/components/marketing/pricing-plans";

const MOCK_SB = ["Dashboard", "Billing", "Sales / Bills", "Inventory", "Customers", "Staff", "Payments", "Reports", "Analytics"];
const MOCK_KPI = [
  ["Today Sales", "₹4.84 L", true],
  ["Bills", "342", false],
  ["Avg Bill", "₹1,415", false],
  ["Margin", "37.4%", false],
];
const MOCK_LIST = [
  { bg: "#EEF4FF", color: "var(--brand-1)", bill: "INV-24850", who: "Anika Kapoor · UPI", amt: "₹4,280" },
  { bg: "#FEF3E0", color: "#B45309", bill: "INV-24849", who: "Walk-in · Cash", amt: "₹1,240" },
  { bg: "#ECFDF5", color: "#0f8f63", bill: "INV-24848", who: "Rohit Mehra · Card", amt: "₹8,650" },
];
const MOCK_BARS = [38, 52, 44, 68, 60, 72, 58, 80, 70, 76];

const STEPS = [
  ["Business\nProfile", "Set your GSTIN, invoice header & store branding"],
  ["GST &\nTax Setup", "Map HSN/SAC codes, configure slabs & round-off"],
  ["Import\nCatalog", "CSV import or manual: 408 products in 4 minutes"],
  ["Pair\nHardware", "Printer, scanner & cash drawer paired in one screen"],
  ["First\nSale", "Run a test bill, verify the Tax Invoice, open for the day"],
];

const GALLERY = [
  ["Dashboard", "#0A2348", "Sales overview, KPIs, action center, AI suggestions"],
  ["Billing", "#06337A", "Cart, search, loyalty, payment, GST, all in one screen"],
  ["Inventory", "#1A3A5C", "Stock matrix, variants, expiry, smart reorder"],
  ["Analytics", "#0E2642", "Footfall, margin, Prophet forecast, anomaly detection"],
  ["Customers", "#0A2348", "CRM, loyalty tiers, gift cards, WhatsApp campaigns"],
  ["Payments", "#06337A", "PSP settlement, UTR match, failed payment queue"],
  ["Staff", "#1A3A5C", "Roster, permissions matrix, commissions, AI coach"],
  ["Settings", "#0E2642", "12 setting cards, each with its own detail sub-screen"],
  ["Reports", "#0A2348", "GST-ready exports, custom builder, scheduled delivery"],
  ["AI Copilot", "#06337A", "Ask anything. Copilot reads your live store data"],
  ["Dashboard", "#0A2348", "Sales overview, KPIs, action center, AI suggestions"],
  ["Billing", "#06337A", "Cart, search, loyalty, payment, GST, all in one screen"],
  ["Inventory", "#1A3A5C", "Stock matrix, variants, expiry, smart reorder"],
  ["Analytics", "#0E2642", "Footfall, margin, Prophet forecast, anomaly detection"],
  ["Customers", "#0A2348", "CRM, loyalty tiers, gift cards, WhatsApp campaigns"],
  ["Payments", "#06337A", "PSP settlement, UTR match, failed payment queue"],
];
const GC_BAR_W = [88, 72, 94];
const GC_BAR_BG = ["#EEF4FF", "#F5F6F9", "#fff"];

const TESTIMONIALS = [
  ["AM", "#0058BA", "Ambel POS handles our 3-store billing, inventory sync and WhatsApp campaigns in one place. Our staff billing time dropped by 40%.", "Ananya Mehta", "Owner, Rangreza Ethnic · Jaipur"],
  ["RK", "#0E7490", "The GST reports save us 2 hours every month-end. GSTR-1 export is error-free and our CA is happy.", "Rohan Khanna", "CFO, Threads & Threads · Mumbai"],
  ["PS", "#6D28D9", "The offline mode is a lifesaver during monsoons when our internet drops. Bills keep printing and sync later.", "Priya Sharma", "Store Manager, Silkworm · Pune"],
];

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
        <div className="hero-badge"><span></span> Now with AI Copilot · GST-native · Offline-first</div>
        <h1 className="hero-h1">India&apos;s retail suite,<br /><em>finally complete.</em></h1>
        <p className="hero-sub">Billing, inventory, staff, loyalty, analytics and compliance, unified in one beautiful POS built for the modern Indian retailer.</p>
        <div className="hero-actions">
          <button className="btn-hero btn-hero-pri" onClick={goApp}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round" }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Explore prototype
          </button>
          <button className="btn-hero btn-hero-sec">Watch 2-min demo</button>
        </div>
        <div className="hero-trust">
          <span>✓ No setup fee</span>
          <span className="dot"></span>
          <span>✓ GST-compliant from day 1</span>
          <span className="dot"></span>
          <span>✓ Works offline</span>
          <span className="dot"></span>
          <span>✓ Paid plans with secure checkout</span>
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

      {/* STATS BAND */}
      <div className="stats-band animate-in">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="2400">0</span><span>+</span></div><div className="stat-label">Stores across India</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="18" data-prefix="₹" data-suffix=" Cr+">₹0 Cr+</span></div><div className="stat-label">GMV processed monthly</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="99.98" data-suffix="%">0%</span></div><div className="stat-label">Uptime SLA</div></div>
          <div className="stat-item"><div className="stat-num"><span>#</span><span className="cv" data-count="22">0</span></div><div className="stat-label">Integrated modules</div></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z" /></svg>
            Built for Indian retail
          </div>
          <h2 className="section-h animate-in">Everything your store needs,<br /><em>nothing it doesn&apos;t.</em></h2>
          <p className="section-sub animate-in">22 deeply-integrated modules, all designed around GST compliance, Indian payment rails, and the real complexity of multi-store fashion retail.</p>
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
            Get started in 30 minutes
          </div>
          <h2 className="section-h animate-in" style={{ margin: "0 auto" }}>From empty to first sale,<br /><em>guided every step.</em></h2>
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
            22 screens, zero compromises
          </div>
          <h2 className="section-h animate-in">Every screen designed<br />for <em>retail professionals.</em></h2>
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
          {plansState === "loaded" && plans.length > 0 && <PricingGrid plans={plans} animate />}
          {plansState === "error" && (
            <p className="section-sub" style={{ margin: "28px auto 0" }}>
              Pricing is temporarily unavailable. Please refresh, or see the{" "}
              <a href="/pricing">full pricing page</a>.
            </p>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="social-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.6" /><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0" /></svg>
            Trusted by retailers across India
          </div>
          <h2 className="section-h animate-in">Real stores, <em>real results.</em></h2>
          <div className="social-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="soc-card animate-in" key={i}>
                <div className="stars">★★★★★</div>
                <p className="soc-quote">&quot;{t[2]}&quot;</p>
                <div className="soc-author">
                  <div className="soc-ava" style={{ background: t[1] }}>{t[0]}</div>
                  <div><div className="soc-name">{t[3]}</div><div className="soc-role">{t[4]}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <svg className="cta-rings" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice"><circle cx="600" cy="200" r="180" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" /><circle cx="600" cy="200" r="280" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" /><circle cx="600" cy="200" r="380" fill="none" stroke="rgba(255,255,255,.03)" strokeWidth="1" /></svg>
        <h2 className="animate-in">Ready to transform<br />your store?</h2>
        <p className="animate-in">Join 2,400+ retailers already running on Ambel POS. Choose a paid plan and activate your store.</p>
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
