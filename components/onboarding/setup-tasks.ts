/**
 * Setup work that used to be onboarding wizard steps 3-8.
 *
 * The wizard is gone. None of this ever blocked a working till, and every one
 * of those screens re-asked details signup already had or wrote fields no part
 * of the backend reads. Each task is now owned by the screen that actually
 * needs the data, and this list is only the index the dashboard shows.
 *
 * A task appears here ONLY if its destination screen exists. Steps 4 (Billing &
 * Invoice), 5 (Payment Methods) and 7 (Hardware & Devices) are deliberately
 * absent: they have no real screen yet, so asking for them would be collecting
 * answers nothing consumes — the exact problem the wizard had.
 */
export type SetupTask = {
  /** Onboarding step number this task's data still saves under. */
  step: number
  title: string
  description: string
  href: string
}

export const SETUP_TASKS: readonly SetupTask[] = [
  {
    step: 6,
    title: 'Add your products',
    description: 'Build the catalog your till sells from — import a file or add items directly.',
    href: '/app/inventory/catalog',
  },
  {
    step: 8,
    title: 'Invite your team',
    description: 'Add the staff who will run the counter and set what needs your approval.',
    href: '/app/settings/members',
  },
]

export function setupTaskForStep(step: number): SetupTask | undefined {
  return SETUP_TASKS.find((task) => task.step === step)
}
