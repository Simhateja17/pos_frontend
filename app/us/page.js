"use client";

/*
 * US edition landing page.
 *
 * Structurally identical to the India landing (`app/page.js`): it imports the
 * same `app/landing.css` design system and composes the same SiteHeader /
 * SiteFooter / PricingGrid components, passing region="US". Only the copy and
 * the mock figures are market-specific, so a change to the design system lands
 * on both editions at once instead of drifting.
 */

import "@/app/landing.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AmbelMark } from "@/components/brand/ambel-mark";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { FEAT_ICONS, US_FEATURES } from "@/components/marketing/features-data";
import { PricingGrid } from "@/components/marketing/pricing-plans";

const MOCK_SB = ["Dashboard", "Checkout", "Sales Tax", "Offline Sync", "Inventory", "Online Orders", "Receipts", "Hardware", "Reports"];
const MOCK_KPI = [
  ["Net Sales", "$8,642", true],
  ["Transactions", "128", false],
  ["Avg Ticket", "$67.52", false],
  ["Margin", "58.4%", false],
];
const MOCK_LIST = [
  { bg: "#EEF4FF", color: "var(--brand-1)", bill: "AUS-24850", who: "Harper Lee · Tap", amt: "$251.97" },
  { bg: "#FEF3E0", color: "#B45309", bill: "AUS-24849", who: "Walk-in · Cash", amt: "$48.20" },
  { bg: "#ECFDF5", color: "#0f8f63", bill: "WEB-1842", who: "Nora Patel · BOPIS", amt: "$164.50" },
];
const MOCK_BARS = [38, 52, 44, 68, 60, 72, 58, 80, 70, 76];

const STEPS = [
  ["Store\nProfile", "Set your EIN, store address, timezone and receipt header"],
  ["Sales Tax\nNexus", "Register your states; rates and districts resolve automatically"],
  ["Import\nCatalog", "CSV import or manual: 4,826 SKUs with variants in minutes"],
  ["Pair\nHardware", "Card reader, scanner, receipt printer and cash drawer in one screen"],
  ["First\nSale", "Run a test transaction, verify the receipt, open for business"],
];

const GALLERY = [
  ["Dashboard", "#0A2348", "Net sales, tickets, tax collected, action center"],
  ["Checkout", "#06337A", "Cart, variant picker, tax, tender, receipt in one screen"],
  ["Sales Tax", "#1A3A5C", "Nexus states, jurisdiction split, taxability, filing alerts"],
  ["Offline Sync", "#0E2642", "Local-first register, store-and-forward, conflict resolver"],
  ["Inventory", "#0A2348", "Variant matrix, transfers, purchase orders, reorder points"],
  ["Online Orders", "#06337A", "Shopify sync, BOPIS queue, ship-from-store, pickup shelves"],
  ["Receipts", "#1A3A5C", "Email and SMS delivery, return barcode, tax breakdown"],
  ["Hardware", "#0E2642", "Readers, scanners, printers and drawers with diagnostics"],
  ["Reports", "#0A2348", "Best sellers, margin, tax liability, scheduled delivery"],
  ["Onboarding", "#06337A", "Guided first-run setup with a live launch checklist"],
  ["Dashboard", "#0A2348", "Net sales, tickets, tax collected, action center"],
  ["Checkout", "#06337A", "Cart, variant picker, tax, tender, receipt in one screen"],
  ["Sales Tax", "#1A3A5C", "Nexus states, jurisdiction split, taxability, filing alerts"],
  ["Offline Sync", "#0E2642", "Local-first register, store-and-forward, conflict resolver"],
  ["Inventory", "#0A2348", "Variant matrix, transfers, purchase orders, reorder points"],
  ["Online Orders", "#06337A", "Shopify sync, BOPIS queue, ship-from-store, pickup shelves"],
];
const GC_BAR_W = [88, 72, 94];
const GC_BAR_BG = ["#EEF4FF", "#F5F6F9", "#fff"];

const TESTIMONIALS = [
  ["AM", "#0058BA", "Ambel POS runs checkout, tax and our Shopify stock pool from one place. Ringing up a customer takes half the taps it used to.", "Ava Mitchell", "Owner, The Dresser · Austin, TX"],
  ["RK", "#0E7490", "Multi-state nexus used to be a monthly panic. Now the rates resolve per transaction and the filing alerts land before the deadline.", "Ryan Keller", "CFO, Style & Co · Denver, CO"],
  ["PS", "#6D28D9", "A storm took our internet out on a Saturday. We kept selling all afternoon and everything reconciled the moment we reconnected.", "Priya Shah", "Store Manager, Urban Fits · Chicago, IL"],
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

export default function USLandingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const goAuth = () => {
    window.location.href = "/us/auth";
  };

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
      const fmt = (v) => (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US"));
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
      <SiteHeader authenticated={authenticated} region="US" />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-badge"><span></span> Sales-tax native · Omnichannel · Offline-first</div>
        <h1 className="hero-h1">US retail, run from<br /><em>one register.</em></h1>
        <p className="hero-sub">Checkout, sales tax, inventory, online orders, receipts and reports, unified in one beautiful POS built for American boutiques and multi-location retailers.</p>
        <div className="hero-actions">
          <button className="btn-hero btn-hero-pri" onClick={goAuth}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round" }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Choose a plan
          </button>
          <button className="btn-hero btn-hero-sec">Watch 2-min demo</button>
        </div>
        <div className="hero-trust">
          <span>✓ No setup fee</span>
          <span className="dot"></span>
          <span>✓ Sales tax handled from day 1</span>
          <span className="dot"></span>
          <span>✓ Works offline</span>
          <span className="dot"></span>
          <span>✓ Secure USD checkout</span>
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
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="500">0</span><span>+</span></div><div className="stat-label">US retailers on Ambel</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="240" data-prefix="$" data-suffix="M+">$0M+</span></div><div className="stat-label">GMV processed annually</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="99.98" data-suffix="%">0%</span></div><div className="stat-label">Uptime SLA</div></div>
          <div className="stat-item"><div className="stat-num"><span className="cv" data-count="12000">0</span><span>+</span></div><div className="stat-label">Tax jurisdictions covered</div></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z" /></svg>
            Built for US retail
          </div>
          <h2 className="section-h animate-in">Everything your store needs,<br /><em>nothing it doesn&apos;t.</em></h2>
          <p className="section-sub animate-in">Deeply-integrated modules, all designed around US sales tax, card-present payments, and the real complexity of multi-location omnichannel retail.</p>
          <div className="features-grid">
            {US_FEATURES.map((f, i) => (
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
          <button className="btn-primary" style={{ height: 52, padding: "0 32px", borderRadius: 14, fontSize: 16, fontFamily: "var(--display)", fontWeight: 700, marginTop: 40 }} onClick={goAuth}>Start onboarding →</button>
        </div>
      </section>

      {/* SCREEN GALLERY */}
      <section className="gallery-section" id="screens">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="11" rx="2.2" /></svg>
            Ten screens, zero compromises
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.5 5h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2" /></svg>
            Simple, transparent pricing
          </div>
          <h2 className="section-h animate-in" style={{ margin: "0 auto" }}>One flat price. <em>Scale without limits.</em></h2>
          <p className="section-sub animate-in" style={{ margin: "14px auto 0" }}>No per-transaction fees. No hidden charges. Cancel any time.</p>
          <PricingGrid animate region="US" />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="social-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.6" /><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0" /></svg>
            Trusted by retailers across the US
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
        <p className="animate-in">Join 500+ US retailers already running on Ambel POS. Choose a paid plan and activate your store.</p>
        <div className="cta-actions">
          <button className="btn-cta-w" onClick={goAuth}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, stroke: "var(--brand-1)", fill: "none", strokeWidth: 2, strokeLinecap: "round" }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Choose a plan
          </button>
          <button className="btn-cta-g" onClick={() => { window.location.href = "/us/dashboard"; }}>Explore prototype →</button>
        </div>
        <p className="cta-note">Secure checkout · monthly or annual billing · cancel at cycle end</p>
      </section>

      {/* FOOTER */}
      <SiteFooter region="US" />
    </>
  );
}
