"use client";

import { useEffect } from "react";

import { AmbelMark } from "@/components/brand/ambel-mark";
import type { Region } from "@/components/marketing/regions";
import { REGION_SITE } from "@/components/marketing/regions";

const LOGO = <AmbelMark size={38} />;

export default function SiteHeader({
  authenticated = false,
  region = "IN",
}: {
  authenticated?: boolean;
  region?: Region;
}) {
  const site = REGION_SITE[region];

  useEffect(() => {
    const nav = document.getElementById("main-nav");
    const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav id="main-nav">
      <a href={site.home} className="nav-logo">
        <div className="nav-logo-mark">{LOGO}</div>
        <span className="nav-logo-text">Ambel POS</span>
      </a>
      <div className="nav-links">
        {site.navLinks.map(([label, href]) => (
          <a href={href} key={label}>{label}</a>
        ))}
      </div>
      <div className="nav-ctas">
        {authenticated ? (
          <a className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }} href={site.appHref}>{site.appLabel}</a>
        ) : (
          <>
            <a className="btn-outline" style={{ display: "inline-flex", alignItems: "center" }} href={site.loginHref}>Log in</a>
            <a className="btn-primary" style={{ display: "inline-flex", alignItems: "center" }} href={site.signupHref}>Choose a plan</a>
          </>
        )}
      </div>
    </nav>
  );
}
