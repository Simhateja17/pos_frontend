import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'

/**
 * The US edition renders the SAME shell as India (`app/app/layout.tsx`) — same
 * sidebar, topbar, role gating and skeletons. `region` only decides content:
 * which modules the nav lists, what they are called, where their links point,
 * and which sign-in page an unauthenticated visitor is sent to.
 */
export default function UsDashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell region="INTL">{children}</AppShell>
}
