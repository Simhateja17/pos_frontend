export function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase()
}

/** Exact identifiers rank above prefixes, which rank above substrings. */
export function globalSearchMatchScore(
  query: string,
  values: Array<string | null | undefined>,
  exactBoost = 0,
) {
  const needle = normalizeSearchValue(query)
  if (!needle) return 0
  let best = 0
  for (const value of values) {
    const candidate = normalizeSearchValue(value)
    if (!candidate) continue
    if (candidate === needle) best = Math.max(best, 300 + exactBoost)
    else if (candidate.startsWith(needle)) best = Math.max(best, 200)
    else if (candidate.includes(needle)) best = Math.max(best, 100)
  }
  return best
}

export function isScannableBarcode(value: string) {
  return /^\d{8,14}$/.test(value.trim())
}
