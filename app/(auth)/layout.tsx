import type { ReactNode } from 'react'

// Shared layout for the standalone auth surfaces (login, signup, accept-invite).
// No nav/header — auth pages are standalone focal-point cards per 01-UI-SPEC.md's
// Visual Hierarchy section ("The auth card, vertically centered").
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-16"
      style={{ backgroundColor: '#FFFDF7' }}
    >
      {children}
    </div>
  )
}
