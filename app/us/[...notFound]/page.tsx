/*
 * Catch-all for unmatched `/us/...` URLs.
 *
 * A nested `not-found.tsx` is only a boundary for an explicit `notFound()`
 * call — Next sends genuinely unmatched URLs to the ROOT `app/not-found.tsx`,
 * which is the India edition. This route matches whatever `/us/*` path no real
 * route claimed (static and dynamic segments both outrank a catch-all, so every
 * existing `/us` page is unaffected) and raises the 404 from inside the `/us`
 * subtree, which is what makes `app/us/not-found.tsx` render — with a real 404
 * status, US chrome and US links.
 */
import { notFound } from "next/navigation";

export default function USCatchAll() {
  notFound();
}
