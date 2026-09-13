'use client'

/**
 * In-app language for the India edition (`/app/*`): English or Telugu.
 *
 * Deliberately a small dictionary lookup rather than a routing i18n library:
 * the canonical `/app/*` slugs must not grow a `/te/` prefix, and only the
 * logged-in POS is translated. The choice lives in a cookie so the server
 * layout can render the right language on first paint (no English flash).
 *
 * The US edition shares these components and is always English.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './messages/en'
import { te } from './messages/te'
import { LOCALE_COOKIE, type Locale } from './locale'

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<typeof en>
export type TranslateVars = Record<string, string | number>
export type Translate = (key: MessageKey, vars?: TranslateVars) => string

const DICTIONARIES = { en, te } as const

function lookup(dictionary: unknown, key: string): string | undefined {
  let node = dictionary
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

export function translate(locale: Locale, key: MessageKey, vars?: TranslateVars): string {
  const text = lookup(DICTIONARIES[locale], key) ?? lookup(en, key) ?? key
  return interpolate(text, vars)
}

/**
 * Label for a value the server sends as a code (sale status, payment method…).
 * Unknown codes fall back to the raw value rather than a dotted key, so a new
 * backend status still reads sensibly before it is added to the dictionary.
 */
export function enumLabel(t: Translate, group: 'status' | 'method', value: string | null | undefined): string {
  if (!value) return ''
  const code = value.toLowerCase()
  const key = `enums.${group}.${code}`
  return lookup(en, key) === undefined ? value : t(key as MessageKey)
}

type I18nValue = {
  locale: Locale
  /** False for the US edition: the switch is hidden and English is forced. */
  switchable: boolean
  setLocale: (locale: Locale) => void
  t: Translate
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  initialLocale,
  switchable,
  children,
}: {
  initialLocale: Locale
  switchable: boolean
  children: ReactNode
}) {
  const [chosen, setChosen] = useState<Locale>(initialLocale)
  const locale: Locale = switchable ? chosen : 'en'

  useEffect(() => {
    document.documentElement.lang = locale === 'te' ? 'te' : 'en'
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    setChosen(next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ locale, switchable, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale, switchable, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

const ENGLISH_FALLBACK: I18nValue = {
  locale: 'en',
  switchable: false,
  setLocale: () => undefined,
  t: (key, vars) => translate('en', key, vars),
}

/** Outside a provider (tests, US-only surfaces) this is plain English. */
export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? ENGLISH_FALLBACK
}

export function useT(): Translate {
  return useI18n().t
}
