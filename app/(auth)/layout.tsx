import type { ReactNode } from 'react'

// Shared layout for the standalone auth surfaces (login, signup, accept-invite).
// No nav/header: auth pages are standalone focal-point cards per 01-UI-SPEC.md's
// Visual Hierarchy section ("The auth card, vertically centered").
//
// This wrapper deliberately owns nothing but the page background. It used to
// centre its child inside `px-4 py-16`, which the India auth shell escaped on
// desktop only because that shell is `position: fixed`. On phones the shell
// drops to static flow, so the wrapper's padding and `items-center` boxed the
// full-screen layout into a shrink-to-fit column with dead margins around it.
// Surfaces that really are a lone card (accept-invite) now centre themselves.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#FFFDF7' }}>
      {children}
    </div>
  )
}
