"use client";

import { useRouter } from "next/navigation";
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
    <div className="page">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-mark">CP</div>
          <div>
            <b>Couture POS</b>
            <span>US retail edition</span>
          </div>
        </div>
        <div className="sb-label">Setup · {total} steps</div>
        <ul className="step-list">
          {STEPS.map((s) => {
            const cls =
              s.n < current ? "done" : s.n === current ? "active" : "";
            return (
              <li key={s.n} className={`step-item ${cls}`}>
                <span className="step-num">
                  {s.n < current ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      width="12"
                      height="12"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </span>
                {s.label}
              </li>
            );
          })}
        </ul>
        <div className="sb-help">
          <b>{data.help.title}</b>
          <p>{data.help.text}</p>
        </div>
      </aside>

      <main className="main">
        <div
          className="main-inner"
          onSubmit={onSubmit}
          onClick={onClick}
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </main>
    </div>
  );
}
