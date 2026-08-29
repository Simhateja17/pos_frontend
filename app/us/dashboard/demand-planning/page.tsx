/*
 * US edition mirror of app/app/demand-planning/page.tsx.
 *
 * The shared view receives its regional route and formatting context from
 * app/us/dashboard/layout.tsx, just like the other operational screens.
 */
import { DemandPlanningView } from '@/components/demand-planning/demand-planning-view'

export default function DemandPlanningPage() {
  return <DemandPlanningView />
}
