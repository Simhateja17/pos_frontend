"use client";

import "./landing.css";
import { useEffect } from "react";

/* ---- icon path sets (inner SVG markup) ---- */
const FEAT_ICONS = {
  bill: '<path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z"/><path d="M8.7 8.5V6.2a3.3 3.3 0 0 1 6.6 0v2.3"/>',
  bolt: '<path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z"/>',
  inventory: '<path d="M3.2 8.4 12 3.8l8.8 4.6-8.8 4.6z"/><path d="M3.2 8.4v7.3l8.8 4.6 8.8-4.6V8.4M12 13v7.7"/>',
  channels: '<circle cx="12" cy="12" r="2.4"/><path d="M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 7.2a6.8 6.8 0 0 1 0 9.6M4.2 4.2a11 11 0 0 0 0 15.6M19.8 4.2a11 11 0 0 1 0 15.6"/>',
  staff: '<circle cx="9" cy="8.2" r="3.1"/><path d="M3.5 19.4a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3 3 0 0 1 0 5.8M17.2 13.6a5.5 5.5 0 0 1 3.3 5.3"/>',
  reports: '<path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5"/><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6"/><circle cx="20.2" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
  customer: '<circle cx="12" cy="8" r="3.6"/><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0"/>',
  challan: '<path d="M2.6 6.4A1.5 1.5 0 0 1 4.1 5h8.4a1.5 1.5 0 0 1 1.5 1.5V16H2.6z"/><path d="M14 9h3.6l3.4 3.6V16H14z"/><circle cx="7" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/>',
  payments: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.6"/><path d="M2.5 9.6h19"/><path d="M5.8 14.6H10"/>',
};

const LOGO = (
  <img
    src="/logo.png"
    alt="Couture POS"
    style={{ maxWidth: "68%", maxHeight: "68%", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
  />
);

const MOCK_SB = ["Dashboard", "Billing", "Sales / Orders", "Inventory", "Customers", "Staff", "Payments", "Reports", "Analytics"];
const MOCK_KPI = [
  ["Today Sales", "₹4.84 L", true],
  ["Bills", "342", false],
  ["Avg Bill", "₹1,415", false],
  ["Margin", "37.4%", false],
];
const MOCK_LIST = [
  { bg: "#EEF4FF", color: "var(--brand-1)", inv: "INV-24850", who: "Anika Kapoor · UPI", amt: "₹4,280" },
  { bg: "#FEF3E0", color: "#B45309", inv: "INV-24849", who: "Walk-in · Cash", amt: "₹1,240" },
  { bg: "#ECFDF5", color: "#0f8f63", inv: "INV-24848", who: "Rohit Mehra · Card", amt: "₹8,650" },
];
const MOCK_BARS = [38, 52, 44, 68, 60, 72, 58, 80, 70, 76];

const FEATURES = [
  ["bill", "Billing & Cart", "Ultra-fast billing with barcode scan, product search, multi-cashier, split payment, and real-time GST calculation on every line.", "EXISTING", ""],
  ["bolt", "AI Copilot", "Ask your store anything. Copilot reads live data — stock, sales, customers — and proposes actions with data basis, requiring your approval.", "NEW", "AI"],
  ["inventory", "Inventory & Variants", "Size × colour matrix editor, batch tracking, expiry alerts, smart reorder with Prophet forecasting, and one-click barcode labels.", "", "★"],
  ["channels", "Omnichannel", "POS + website + Instagram + marketplace, all sharing one live stock pool. Orders flow in from every channel automatically.", "NEW", ""],
  ["staff", "Staff & Commissions", "Role-based permissions, shift scheduling, attendance, and an AI coaching score that nudges cashiers on the POS in real time.", "NEW", "★"],
  ["reports", "GST & Reports", "GSTR-1 ready reports, daily P&L, custom builder, scheduled exports — and a direct filing API to the GST portal (coming).", "", ""],
  ["customer", "Loyalty & CRM", "Tiered points, gift cards, WhatsApp campaigns, DND-safe DLT templates, and AI-segmented audience builder.", "", "IMPROVE"],
  ["challan", "Delivery Challan", "Legally-required B2B and inter-branch dispatch documents, one-click convert to tax invoice on delivery.", "NEW", ""],
  ["payments", "Payments & Settlement", "UPI, card, cash, split — with PSP-level UTR matching, daily settlement reconciliation, and failed-payment resolution.", "", "★"],
];

const STEPS = [
  ["Business\nProfile", "Set your GSTIN, invoice header & store branding"],
  ["GST &\nTax Setup", "Map HSN/SAC codes, configure slabs & round-off"],
  ["Import\nCatalog", "CSV import or manual — 408 products in 4 minutes"],
  ["Pair\nHardware", "Printer, scanner & cash drawer paired in one screen"],
  ["First\nSale", "Run a test bill, verify receipt, open for the day"],
];

const GALLERY = [
  ["Dashboard", "#0A2348", "Sales overview, KPIs, action center, AI suggestions"],
  ["Billing", "#06337A", "Cart, search, loyalty, payment, GST — in one screen"],
  ["Inventory", "#1A3A5C", "Stock matrix, variants, expiry, smart reorder"],
  ["Analytics", "#0E2642", "Footfall, margin, Prophet forecast, anomaly detection"],
  ["Customers", "#0A2348", "CRM, loyalty tiers, gift cards, WhatsApp campaigns"],
  ["Payments", "#06337A", "PSP settlement, UTR match, failed payment queue"],
  ["Staff", "#1A3A5C", "Roster, permissions matrix, commissions, AI coach"],
  ["Settings", "#0E2642", "12 setting cards, each with its own detail sub-screen"],
  ["Reports", "#0A2348", "GST-ready exports, custom builder, scheduled delivery"],
  ["AI Copilot", "#06337A", "Ask anything — Copilot reads your live store data"],
  ["Dashboard", "#0A2348", "Sales overview, KPIs, action center, AI suggestions"],
  ["Billing", "#06337A", "Cart, search, loyalty, payment, GST — in one screen"],
  ["Inventory", "#1A3A5C", "Stock matrix, variants, expiry, smart reorder"],
  ["Analytics", "#0E2642", "Footfall, margin, Prophet forecast, anomaly detection"],
  ["Customers", "#0A2348", "CRM, loyalty tiers, gift cards, WhatsApp campaigns"],
  ["Payments", "#06337A", "PSP settlement, UTR match, failed payment queue"],
];
const GC_BAR_W = [88, 72, 94];
const GC_BAR_BG = ["#EEF4FF", "#F5F6F9", "#fff"];

const TESTIMONIALS = [
  ["AM", "#0058BA", "Couture POS handles our 3-store billing, inventory sync and WhatsApp campaigns in one place. Our staff billing time dropped by 40%.", "Ananya Mehta", "Owner, Rangreza Ethnic · Jaipur"],
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
  // Full page load so the POS app's DOM-injecting script boots fresh every time
  const goApp = () => {
    window.location.href = "/app";
  };

  useEffect(() => {
    // Nav shadow on scroll
    const nav = document.getElementById("main-nav");
    const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll);

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
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      statsIo.disconnect();
      glowHandlers.forEach(([c, h]) => c.removeEventListener("pointermove", h));
    };
  }, []);

  return (
    <>
      {/* NAV */}
      <nav id="main-nav">
        <a href="#" className="nav-logo">
          <div className="nav-logo-mark">{LOGO}</div>
          <span className="nav-logo-text">Couture POS</span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#screens">Screens</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-ctas">
          <button className="btn-outline" onClick={goApp}>Log in</button>
          <button className="btn-primary" onClick={goApp}>Start free trial</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-badge"><span></span> Now with AI Copilot · GST-native · Offline-first</div>
        <h1 className="hero-h1">India&apos;s retail suite,<br /><em>finally complete.</em></h1>
        <p className="hero-sub">Billing, inventory, staff, loyalty, analytics and compliance — unified in one beautiful POS built for the modern Indian retailer.</p>
        <div className="hero-actions">
          <button className="btn-hero btn-hero-pri" onClick={goApp}>
            <svg style={{ width: 18, height: 18, stroke: "#fff", fill: "none", strokeWidth: 2, strokeLinecap: "round", verticalAlign: -3, marginRight: 8 }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
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
          <span>✓ 14-day free trial</span>
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
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#6C9FFF,#0058BA)", display: "grid", placeItems: "center" }}>
                    <img src="/logo.png" alt="Couture POS" style={{ maxWidth: "70%", maxHeight: "70%", width: "auto", height: "auto", objectFit: "contain", display: "block" }} />
                  </div>
                  Couture POS
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
                      <div className="ml-text">{r.inv} · {r.who}</div>
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
                  <div className="step-h">{l1}<br />{l2}</div>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.5 5h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2" /></svg>
            Simple, transparent pricing
          </div>
          <h2 className="section-h animate-in" style={{ margin: "0 auto" }}>Start free. <em>Scale without limits.</em></h2>
          <p className="section-sub animate-in" style={{ margin: "14px auto 0" }}>No per-transaction fees. No hidden charges. Cancel any time.</p>
          <div className="pricing-grid">
            <div className="price-card animate-in">
              <div className="price-plan">Starter</div>
              <div className="price-h">₹999<span>/mo</span></div>
              <div className="price-sub">1 store · 2 counters</div>
              <ul className="price-features">
                <li>Billing, inventory, orders</li>
                <li>UPI, card, cash payments</li>
                <li>GST-ready reports</li>
                <li>Up to 5 staff accounts</li>
                <li>Email support</li>
              </ul>
              <button className="price-btn price-btn-default" onClick={goApp}>Get started free</button>
            </div>
            <div className="price-card featured animate-in" style={{ position: "relative" }}>
              <div className="price-popular">Most popular</div>
              <div className="price-plan" style={{ color: "rgba(255,255,255,.75)" }}>Growth</div>
              <div className="price-h">₹2,499<span style={{ color: "rgba(255,255,255,.7)" }}>/mo</span></div>
              <div className="price-sub" style={{ color: "rgba(255,255,255,.65)" }}>Up to 3 stores · unlimited counters</div>
              <ul className="price-features" style={{ color: "rgba(255,255,255,.9)" }}>
                <li>Everything in Starter</li>
                <li>Loyalty, gift cards & CRM</li>
                <li>Sales channels (online + social)</li>
                <li>Delivery challan & receivables</li>
                <li>AI Copilot (100 queries/mo)</li>
                <li>WhatsApp campaigns</li>
                <li>Priority support</li>
              </ul>
              <button className="price-btn price-btn-white" onClick={goApp}>Start 14-day free trial</button>
            </div>
            <div className="price-card animate-in">
              <div className="price-plan">Enterprise</div>
              <div className="price-h">Custom</div>
              <div className="price-sub">Unlimited stores & counters</div>
              <ul className="price-features">
                <li>Everything in Growth</li>
                <li>Unlimited AI Copilot queries</li>
                <li>Custom report builder & API</li>
                <li>Integration marketplace</li>
                <li>Dedicated account manager</li>
                <li>SLA guarantee · 99.98% uptime</li>
              </ul>
              <button className="price-btn price-btn-default" onClick={goApp}>Talk to sales</button>
            </div>
          </div>
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
        <p className="animate-in">Join 2,400+ retailers already running on Couture POS. Start free, no card required.</p>
        <div className="cta-actions">
          <button className="btn-cta-w" onClick={goApp}>
            <svg style={{ width: 18, height: 18, stroke: "var(--brand-1)", fill: "none", strokeWidth: 2, strokeLinecap: "round", verticalAlign: -3, marginRight: 8 }} viewBox="0 0 24 24"><path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z" /></svg>
            Start free trial
          </button>
          <button className="btn-cta-g" onClick={goApp}>Explore prototype →</button>
        </div>
        <p className="cta-note">No credit card · 14-day free trial · cancel any time</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="nav-logo-mark">{LOGO}</div>
              <span className="nav-logo-text">Couture POS</span>
            </div>
            <p>India&apos;s most complete retail suite — GST-native, AI-powered, offline-first.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#">Features</a><a href="#">Pricing</a><a href="#">Changelog</a><a href="#">Roadmap</a>
          </div>
          <div className="footer-col">
            <h4>Retail</h4>
            <a href="#">Fashion & Apparel</a><a href="#">Beauty & Wellness</a><a href="#">Electronics</a><a href="#">Multi-store</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a><a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Couture Retail Technologies Pvt. Ltd.</span>
          <div style={{ display: "flex", gap: 20 }}><a href="#">Privacy</a><a href="#">Terms</a><a href="#">GST: 27ABCDE1234F1Z5</a></div>
        </div>
      </footer>
    </>
  );
}
