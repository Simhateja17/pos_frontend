"use client";
import { useState } from "react";
import type { LivePlan } from "@/lib/marketing/pricing";
import { PricingGrid, type PricingCycle } from "./pricing-plans";

export function PricingPeriod({ plans }: { plans: LivePlan[] }) {
  const [cycle, setCycle] = useState<PricingCycle>("monthly");
  return <><div className="billing-period-switcher" role="group" aria-label="Billing period">
    {(["monthly", "annual"] as const).map((option) => <button key={option} type="button" aria-pressed={cycle === option} onClick={() => setCycle(option)}>{option === "monthly" ? "Monthly" : "Annual"}</button>)}
  </div><PricingGrid plans={plans} cycle={cycle} /></>;
}
