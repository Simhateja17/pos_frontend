export type Locale = 'en' | 'te'

export const LOCALE_COOKIE = 'ambel_locale'

export function parseLocale(value: string | undefined | null): Locale {
  return value === 'te' ? 'te' : 'en'
}
