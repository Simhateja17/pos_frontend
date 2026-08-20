"use client";

import { useEffect, useState } from "react";

/**
 * The URL the visitor actually asked for, shown back to them on the 404 page.
 * Read from `window.location` in an effect rather than `usePathname()`: the root
 * not-found is rendered as static 404 HTML, so the path has to come from the
 * browser after hydration or the two would disagree.
 */
export default function NotFoundPath() {
  const [path, setPath] = useState("");

  useEffect(() => {
    setPath(window.location.host + window.location.pathname + window.location.search);
  }, []);

  if (!path) return null;

  return (
    <div className="nf-path">
      <svg viewBox="0 0 24 24">
        <path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6" />
        <path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
      </svg>
      <span>{path}</span>
    </div>
  );
}
