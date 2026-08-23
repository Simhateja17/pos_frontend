/*
 * India edition 404.
 *
 * Next routes every unmatched URL to this root boundary, so it is also the
 * fallback for anything outside `/us`. The markup itself is shared with the US
 * mirror (`app/us/not-found.tsx`) via `NotFoundView` — only the region differs.
 *
 * Deliberately kept free of `headers()`/`cookies()`: the root not-found is part
 * of every route's tree, so reading a request value here opts the WHOLE app out
 * of static prerendering. That is why the US 404 is reached by its own
 * catch-all route rather than by region-detecting in this file.
 */
import NotFoundView from "@/components/marketing/not-found-view";

export const metadata = {
  title: "Page not found · Ambel POS",
  description: "The page you were looking for doesn't exist or has moved.",
};

export default function NotFound() {
  return <NotFoundView region="IN" />;
}
