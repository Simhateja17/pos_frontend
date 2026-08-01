'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { Card, CardHead, CardPad, ListRow } from '@/components/couture/ui'
import { apiClient } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { SETUP_TASKS, setupTaskForStep, type SetupTask } from '@/components/onboarding/setup-tasks'

/**
 * ONBOARD-01 — the index of setup work still outstanding.
 *
 * This replaces the old "finish later" wizard links. Each row now points at the
 * screen that actually owns the data rather than a standalone form, and a task
 * is only listed when its screen exists. Renders nothing until the server
 * confirms there is something outstanding.
 */
export function SetupPrompt() {
  const [tasks, setTasks] = useState<SetupTask[] | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const { data } = await apiClient.GET('/onboarding', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!active || !data) return
        // pendingSteps still includes steps whose screen does not exist yet;
        // those are filtered out rather than shown as work the owner can't do.
        setTasks(
          data.pendingSteps
            .map(setupTaskForStep)
            .filter((task): task is SetupTask => task !== undefined),
        )
      } catch {
        // A failed lookup means we say nothing rather than guess at setup state.
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!tasks || tasks.length === 0) return null

  return (
    <Card>
      <CardHead
        title="Finish setting up"
        sub="Your till already works — these make it more useful"
        right={
          <span className="badge b-blue">
            {tasks.length} of {SETUP_TASKS.length}
          </span>
        }
      />
      <CardPad style={{ paddingTop: 4 }}>
        {tasks.map((task) => (
          <ListRow
            key={task.step}
            icon={<ListChecks size={17} strokeWidth={1.85} />}
            title={task.title}
            sub={task.description}
            action={
              <Link className="btn btn-sm btn-ghost" href={task.href}>
                Set up
              </Link>
            }
          />
        ))}
      </CardPad>
    </Card>
  )
}
