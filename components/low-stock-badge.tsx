import { inventoryStatus } from '@/lib/operational-display'

export function LowStockBadge({
  quantity,
  threshold,
}: {
  quantity: number
  threshold: number
}) {
  const status = inventoryStatus(quantity, threshold)
  if (status.tone === 'green') return null
  return <span className={`badge b-${status.tone}`}>{status.label}</span>
}
