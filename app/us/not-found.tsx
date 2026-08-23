/*
 * US edition 404 boundary.
 *
 * This renders for a `notFound()` raised inside the `/us` subtree — an
 * unknown onboarding step, say. Genuinely unmatched `/us/...` URLs never
 * reach here: Next sends those to the root `app/not-found.tsx`, which detects
 * the `/us` path and renders this same view with the same region.
 */
import NotFoundView from "@/components/marketing/not-found-view";

export const metadata = {
  title: "Page not found · Ambel POS",
  description: "The page you were looking for doesn't exist or has moved.",
};

export default function USNotFound() {
  return <NotFoundView region="INTL" />;
}
