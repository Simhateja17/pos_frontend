'use client'

import { UnavailableModulePage } from '@/components/couture/states'
import { useI18n, type MessageKey } from '@/lib/i18n/i18n'
import { en } from '@/lib/i18n/messages/en'

/** Routes announced in navigation but not yet backed by an API; labels live in the `states.modules` dictionary. */
const KNOWN_MODULES = new Set(Object.keys(en.states.modules))

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ')
}

export default function ModulePage({ params }: { params: { module: string } }) {
  const { t } = useI18n()
  const known = KNOWN_MODULES.has(params.module)
  const title = known
    ? t(`states.modules.${params.module}.title` as MessageKey)
    : titleFromSlug(params.module) || t('states.thisModule')
  const sub = known ? t(`states.modules.${params.module}.sub` as MessageKey) : undefined

  return <UnavailableModulePage title={title} sub={sub} capability={title} />
}
