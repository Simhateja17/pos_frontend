'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { useAppRegion } from '@/lib/app-region'
import { useT } from '@/lib/i18n/i18n'

type SetupState = components['schemas']['SetupState']
// Step ids are persisted server-side; titles and bodies live in `shell.tour.steps`.
type TourStep = { id: 'dashboard' | 'billing' | 'inventory' | 'staff' | 'stores' | 'setup'; href: string }

const ALL_TOUR_STEPS: readonly TourStep[] = [
  { id: 'dashboard', href: '/app/dashboard' },
  { id: 'billing', href: '/app/billing' },
  { id: 'inventory', href: '/app/inventory' },
  { id: 'staff', href: '/app/settings/members' },
  { id: 'stores', href: '/app/stores' },
  { id: 'setup', href: '/app/setup' },
] as const

export function GuidedTour() {
  const pathname = usePathname()
  // Tour destinations are declared with India paths; the US edition walks the
  // same steps at its own base. `appPath` is stable per region, so it is safe
  // in the effect below.
  const { appPath } = useAppRegion()
  const t = useT()
  const [setup, setSetup] = useState<SetupState | null>(null)
  const [steps, setSteps] = useState<readonly TourStep[]>(ALL_TOUR_STEPS)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let active = true
    void (async () => {
      const isDashboard = pathname === appPath('/app/dashboard')
      const replayRequested = window.location.hash === '#guided-tour'
      const isPlainDashboard = isDashboard && !window.location.search && !window.location.hash
      if (!isDashboard) return
      const headers = await authHeaders()
      if (!headers) return
      const [contextResult, result] = await Promise.all([
        // Setup itself remains usable if the shell context probe is briefly
        // unavailable; in that case the conservative tour omits owner-only
        // Stores rather than guessing the role.
        apiClient.GET('/context', { headers }).catch(() => ({ data: undefined })),
        apiClient.GET('/setup', { headers }),
      ])
      if (!active || !result.data) return
      const applicableSteps = contextResult.data?.staff.role === 'owner'
        ? ALL_TOUR_STEPS
        : ALL_TOUR_STEPS.filter((step) => step.id !== 'stores')
      setSteps(applicableSteps)
      setSetup(result.data)
      const savedIndex = Math.max(
        0,
        applicableSteps.findIndex((step) => step.id === result.data.tour.lastStep),
      )
      setIndex(savedIndex)
      // Dashboard is the sole auto-start surface. Existing operational stores
      // (complete setup, skipped or completed tour) are never interrupted.
      if (replayRequested) {
        setOpen(true)
        return
      }
      if (isPlainDashboard && !result.data.complete && !['completed', 'skipped'].includes(result.data.tour.status)) {
        setOpen(true)
        await apiClient.PATCH('/setup/tour', {
          body: {
            status: 'in_progress',
            lastStep: applicableSteps[savedIndex].id,
            seenSteps: applicableSteps.slice(0, savedIndex + 1).map((step) => step.id),
          },
          headers,
        })
      }
    })()
    return () => { active = false }
  }, [pathname, appPath])

  async function save(status: 'in_progress' | 'skipped' | 'completed', nextIndex = index) {
    const headers = await authHeaders()
    if (!headers) return
    const seenSteps = steps.slice(0, nextIndex + 1).map((step) => step.id)
    await apiClient.PATCH('/setup/tour', {
      body: {
        status,
        lastStep: steps[Math.min(nextIndex, steps.length - 1)].id,
        seenSteps,
      },
      headers,
    })
  }

  if (!setup || !open) return null
  const current = steps[index]
  const last = index === steps.length - 1

  return (
    <div id="guided-tour" role="dialog" aria-label={t('shell.tour.label')} style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50, width: 'min(380px, calc(100vw - 32px))', padding: 18, borderRadius: 14, background: 'var(--ink)', color: '#fff', boxShadow: '0 18px 55px rgba(0,0,0,.22)' }}>
      <button aria-label={t('shell.tour.skip')} onClick={() => { setOpen(false); void save('skipped') }} style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'transparent', color: 'rgba(255,255,255,.65)', cursor: 'pointer' }}><X size={16} /></button>
      <div style={{ fontSize: 11, color: '#9FC5FF', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('shell.tour.progress', { current: index + 1, total: steps.length })}</div>
      <h3 style={{ margin: '8px 0 5px', color: '#fff' }}>{t(`shell.tour.steps.${current.id}.title`)}</h3>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 13, color: 'rgba(255,255,255,.72)' }}>{t(`shell.tour.steps.${current.id}.body`)}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Link
          className="btn btn-sm"
          href={appPath(current.href)}
          // The tour is intentionally a coachmark, not a modal. Keep it open
          // while the user visits the page so fields underneath remain
          // clickable and typeable; progress is saved before navigation.
          onClick={() => { void save(last ? 'completed' : 'in_progress') }}
          style={{ background: '#fff', color: 'var(--ink)' }}
        >
          {t('common.open')}
        </Link>
        <button className="btn btn-sm" onClick={() => { if (last) { setOpen(false); void save('completed') } else { setIndex((value) => value + 1); void save('in_progress', index + 1) } }} style={{ background: '#2E78DE', color: '#fff', borderColor: '#2E78DE' }}>{last ? t('shell.tour.finish') : t('common.next')}</button>
      </div>
    </div>
  )
}
