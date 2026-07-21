import { notFound } from "next/navigation";
import OnboardingShell from "../OnboardingShell";
import { STEPS } from "../steps";

export function generateStaticParams() {
  return STEPS.map((s) => ({ step: String(s.n) }));
}

export default function OnboardingStepPage({ params }) {
  const step = Number(params.step);
  if (!Number.isInteger(step) || step < 1 || step > STEPS.length) {
    notFound();
  }
  return <OnboardingShell step={step} />;
}
