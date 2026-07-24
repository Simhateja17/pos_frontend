import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CircleDashed, Construction, LayoutDashboard } from 'lucide-react'

const MODULES: Record<string, { title: string; summary: string; legacyId: string; phase: string }> = {
  'feature-map': { title: 'Feature Map', summary: 'A live overview of the retail suite and its module maturity.', legacyId: 'map', phase: 'Product overview' },
  register: { title: 'Register', summary: 'Counter opening, cash drawer status, and register operations.', legacyId: 'register', phase: 'Phase 3 shifts foundation' },
  'sales-channels': { title: 'Sales Channels', summary: 'Track web, social, marketplace and in-store orders from one stock pool.', legacyId: 'channels', phase: 'Future omnichannel phase' },
  'delivery-challan': { title: 'Delivery Challan', summary: 'Create dispatch documents and convert them to invoices on delivery.', legacyId: 'challan', phase: 'Future fulfilment phase' },
  purchases: { title: 'Purchases', summary: 'Raise purchase orders, receive stock, and follow supplier deliveries.', legacyId: 'purchases', phase: 'Phase 5 purchasing' },
  suppliers: { title: 'Suppliers', summary: 'Maintain supplier profiles, lead times, and purchase history.', legacyId: 'suppliers', phase: 'Phase 5 purchasing' },
  'whatsapp-connect': { title: 'WhatsApp Connect', summary: 'Connect approved templates and customer communication workflows.', legacyId: 'whatsapp', phase: 'Future communications phase' },
  expenses: { title: 'Expenses', summary: 'Record store expenses and track cash outflow by category.', legacyId: 'expenses', phase: 'Future finance phase' },
  receivables: { title: 'Receivables', summary: 'Track credit due from customers and follow up on balances.', legacyId: 'receivables', phase: 'Future finance phase' },
  'credit-notes': { title: 'Credit / Debit Notes', summary: 'Issue compliant credit and debit notes against completed invoices.', legacyId: 'creditnotes', phase: 'Future compliance phase' },
  reports: { title: 'Reports', summary: 'Export sales, tax, inventory, staff, and operational reports.', legacyId: 'reports', phase: 'Phase 7 reporting' },
  analytics: { title: 'Analytics', summary: 'Study sales trends, customer behavior, margin, and stock movement.', legacyId: 'analytics', phase: 'Phase 7 reporting' },
  copilot: { title: 'AI Copilot', summary: 'Ask operational questions and review data-backed recommendations.', legacyId: 'copilot', phase: 'Future AI integration phase' },
  'offline-sync': { title: 'Offline & Sync', summary: 'Monitor local billing resilience and synchronization status.', legacyId: 'sync', phase: 'Phase 4 offline resilience' },
  hardware: { title: 'Hardware & Devices', summary: 'Configure printers, scanners, card terminals, and cash drawers.', legacyId: 'hardware', phase: 'Future device integration phase' },
  'customer-display': { title: 'Customer Display', summary: 'Configure the shopper-facing display for billing counters.', legacyId: 'cfd', phase: 'Future device integration phase' },
  notifications: { title: 'Notifications', summary: 'Review important store alerts and assigned operational actions.', legacyId: 'notifications', phase: 'Future notification phase' },
  settings: { title: 'Settings', summary: 'Manage store, tax, invoice, team, and device settings.', legacyId: 'settings', phase: 'Settings expansion' },
}

export function generateStaticParams() {
  return Object.keys(MODULES).map((module) => ({ module }))
}

export default function ModulePreviewPage({ params }: { params: { module: string } }) {
  const module = MODULES[params.module]
  if (!module) notFound()

  return (
    <main className="grid min-h-[calc(100vh-84px)] place-items-center p-5 md:p-8">
      <section className="w-full max-w-3xl rounded-3xl border bg-white p-8 shadow-sm md:p-12">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#edf4ff] text-[#2864c6]">
          <LayoutDashboard className="size-7" />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-[#2864c6]">Canonical India route</p>
        <h1 className="mt-3 font-heading text-4xl font-bold">{module.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-500">{module.summary}</p>
        <div className="mt-8 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[auto_1fr]">
          <Construction className="size-6 text-amber-700" />
          <div>
            <strong className="block text-amber-900">Module conversion in progress</strong>
            <p className="mt-1 text-sm text-amber-800">The previous legacy screen was “{module.legacyId}”. Its dedicated data and workflows belong to {module.phase}; this page intentionally does not present placeholder figures as live store data.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app/dashboard" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2864c6] px-5 font-semibold text-white">Back to Dashboard <ArrowRight className="size-4" /></Link>
          <Link href="/app/feature-map" className="inline-flex h-11 items-center gap-2 rounded-xl border px-5 font-semibold">View feature map <CircleDashed className="size-4" /></Link>
        </div>
      </section>
    </main>
  )
}
