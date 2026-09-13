'use client'

import { inventoryStatus } from '@/lib/operational-display'
import { useT } from '@/lib/i18n/i18n'

export function LowStockBadge({
  quantity,
  threshold,
}: {
  quantity: number
  threshold: number
}) {
  const t = useT()
  const status = inventoryStatus(quantity, threshold)
  if (status.tone === 'green') return null
  return (
    <span className={`badge b-${status.tone}`}>
      {status.tone === 'red' ? t('inventory.status.out') : t('inventory.status.low')}
    </span>
  )
}
