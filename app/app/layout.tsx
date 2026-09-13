import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { Noto_Sans_Telugu } from 'next/font/google'
import { AppShell } from '@/components/app-shell'
import { I18nProvider } from '@/lib/i18n/i18n'
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n/locale'

// Latin glyphs still come from the design-system fonts; this only supplies
// Telugu script, picked up through `--font-telugu` in globals.css.
const telugu = Noto_Sans_Telugu({ subsets: ['telugu'], weight: ['400', '500', '600', '700'], variable: '--font-telugu' })

export default function AppLayout({ children }: { children: ReactNode }) {
  const initialLocale = parseLocale(cookies().get(LOCALE_COOKIE)?.value)
  return (
    <div className={telugu.variable} style={{ display: 'contents' }}>
      <I18nProvider initialLocale={initialLocale} switchable>
        <AppShell>{children}</AppShell>
      </I18nProvider>
    </div>
  )
}
