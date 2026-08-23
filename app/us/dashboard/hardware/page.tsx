/*
 * US edition mirror of app/app/hardware/page.tsx.
 *
 * Same component, same design — the edition's content (currency, tax
 * vocabulary, link targets) comes from the region context that
 * `app/us/dashboard/layout.tsx` provides via `<AppShell region="INTL">`.
 */
import { HardwareDevicesView } from '@/components/hardware/hardware-devices-view'

export default function HardwareDevicesPage() {
  return <HardwareDevicesView />
}
