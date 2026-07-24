---
created: 2026-07-24T15:45:04Z
title: Build persistent app shell (sidebar + top bar)
area: ui
files:
  - frontend/app/inventory/page.tsx
  - frontend/app/checkout/page.tsx
  - frontend/app/layout.js
---

## Problem

The old India prototype (frontend/public/couture.js SCREENS.billing, viewable
at localhost:3000/app) has a persistent app shell: left sidebar nav (Feature
Map, Dashboard, Billing, Sales/Orders, Returns, Inventory, Customers, Staff,
etc.) plus a top bar (search/command palette, location switcher, notification
bell, user avatar/role badge). None of the new TypeScript rebuild has this —
Phase 1 and Phase 2 pages (e.g. inventory/page.tsx) are bare centered content
blocks with just a heading, and Phase 3's checkout screen (03-06) followed the
same pattern. This was surfaced during 03-06's human-verify checkpoint when
the user compared the new checkout screen side-by-side with the old
prototype's Billing screen and asked why the existing design wasn't reused.

Per CLAUDE.md, the old prototype is meant to be used as a "visual/UX and
module-depth reference," but no phase's UI-SPEC.md has actually scoped
building the shell itself — only individual screens' internal layouts have
referenced it (e.g. 03-UI-SPEC.md's two-column cart/summary split).

User decision (2026-07-24, during /gsd-execute-phase 3, plan 03-06 checkpoint):
ship Phase 3 as-is without the shell, revisit later rather than retrofitting
now (retrofitting would touch Phase 1/2/3 pages all at once and block
Phase 3 completion).

## Solution

TBD — likely a dedicated UI/polish phase or milestone item:
1. Design a shared `AppShell` component (sidebar nav + top bar) in
   frontend/components/, US-content translation of the old prototype's chrome
   (no GST/₹/WhatsApp/loyalty-points — dollars, sales tax, email).
2. Wrap all authenticated routes (inventory, checkout, settings, terminal,
   returns, shifts) in the shell via a shared layout.
3. Retrofit existing Phase 1/2/3 pages into the shell without changing their
   internal content/logic.
