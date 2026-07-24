'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: '₹999',
    annual: '₹799',
    scope: '1 store · 2 counters',
    features: ['GST-native billing & cart', 'UPI, card & cash payments', 'Inventory up to 2,000 SKUs', '5 staff accounts', 'GST reports & export'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: '₹2,499',
    annual: '₹1,999',
    scope: 'Up to 3 stores · unlimited counters',
    features: ['Everything in Starter', 'Loyalty, gift cards & CRM', 'Sales channels', 'AI Copilot', 'WhatsApp campaigns', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 'Custom',
    annual: 'Custom',
    scope: 'Unlimited stores & counters',
    features: ['Everything in Growth', 'Unlimited AI queries', 'Custom report builder & API', 'Franchise management', 'Dedicated account manager'],
  },
]

export default function PlansPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(true)
  const [selected, setSelected] = useState('growth')

  function beginTrial() {
    window.localStorage.setItem('couture.onboarding.plan', selected)
    window.localStorage.setItem('couture.onboarding.billingCycle', annual ? 'annual' : 'monthly')
    router.push('/onboarding/1')
  }

  return (
    <main className="min-h-screen bg-[#f4f5f8] px-5 py-10 text-[#111827] md:py-16">
      <div className="mx-auto max-w-6xl">
        <button className="mx-auto block text-sm font-medium text-slate-500" onClick={() => router.back()}>
          ← Back
        </button>
        <div className="mt-5 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight">Choose your plan.</h1>
          <p className="mt-3 text-lg text-slate-500">No credit card required · 14-day free trial on any plan</p>
        </div>
        <div className="mx-auto mt-8 flex w-fit rounded-full bg-white p-1 shadow-sm">
          <button className={`rounded-full px-6 py-2 text-sm font-semibold ${!annual ? 'bg-[#2864c6] text-white' : 'text-slate-500'}`} onClick={() => setAnnual(false)}>Monthly</button>
          <button className={`rounded-full px-6 py-2 text-sm font-semibold ${annual ? 'bg-[#2864c6] text-white' : 'text-slate-500'}`} onClick={() => setAnnual(true)}>Annual · Save 20%</button>
        </div>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const active = selected === plan.id
            return (
              <button
                key={plan.id}
                className={`relative rounded-3xl border-2 bg-white p-7 text-left shadow-sm transition ${
                  active ? 'border-[#2864c6] bg-[#f4f7ff]' : 'border-[#e2e5ea]'
                }`}
                onClick={() => setSelected(plan.id)}
              >
                {plan.id === 'growth' && <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#2864c6] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">Most popular</span>}
                <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{plan.name}</p>
                <div className="mt-5 text-center">
                  <strong className="font-heading text-4xl">{annual ? plan.annual : plan.monthly}</strong>
                  {plan.monthly !== 'Custom' && <span className="text-slate-500">/mo</span>}
                  <p className="mt-2 text-sm text-slate-500">{plan.scope}</p>
                </div>
                <ul className="mt-8 space-y-3 text-sm">
                  {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                </ul>
              </button>
            )
          })}
        </div>
        <Button className="mx-auto mt-6 flex h-14 w-full max-w-md text-base" onClick={beginTrial}>
          Start 14-day free trial →
        </Button>
        <p className="mt-3 text-center text-sm text-slate-400">No credit card · cancel any time</p>
      </div>
    </main>
  )
}
