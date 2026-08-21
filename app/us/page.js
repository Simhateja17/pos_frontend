"use client";

import { useRouter } from "next/navigation";
import "./landing.css";

export default function LandingPage() {
  const router = useRouter();
  const goAuth = () => router.push("/us/auth");

  return (
    <div className="landing">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="page">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-mark">AP</div>
            <span>Ambel POS</span>
          </div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Help</a>
          </nav>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-ghost" onClick={goAuth}>
              Sign in
            </button>
            <button className="btn btn-primary" onClick={goAuth}>
              Choose a plan
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="us-hero">
          <h1>Modern POS for US Retail</h1>
          <p>
            Sales tax automation, omnichannel sync, offline-first billing. Built
            for boutiques and multi-location retailers.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={goAuth}>
              Choose a plan
            </button>
            <button className="btn btn-ghost btn-lg">Watch demo</button>
          </div>
        </section>

        {/* Features */}
        <section className="features" id="features">
          <h2>Why Ambel POS?</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🧮</div>
              <h3>Sales Tax Automation</h3>
              <p>
                State, county, city nexus resolved automatically. Never file
                wrong again.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Omnichannel Sync</h3>
              <p>One inventory across store POS, Shopify, BOPIS, and pickup orders.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📡</div>
              <h3>Offline-First Billing</h3>
              <p>
                Keep selling when internet drops. Auto-sync when you&apos;re back
                online.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing" id="pricing">
          <h2>Simple Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-name">Starter</div>
              <div className="pricing-price">
                $49<span>/mo</span>
              </div>
              <div className="pricing-desc">For focused retail teams</div>
              <ul className="pricing-list">
                <li>2 locations · 5 users · 3 registers</li>
                <li>Unlimited POS transactions</li>
                <li>ML reorder intelligence</li>
                <li>Sales tax configuration</li>
                <li>Digital receipts and offline billing</li>
              </ul>
              <button className="btn btn-ghost" onClick={goAuth}>
                Choose Starter
              </button>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-name">Growth</div>
              <div className="pricing-price">
                $99<span>/mo</span>
              </div>
              <div className="pricing-desc">For growing multi-location retailers</div>
              <ul className="pricing-list">
                <li>5 locations · 15 users · 8 registers</li>
                <li>Unlimited POS transactions</li>
                <li>ML reorder intelligence</li>
                <li>Sales tax configuration</li>
                <li>Priority support</li>
              </ul>
              <button className="btn btn-primary" onClick={goAuth}>
                Choose Growth
              </button>
            </div>
            <div className="pricing-card">
              <div className="pricing-name">Pro</div>
              <div className="pricing-price">
                $199<span>/mo</span>
              </div>
              <div className="pricing-desc">For established retail operations</div>
              <ul className="pricing-list">
                <li>15 locations · 25 users · 15 registers</li>
                <li>Unlimited POS transactions</li>
                <li>ML reorder intelligence</li>
                <li>Sales tax configuration</li>
                <li>Flexible location, register and user add-ons</li>
              </ul>
              <button className="btn btn-ghost" onClick={goAuth}>
                Choose Pro
              </button>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="social-proof">
          <p>
            <strong>Trusted by 500+ US retailers</strong>
          </p>
          <div className="logos">
            <div className="logo-item">The Dresser</div>
            <div className="logo-item">Style &amp; Co</div>
            <div className="logo-item">Urban Fits</div>
            <div className="logo-item">Hatch Vintage</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>
            &copy; 2026 Ambel POS. <a href="#">Privacy</a> ·{" "}
            <a href="#">Terms</a> · <a href="#">Contact</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
