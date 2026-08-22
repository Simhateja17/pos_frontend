"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { setRegion } from "@/lib/marketing/actions";
import type { MarketingRegion } from "@/lib/marketing/region";

const LABEL: Record<MarketingRegion, string> = { IN: "India (₹)", INTL: "International ($)" };

export function RegionSwitcher({ region }: { region: MarketingRegion }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function choose(next: MarketingRegion) {
    if (next === region) return;
    startTransition(() => {
      setRegion(next, pathname);
    });
  }

  return (
    <div className="region-switcher" role="group" aria-label="Pricing region" style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 999, border: "1px solid var(--border, #e2e2e2)" }}>
      {(["IN", "INTL"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          disabled={isPending}
          aria-pressed={region === option}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            cursor: isPending ? "wait" : "pointer",
            fontWeight: region === option ? 600 : 400,
            background: region === option ? "#111" : "transparent",
            color: region === option ? "#fff" : "inherit",
          }}
        >
          {LABEL[option]}
        </button>
      ))}
    </div>
  );
}
