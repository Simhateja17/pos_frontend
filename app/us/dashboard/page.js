"use client";

/*
 * US edition app shell.
 *
 * The chrome here is the India `AppShell` chrome: the same `.app` / `.sidebar`
 * / `.sb-brand` / `.sb-nav` / `.nav-item` / `.topbar` / `.content` classes from
 * `app/globals.css`, and the same mobile-drawer module the India shell uses.
 * It is a separate component only because the India shell also carries the
 * live store context, register lock and role gating that the US prototype has
 * no backend for yet: the visual language is shared, not forked.
 */

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AmbelMark } from "@/components/brand/ambel-mark";
import styles from "@/components/app-shell.module.css";
import { Screens, NAV_GROUPS, NAMES, ic } from "./screens";

const STORES = ["Austin", "Denver", "Online"];

/**
 * Count-up on the KPI figures, scoped to the content container so it re-runs
 * on every screen change. `.kv` is the India KPI value element.
 */
function animateNumbers(root) {
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  root.querySelectorAll(".kv").forEach((el, idx) => {
    const original = el.textContent.trim();
    const m = original.match(/^(\$?)([\d,]+\.?\d*)([\s\S]*)$/);
    if (!m) return;

    const prefix = m[1];
    const numStr = m[2].replace(/,/g, "");
    const suffix = m[3];
    const target = parseFloat(numStr);
    if (isNaN(target) || target <= 0) return;

    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const delay = idx * 75;
    const duration = 900;
    const t0 = performance.now();

    function fmt(v) {
      const n = v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return prefix + n + suffix;
    }

    function stepFn(ts) {
      if (!document.body.contains(el)) return;
      const elapsed = ts - t0 - delay;
      if (elapsed < 0) {
        el.textContent = fmt(0);
        requestAnimationFrame(stepFn);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(ease * target);
      if (t < 1) requestAnimationFrame(stepFn);
      else el.textContent = original;
    }

    requestAnimationFrame(stepFn);
  });
}

export default function USDashboard() {
  const [active, setActive] = useState("dash");
  const [store, setStore] = useState("Austin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => animateNumbers(el));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function go(id) {
    setMobileOpen(false);
    if (id !== active) setActive(id);
  }

  return (
    <div className="app">
      {mobileOpen && (
        <button className={styles.scrim} aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        aria-label="US application navigation"
        className={`sidebar ${styles.sidebar} ${mobileOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        <div className="sb-brand">
          <div className="sb-logo">
            <AmbelMark size={38} />
          </div>
          <div>
            <h1>Ambel POS</h1>
            <p>US retail edition</p>
          </div>
          <button className={styles.closeDrawer} aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sb-nav">
          {NAV_GROUPS.map(([group, ids]) => (
            <div key={group}>
              <div className="sb-group">{group}</div>
              {ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-current={id === active ? "page" : undefined}
                  className={`nav-item${id === active ? " active" : ""}`}
                  style={{ width: "100%", textAlign: "left", background: id === active ? undefined : "transparent", border: 0, font: "inherit" }}
                  onClick={() => go(id)}
                  dangerouslySetInnerHTML={{ __html: `${ic(id, 17)}<span>${NAMES[id]}</span>` }}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-foot">
          <div className="sys-pill">
            <b><span className="dot" />Store systems live</b>
            <p>Card reader, tax engine and receipt service healthy</p>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className={`topbar ${styles.topbar}`}>
          <button className={styles.mobileMenu} aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          <div className={`crumb ${styles.crumb}`}>
            Ambel POS / <b>{NAMES[active]}</b>
          </div>

          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input placeholder="Search products, customers, orders…  or type a command" aria-label="Search" />
            <span className="kbd">⌘K</span>
          </div>

          <div className={styles.topbarActions}>
            <div className={`store-switch ${styles.storeSwitch}`}>
              {STORES.map((s) => (
                <span
                  key={s}
                  role="button"
                  tabIndex={0}
                  className={`store-pill${s === store ? " active" : ""}`}
                  onClick={() => setStore(s)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setStore(s);
                    }
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            <div className={`tb-user ${styles.user}`}>
              <div className="tb-ava">MJ</div>
              <div>
                <div className="nm">Mia James</div>
                <div className="rl">Store manager</div>
              </div>
            </div>
          </div>
        </header>

        <main
          className={`content fade ${styles.content}`}
          key={active}
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: Screens[active]() }}
        />
      </div>
    </div>
  );
}
