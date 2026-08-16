import { UnavailableModulePage } from '@/components/couture/states'

/** Human labels for routes announced in navigation but not yet backed by an API. */
const MODULE_LABELS: Record<string, { title: string; sub: string }> = {
  'feature-map': { title: 'Feature Map', sub: 'Product capability overview' },
  'sales-channels': { title: 'Sales Channels', sub: 'Omnichannel orders and stock sync' },
  'delivery-challan': { title: 'Delivery Challan', sub: 'Goods dispatched before invoicing' },
  'whatsapp-connect': { title: 'WhatsApp Connect', sub: 'Customer messaging and campaigns' },
  expenses: { title: 'Expenses', sub: 'Store spend and petty cash' },
  receivables: { title: 'Receivables', sub: 'Credit customers and outstanding dues' },
  'credit-notes': { title: 'Credit / Debit Notes', sub: 'Post-Tax Invoice adjustments' },
  analytics: { title: 'Analytics', sub: 'Trends and performance insight' },
  copilot: { title: 'AI Copilot', sub: 'Assisted retail operations' },
  'offline-sync': { title: 'Offline & Sync', sub: 'Resilience and queued writes' },
  hardware: { title: 'Hardware & Devices', sub: 'Terminals, printers and scanners' },
  'customer-display': { title: 'Customer Display', sub: 'Second-screen checkout view' },
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ')
}

export default function ModulePage({ params }: { params: { module: string } }) {
  const known = MODULE_LABELS[params.module]
  const title = known?.title ?? titleFromSlug(params.module) ?? 'This module'

  return <UnavailableModulePage title={title} sub={known?.sub} capability={title} />
}
