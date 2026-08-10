"use client";

import { useEffect } from "react";

import { AmbelMark } from "@/components/brand/ambel-mark";

const LOGO = <AmbelMark size={38} />;

export default function SiteHeader({ authenticated = false }: { authenticated?: boolean }) {
  useEffect(() => {
    const nav = document.getElementById("main-nav");
    const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav id="main-nav">
      <a href="/" className="nav-logo">
        <div className="nav-logo-mark">{LOGO}</div>
        <span className="nav-logo-text">Ambel POS</span>
      </a>
      <div className="nav-links">
        <a href="/features">Features</a>
        <a href="/#how">How it works</a>
        <a href="/#screens">Screens</a>
        <a href="/pricing">Pricing</a>
      </div>
      <div className="nav-ctas">
        {authenticated ? (
          <a className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }} href="/app/dashboard">Back to Billing</a>
        ) : (
          <>
            <a className="btn-outline" style={{ display: "inline-flex", alignItems: "center" }} href="/login">Log in</a>
            <a className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }} href="/signup">Choose a plan</a>
          </>
        )}
      </div>
    </nav>
  );
}
