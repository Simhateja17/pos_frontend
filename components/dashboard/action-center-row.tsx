import Link from 'next/link'
import { Boxes, RotateCcw } from 'lucide-react'
import type { Dashboard } from '@/lib/api/authenticated-client'

type DashboardActionableItem = Dashboard['actionable']['items'][number]
import { ListRow } from '@/components/couture/ui'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

export function ActionableItemRow({ item }: { item: DashboardActionableItem }) {
  const { shortDate: dateLabel, appPath } = useAppRegion()
  const t = useT()

  if (item.type === 'low_stock') {
    return (
      <ListRow
        key={item.variantId}
        tone="red"
        icon={<Boxes size={17} strokeWidth={1.85} />}
        title={t('dashboard.actions.lowTitle', { product: item.productName })}
        sub={t('dashboard.actions.lowSub', { sku: item.sku, quantity: item.quantity, threshold: item.reorderThreshold })}
        action={
          <Link className="btn btn-sm btn-ghost" href={appPath('/app/inventory')}>
            {t('common.review')}
          </Link>
        }
      />
    )
  }

  return (
    <ListRow
      key={item.shiftId}
      tone="amber"
      icon={<RotateCcw size={17} strokeWidth={1.85} />}
      title={t('dashboard.actions.registerOpen')}
      sub={t('dashboard.actions.registerSub', { date: dateLabel(item.openedAt) })}
      action={
        <Link className="btn btn-sm btn-ghost" href={appPath('/app/shifts')}>
          {t('common.open')}
        </Link>
      }
    />
  )
}
