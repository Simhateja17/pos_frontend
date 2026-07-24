'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Field = {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'number' | 'email'
}

type Step = {
  title: string
  description: string
  note: string
  fields: Field[]
}

export const ONBOARDING_STEPS: Step[] = [
  {
    title: 'Tell us about your business.',
    description: 'Enter details exactly as registered with the Government of India — these appear on invoices and compliance documents.',
    note: 'Use the legal name shown on your GST Registration Certificate or Certificate of Incorporation.',
    fields: [
      { key: 'legalName', label: 'Legal business name *', placeholder: 'As on GST / Certificate of Incorporation' },
      { key: 'brandName', label: 'Trade / brand name', placeholder: 'Name shown to customers on receipt & display' },
      { key: 'businessStructure', label: 'Business structure', placeholder: 'Private Limited (Pvt Ltd)' },
      { key: 'yearEstablished', label: 'Year established', placeholder: '2023', type: 'number' },
      { key: 'cin', label: 'CIN (Company Identification Number)', placeholder: 'e.g. U52100MH2018PTC000001' },
      { key: 'storeCount', label: 'Number of stores', placeholder: '1 store' },
    ],
  },
  {
    title: 'Configure GST & compliance.',
    description: 'Set the registration and tax details used for GST-native invoicing and reporting.',
    note: 'You can save a draft now and verify the GSTIN before issuing the first live invoice.',
    fields: [
      { key: 'gstin', label: 'GSTIN *', placeholder: '27ABCDE1234F1Z5' },
      { key: 'pan', label: 'Business PAN *', placeholder: 'ABCDE1234F' },
      { key: 'stateCode', label: 'GST state / jurisdiction', placeholder: 'Maharashtra · 27' },
      { key: 'gstMode', label: 'Pricing mode', placeholder: 'Exclusive (GST separate)' },
      { key: 'defaultSlab', label: 'Default GST slab', placeholder: '18%' },
    ],
  },
  {
    title: 'Set up your first store.',
    description: 'Add the location, counter structure, invoice identity, and daily operating hours.',
    note: 'This becomes the default store selected in the product header.',
    fields: [
      { key: 'storeName', label: 'Store name *', placeholder: 'Bandra Flagship' },
      { key: 'address', label: 'Store address *', placeholder: 'Linking Road, Bandra West' },
      { key: 'city', label: 'City *', placeholder: 'Mumbai' },
      { key: 'postalCode', label: 'PIN code *', placeholder: '400050' },
      { key: 'counters', label: 'Billing counters', placeholder: '2' },
      { key: 'timezone', label: 'Timezone', placeholder: 'Asia/Kolkata' },
    ],
  },
  {
    title: 'Configure billing & invoices.',
    description: 'Choose invoice numbering, pricing behavior, and receipt information for every counter.',
    note: 'Migrating from another system? Continue your existing invoice sequence here.',
    fields: [
      { key: 'invoicePrefix', label: 'Invoice prefix', placeholder: 'INV' },
      { key: 'nextInvoice', label: 'Next invoice number', placeholder: '24851', type: 'number' },
      { key: 'rounding', label: 'Round-off rule', placeholder: 'Nearest ₹1' },
      { key: 'receiptFooter', label: 'Receipt footer', placeholder: 'Thank you for shopping with us' },
    ],
  },
  {
    title: 'Choose payment methods.',
    description: 'Enable the tender types your cashier can select during billing.',
    note: 'Gateway and terminal integrations can be connected later without changing the billing workflow.',
    fields: [
      { key: 'upiProvider', label: 'UPI provider', placeholder: 'Razorpay / PhonePe / BharatPe' },
      { key: 'upiVpa', label: 'UPI VPA', placeholder: 'store@bank' },
      { key: 'cardTerminal', label: 'Card terminal', placeholder: 'External terminal' },
      { key: 'cashDrawer', label: 'Cash drawer', placeholder: 'Enabled' },
    ],
  },
  {
    title: 'Bring in your product catalog.',
    description: 'Import products and variants now, or begin with a sample catalog and replace it later.',
    note: 'Size, colour, material, SKU, HSN, price, and opening stock are supported.',
    fields: [
      { key: 'catalogSource', label: 'Catalog source', placeholder: 'Upload CSV / Start fresh' },
      { key: 'skuCount', label: 'Approximate SKU count', placeholder: '500', type: 'number' },
      { key: 'barcodeFormat', label: 'Barcode format', placeholder: 'EAN-13' },
      { key: 'openingStock', label: 'Opening stock method', placeholder: 'Import from spreadsheet' },
    ],
  },
  {
    title: 'Connect hardware & devices.',
    description: 'Prepare scanners, receipt printers, customer displays, and cash drawers for each counter.',
    note: 'Hardware pairing can be tested again from Settings after setup.',
    fields: [
      { key: 'printer', label: 'Receipt printer', placeholder: '80mm thermal printer' },
      { key: 'scanner', label: 'Barcode scanner', placeholder: 'USB / Bluetooth scanner' },
      { key: 'display', label: 'Customer display', placeholder: 'Optional' },
      { key: 'deviceCount', label: 'POS devices', placeholder: '2', type: 'number' },
    ],
  },
  {
    title: 'Invite your team.',
    description: 'Create staff access for owners, managers, and cashiers with role-based permissions.',
    note: 'You can continue alone and invite more staff from Team & Access later.',
    fields: [
      { key: 'managerEmail', label: 'Manager email', placeholder: 'manager@yourstore.com', type: 'email' },
      { key: 'cashierCount', label: 'Cashier accounts', placeholder: '4', type: 'number' },
      { key: 'approvalThreshold', label: 'Manager approval threshold', placeholder: 'Discount above 10%' },
      { key: 'pinPolicy', label: 'Cashier PIN policy', placeholder: '4-digit PIN' },
    ],
  },
]

const DRAFT_KEY = 'couture.onboarding.draft'

export function OnboardingWizard({ step }: { step: number }) {
  const router = useRouter()
  const current = ONBOARDING_STEPS[step - 1]
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      setDraft(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}'))
    } catch {
      setDraft({})
    }
  }, [])

  function update(key: string, value: string) {
    setDraft((existing) => ({ ...existing, [key]: value }))
  }

  function persist(nextDraft = draft) {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft))
    window.localStorage.setItem('couture.onboarding.currentStep', String(step))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    persist()
    router.push(step < ONBOARDING_STEPS.length ? `/onboarding/${step + 1}` : '/onboarding/complete')
  }

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-[#111827] lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="bg-gradient-to-b from-[#07172f] to-[#102d67] p-7 text-white lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border border-white/20 bg-white/10 font-black">C</div>
          <strong className="font-heading text-xl">Couture POS</strong>
        </div>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
          Setup · {Math.round((step / ONBOARDING_STEPS.length) * 100)}% complete
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#68a0ff]" style={{ width: `${(step / ONBOARDING_STEPS.length) * 100}%` }} />
        </div>
        <ol className="mt-7 hidden space-y-2 lg:block">
          {ONBOARDING_STEPS.map((item, index) => {
            const number = index + 1
            return (
              <li key={item.title}>
                <button
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${
                    number === step ? 'bg-white/10' : 'text-white/60'
                  }`}
                  onClick={() => {
                    persist()
                    router.push(`/onboarding/${number}`)
                  }}
                >
                  <span className={`grid size-9 place-items-center rounded-full text-sm font-bold ${number <= step ? 'bg-[#2864c6] text-white' : 'bg-white/10'}`}>
                    {String(number).padStart(2, '0')}
                  </span>
                  <span>
                    <small className="block text-[10px] font-bold uppercase tracking-wider">Step {String(number).padStart(2, '0')}</small>
                    <strong className="block text-sm">{item.title.replace(/[.]$/, '')}</strong>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      <main className="p-5 md:p-10 lg:p-14">
        <form className="mx-auto max-w-5xl" onSubmit={submit}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2864c6]">
            Step {String(step).padStart(2, '0')} · {current.title.replace(/[.]$/, '')}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-7 text-slate-500">{current.description}</p>
          <div className="mt-7 rounded-xl border border-blue-200 bg-[#eaf2ff] p-4 text-sm text-[#174c9e]">
            ℹ️ {current.note}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {current.fields.map((field, index) => (
              <div key={field.key} className={index < 2 ? 'md:col-span-2' : ''}>
                <Label htmlFor={field.key} className="mb-2 block text-sm font-semibold normal-case tracking-normal">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type={field.type ?? 'text'}
                  value={draft[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) => update(field.key, event.target.value)}
                  className="h-14 rounded-xl bg-white px-5 text-base"
                />
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-between border-t pt-6">
            <Button type="button" variant="outline" onClick={() => {
              persist()
              router.push(step === 1 ? '/plans' : `/onboarding/${step - 1}`)
            }}>
              ← {step === 1 ? 'Plans' : 'Back'}
            </Button>
            <span className="hidden text-sm text-slate-400 md:block">{Math.round((step / ONBOARDING_STEPS.length) * 100)}% complete</span>
            <Button type="submit" className="min-w-36">
              {step === ONBOARDING_STEPS.length ? 'Finish setup' : 'Continue →'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

