"use client";

import { useEffect, useRef, useState } from "react";
import { Screens, NAV_GROUPS, NAMES, ic } from "./screens";
import "./design.css";

/* Count-up animation, ported from the original app.js but scoped
   to the content container so it re-runs on every screen change. */
function animateNumbers(root) {
  if (!root) return;
  root.querySelectorAll(".kpi-value").forEach((el, idx) => {
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

export default function Dashboard() {
  const [active, setActive] = useState("dash");
  const [store, setStore] = useState("Austin");
  const contentRef = useRef(null);

  // Fade + count-up after each screen change.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.transition =
      "opacity .32s cubic-bezier(.22,1,.36,1), transform .32s cubic-bezier(.22,1,.36,1)";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    const raf = requestAnimationFrame(() => animateNumbers(el));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  function go(id) {
    if (id === active) return;
    const el = contentRef.current;
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
    }
    setTimeout(() => setActive(id), 140);
  }

  return (
    <>
      {/* Ambient background orbs */}
      <div className="bg-canvas">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <span>CP</span>
            </div>
            <div className="brand-text">
              <strong>Couture POS</strong>
              <span>US retail edition</span>
            </div>
          </div>

          <nav id="nav">
            {NAV_GROUPS.map(([group, ids]) => (
              <div key={group}>
                <div className="nav-group-label">{group}</div>
                {ids.map((id) => (
                  <button
                    key={id}
                    className={`nav-item${id === active ? " active" : ""}`}
                    onClick={() => go(id)}
                    dangerouslySetInnerHTML={{
                      __html: `${ic(id)}<span>${NAMES[id]}</span>`,
                    }}
                  />
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="status-pod">
              <div className="status-led" />
              <div>
                <b>Store systems live</b>
                <small>Card reader, tax engine &amp; receipt service healthy</small>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          {/* Top navigation bar */}
          <header className="topbar">
            <div className="crumb">
              <span>Couture POS</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <b>{NAMES[active]}</b>
            </div>

            <div className="search">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.4-4.4" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search products, customers, orders…"
              />
              <kbd>⌘K</kbd>
            </div>

            <div className="topbar-right">
              <a className="ref-link" href="#">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 0 1-15.5 6.2" />
                  <path d="M3 12A9 9 0 0 1 18.5 5.8" />
                  <path d="M18 2v4h4M6 22v-4H2" />
                </svg>
                India ref
              </a>

              <div className="store-tabs">
                {["Austin", "Denver", "Online"].map((s) => (
                  <button
                    key={s}
                    className={`store-tab${s === store ? " active" : ""}`}
                    onClick={() => setStore(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="user-block">
                <div className="avatar">MJ</div>
                <div className="user-meta">
                  <b>Mia James</b>
                  <span>Store manager</span>
                </div>
              </div>
            </div>
          </header>

          {/* Screen content */}
          <section
            className="content"
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: Screens[active]() }}
          />
        </main>
      </div>
    </>
  );
}
