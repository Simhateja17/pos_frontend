'use client'

import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { ReorderSuggestions } from '@/components/demand-planning/reorder-suggestions'
import { PageHead } from '@/components/couture/ui'
import { useAppRegion } from '@/lib/app-region'

/**
 * The owner-facing planning surface. ReorderSuggestions keeps its existing
 * server contract and purchase-order workflow; this module gives that
 * workflow a home separate from the current-state inventory catalog.
 */
export function DemandPlanningView() {
  const { appPath } = useAppRegion()

  return (
    <>
      <PageHead
        title="Demand Planning"
        sub="Forecast demand, review replenishment recommendations and prepare purchase orders"
        actions={
          <Link className="btn" href={appPath('/app/purchases')}>
            <ClipboardList size={15} /> View purchases
          </Link>
        }
      />
      <ReorderSuggestions />
    </>
  )
}
