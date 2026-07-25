'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { Card, CardHead, CardPad, ListRow } from '@/components/couture/ui'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { ONBOARDING_STEPS } from '@/components/onboarding/onboarding-wizard'

/**
 * ONBOARD-01 — the setup steps that do not block a working till are finished
 * from here, inside the app, instead of gating the wizard. Renders nothing
 * until the server confirms there is something outstanding.
 */
export function SetupPrompt() {
  const [pending, setPending] = useState<number[] | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const { data } = await apiClient.GET('/onboarding', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (active && data?.requiredStepsComplete) setPending(data.pendingSteps)
      } catch {
        // A failed lookup means we say nothing rather than guess at setup state.
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!pending || pending.length === 0) return null

  return (
    <Card>
      <CardHead
        title="Finish setup"
        sub="Optional steps you skipped — the till works without them"
        right={<span className="badge b-blue">{pending.length} left</span>}
      />
      <CardPad style={{ paddingTop: 4 }}>
        {pending.map((step) => (
          <ListRow
            key={step}
            icon={<ListChecks size={17} strokeWidth={1.85} />}
            title={ONBOARDING_STEPS[step - 1].tag}
            sub={ONBOARDING_STEPS[step - 1].description}
            action={
              <Link className="btn btn-sm btn-ghost" href={`/onboarding/${step}`}>
                Finish
              </Link>
            }
          />
        ))}
      </CardPad>
    </Card>
  )
}
