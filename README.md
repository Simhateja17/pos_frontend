# Couture POS frontend

The India Next.js application is under `/`, `/login`, `/signup`,
`/store-type`, `/plans`, `/onboarding/*`, and `/app/*`. The US prototype is a
separate `/us/*` route family. Do not import India application shells, copy,
onboarding state, or business data into US routes.

The legacy India engine remains at `public/couture.js` and the compatibility
entry at `/app` while Phase 3.2 visual acceptance is pending. The authoritative
route-by-route release ledger is
[`../.planning/phases/03.2-india-frontend-parity-and-backend-integration/03.2-PARITY-LEDGER.md`](../.planning/phases/03.2-india-frontend-parity-and-backend-integration/03.2-PARITY-LEDGER.md).

## Deterministic local setup

Use Node as pinned in `.nvmrc`, then install the lockfile exactly:

```bash
cd frontend
npm ci
```

Create a local `.env` from `.env.example` with only a **non-production**
Supabase project and API URL. Never put production credentials, a production
tenant, or a service-role key in browser environment variables.

Start the application deterministically in one terminal:

```bash
cd frontend
npm run dev
```

The local app listens on `http://127.0.0.1:3000` unless Next reports a chosen
alternative port. The API used by the app must be the paired non-production
backend; use its normal local start command from `backend/` rather than an
external or production URL.

## Non-browser verification

Run these checks before requesting visual acceptance:

```bash
cd frontend
npx tsc --noEmit
npm run build

cd ../backend
npm run typecheck
npm test
```

These checks exercise source, generated API types, and backend contracts. They
do not prove visual parity or complete a live browser flow.

## Browser and visual QA handoff

Browser/visual QA is intentionally user-owned. Agents may author the
specifications under `tests/e2e/` but must not execute them. If you choose to
run them, use a disposable non-production owner identity only and set all of:

```text
E2E_NON_PRODUCTION=true
E2E_SUPABASE_URL=<non-production project URL>
E2E_SUPABASE_ANON_KEY=<non-production anon key>
E2E_SUPABASE_EMAIL=<disposable owner email>
E2E_SUPABASE_PASSWORD=<disposable owner password>
E2E_API_URL=http://127.0.0.1:4000/api
E2E_BASE_URL=http://127.0.0.1:3000
```

Never run `npm run test:e2e` with production values. The tests reject execution
unless `E2E_NON_PRODUCTION=true`, but that marker is not a substitute for
checking the target project and tenant yourself.

For manual acceptance, at desktop (1440×960) and mobile (393×852):

1. Compare every row in the parity ledger with its approved legacy/screenshot
   source; record a screenshot and repro for each mismatch.
2. Exercise login, onboarding resume/completion, dashboard, billing/return,
   order/customer/payment reads, shifts, inventory, and members using only
   disposable non-production data.
3. Confirm `/app/*` is India-only and `/us/*` retains its independent shell,
   terminology, styles, and onboarding flow.
4. Resolve the ledger’s explicit `/app/register` deep-link disposition before
   declaring the legacy India frontend retired.

The release is not accepted until every ledger row is marked passed or has a
documented failure/decision. Do not use blank rows as a substitute for QA
evidence.
