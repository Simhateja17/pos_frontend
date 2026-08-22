import type { ReactNode } from 'react'
import { UsAppShell } from '@/components/us-app/us-app-shell'

export default function UsDashboardLayout({ children }: { children: ReactNode }) {
  return <UsAppShell>{children}</UsAppShell>
}
