'use client'

import { Languages } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n'

/** Top-bar English ⇄ తెలుగు toggle. Renders nothing for the US edition. */
export function LanguageSwitch() {
  const { locale, switchable, setLocale, t } = useI18n()
  if (!switchable) return null
  const next = locale === 'te' ? 'en' : 'te'

  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      aria-label={t('shell.languageSwitch')}
      title={t('shell.languageSwitch')}
      onClick={() => setLocale(next)}
      lang={next}
    >
      <Languages size={15} strokeWidth={1.85} aria-hidden="true" />
      {next === 'te' ? t('common.telugu') : t('common.english')}
    </button>
  )
}
