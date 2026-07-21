# Couture POS — Next.js

The original single-file `Couture POS - Animated.html` prototype, ported to Next.js
(App Router) with **no behavioural changes**.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm run start
```

## How it maps to the original

The original is a self-contained vanilla-JS app: it renders every screen by
injecting HTML strings into the DOM and wires all interactions through global
functions referenced by inline `on*` handlers. To preserve behaviour exactly,
the port keeps that engine as-is rather than rewriting it in React.

| File | Contains (from the original HTML) |
|------|-----------------------------------|
| `app/globals.css` | The main `<style>` block + the auth/onboarding `<style id="auth-css">` block |
| `app/bodyMarkup.js` | The static shell markup — route bar, sidebar, topbar, `#screen`, and the `#auth-layer` overlay — extracted verbatim |
| `public/couture.js` | The main app `<script>` + the auth/onboarding `<script id="auth-js">`, concatenated in original order |
| `app/page.js` | Renders the shell via `dangerouslySetInnerHTML` (so inline handlers keep working) and loads `couture.js` |
| `app/layout.js` | `<html>`/`<body>`, the Google Fonts links, and `globals.css` import |

The Google Fonts (Space Grotesk, Plus Jakarta Sans, JetBrains Mono) are loaded
in `app/layout.js`, matching the original `<head>`.

> Note: the sidebar "View landing page" link still points at
> `Couture POS — Landing Page.html`, exactly as in the original (that page is not
> part of this prototype).
