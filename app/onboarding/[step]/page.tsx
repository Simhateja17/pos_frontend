import { notFound } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export function generateStaticParams() {
  return Array.from({ length: 8 }, (_, index) => ({ step: String(index + 1) }))
}

export default function OnboardingStepPage({ params }: { params: { step: string } }) {
  const step = Number(params.step)
  if (!Number.isInteger(step) || step < 1 || step > 8) notFound()
  return <OnboardingWizard step={step} />
}
