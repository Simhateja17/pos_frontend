"use client";

/*
 * US onboarding wizard shell.
 *
 * Uses the India app-shell chrome from `app/globals.css` (`.app`, `.sidebar`,
 * `.sb-brand`, `.sb-logo`, `.sb-nav`, `.sb-group`, `.sb-foot`, `.sys-pill`,
 * `.content`); `onboarding.css` adds only the wizard-specific pieces, scoped
 * under `.us-onboarding`.
 */

import { useRouter } from "next/navigation";
import { AmbelMark } from "@/components/brand/ambel-mark";
import { STEPS, FINAL_ROUTE } from "./steps";
import "./onboarding.css";

export default function OnboardingShell({ step }) {
  const router = useRouter();
  const current = step;
  const total = STEPS.length;
  const data = STEPS[current - 1];

  function goNext() {
    if (current < total) {
      router.push(`/us/onboarding/${current + 1}`);
    } else {
      try {
        localStorage.setItem("setupComplete", "true");
      } catch {}
      router.push(FINAL_ROUTE);
    }
  }

  function goBack() {
    if (current > 1) router.push(`/us/onboarding/${current - 1}`);
    else router.push("/us/auth");
  }

  function goSkip() {
    try {
      localStorage.setItem("setupComplete", "skipped");
    } catch {}
    router.push(FINAL_ROUTE);
  }

  // Intercept the Continue/Finish submit from the injected markup.
  function onSubmit(e) {
    if (e.target.matches("[data-onboarding-form]")) {
      e.preventDefault();
      goNext();
    }
  }

  // Intercept Back / Skip buttons from the injected markup.
  function onClick(e) {
    const navBtn = e.target.closest("[data-nav]");
    if (!navBtn) return;
    if (navBtn.dataset.nav === "back") goBack();
    else if (navBtn.dataset.nav === "skip") goSkip();
  }

  return (
    <div className="us-onboarding app">
      <div className="ob-progress">
        <i style={{ width: `${(current / total) * 100}%` }} />
      </div>

      <aside className="sidebar" aria-label="Onboarding steps">
        <div className="sb-brand">
          <div className="sb-logo">
            <AmbelMark size={38} />
          </div>
          <div>
            <h1>Ambel POS</h1>
            <p>US retail edition</p>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-group">Setup · {total} steps</div>
          {STEPS.map((s) => {
            const state = s.n < current ? "done" : s.n === current ? "active" : "";
            return (
              <div key={s.n} className={`ob-step ${state}`} aria-current={s.n === current ? "step" : undefined}>
                <span className="ob-num">
                  {s.n < current ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </span>
                {s.label}
              </div>
            );
          })}
        </nav>

        <div className="sb-foot">
          <div className="sys-pill">
            <b>{data.help.title}</b>
            <p>{data.help.text}</p>
          </div>
        </div>
      </aside>

      <div className="main">
        <main
          className="content ob-inner"
          onSubmit={onSubmit}
          onClick={onClick}
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </div>
    </div>
  );
}
