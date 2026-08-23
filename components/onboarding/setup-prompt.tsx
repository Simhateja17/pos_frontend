'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ListChecks } from 'lucide-react'
import { Card, CardHead, CardPad, ListRow } from '@/components/couture/ui'
import { apiClient } from '@/lib/api/client'
import { authHeaders } from '@/lib/api/auth-headers'
import type { components } from '@/lib/api/schema'
import { useAppRegion } from '@/lib/app-region'

type SetupState = components['schemas']['SetupState']

/**
 * Compact dashboard projection of the same server-derived `/setup` response.
 * No localStorage flags or client-side checkboxes are used here; changing the
 * active store causes the shell to reload this store's readiness state.
 */
export function SetupPrompt() {
  // `/setup` answers with India-relative action hrefs (`/app/...`) because that
  // is the path vocabulary the backend was written against. Rebase them so a US
  // tenant's "Set up" buttons stay inside `/us/dashboard/*`.
  const { appPath } = useAppRegion()
  const [state, setState] = useState<SetupState | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const headers = await authHeaders()
      if (!headers) return
      const result = await apiClient.GET('/setup', { headers })
      if (active && result.data && !result.data.complete) setState(result.data)
    })()
    return () => { active = false }
  }, [])

  if (!state) return null
  const pending = state.steps.filter((step) => !step.complete).slice(0, 3)

  return (
    <Card>
      <CardHead
        title="Finish setting up"
        sub={`${state.completionPercentage}% complete · ${state.store.name}`}
        right={<Link className="btn btn-sm btn-ghost" href={appPath('/app/setup')}>Open guided setup <ArrowRight size={14} /></Link>}
      />
      <CardPad style={{ paddingTop: 4 }}>
        {pending.map((step) => (
          <ListRow
            key={step.id}
            icon={<ListChecks size={17} strokeWidth={1.85} />}
            title={step.title}
            sub={step.reason ?? step.description}
            action={step.actionHref ? <Link className="btn btn-sm btn-ghost" href={appPath(step.actionHref)}>Set up</Link> : undefined}
          />
        ))}
        {state.steps.length > pending.length ? <p className="t-sub" style={{ margin: '8px 0 0' }}>Open guided setup to see every step and its dependencies.</p> : null}
      </CardPad>
    </Card>
  )
}
