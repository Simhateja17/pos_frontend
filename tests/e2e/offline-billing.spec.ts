import { test, expect, type Page } from '@playwright/test'

/**
 * OFFLINE-01 — outbox durability and the reconciliation screen, in a real
 * browser against the real IndexedDB implementation.
 *
 * These drive IndexedDB directly rather than importing `lib/offline/queue`:
 * Next does not serve raw module paths to the page, so `page.evaluate` cannot
 * import app code. What matters here is the contract the queue writes — a
 * durable `sales` store keyed by `clientSaleId` — and that the UI reflects it.
 *
 * Not covered here (deliberately):
 * - exactly-once recording, which is enforced by the database and covered in
 *   `backend/tests/checkout/sale-idempotency.test.ts`;
 * - claim/resolve/backoff logic, which wants a unit harness with
 *   `fake-indexeddb`. The frontend has no vitest setup yet — see TODO below.
 */

const DB_NAME = 'couture-offline'
const PAGE = '/app/offline-sync'

/**
 * IndexedDB is origin-scoped, so outbox durability can be proven on any page of
 * the origin. `/login` is used because it renders without a session; `/app/*`
 * redirects to login when unauthenticated, which destroys the evaluate context
 * mid-test.
 */
const PUBLIC_PAGE = '/login'

/**
 * The reconciliation UI needs a real authenticated session with a tenant.
 * Supply disposable NON-PRODUCTION credentials to run those assertions.
 */
const HAS_SESSION = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD)

type SeedEntry = {
  clientSaleId: string
  status: 'pending' | 'sending' | 'dead'
  estimatedTotal: string
  lastError?: string | null
}

/** Write entries straight into the outbox store the app reads from. */
async function seedOutbox(page: Page, entries: SeedEntry[]) {
  await page.evaluate(
    ({ dbName, rows }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(dbName, 1)
        open.onupgradeneeded = () => {
          const db = open.result
          if (!db.objectStoreNames.contains('sales')) {
            const store = db.createObjectStore('sales', { keyPath: 'clientSaleId' })
            store.createIndex('by-status', 'status')
            store.createIndex('by-created', 'createdAt')
          }
        }
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction('sales', 'readwrite')
          const now = new Date().toISOString()
          for (const row of rows) {
            tx.objectStore('sales').put({
              clientSaleId: row.clientSaleId,
              body: { clientSaleId: row.clientSaleId },
              status: row.status,
              attempts: 0,
              lastError: row.lastError ?? null,
              lastStatus: null,
              createdAt: now,
              updatedAt: now,
              estimatedTotal: row.estimatedTotal,
              confirmedTotal: null,
              saleId: null,
            })
          }
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
    { dbName: DB_NAME, rows: entries },
  )
}

async function readOutboxCount(page: Page): Promise<number> {
  return page.evaluate(
    (dbName) =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open(dbName, 1)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          const req = db.transaction('sales', 'readonly').objectStore('sales').count()
          req.onsuccess = () => {
            const n = req.result
            db.close()
            resolve(n)
          }
          req.onerror = () => reject(req.error)
        }
      }),
    DB_NAME,
  )
}

async function clearOutbox(page: Page) {
  await page.evaluate(
    (dbName) =>
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbName)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      }),
    DB_NAME,
  )
  await page.evaluate(() => localStorage.removeItem('couture-offline-history'))
}

test.describe('OFFLINE-01 sale outbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLIC_PAGE)
    await clearOutbox(page)
  })

  test('a queued sale survives a full page reload', async ({ page }) => {
    await seedOutbox(page, [
      { clientSaleId: 'aaaaaaaa-0000-0000-0000-000000000001', status: 'pending', estimatedTotal: '108.25' },
    ])

    // The reason for IndexedDB over in-memory state: a refresh or crash at the
    // till must not lose a sale the customer has already paid for.
    await page.reload()

    expect(await readOutboxCount(page)).toBe(1)
  })

  test('the reconciliation screen lists queued sales', async ({ page }) => {
    test.skip(!HAS_SESSION, 'Needs E2E_EMAIL / E2E_PASSWORD for an authenticated /app/* session')
    await seedOutbox(page, [
      { clientSaleId: 'bbbbbbbb-0000-0000-0000-000000000001', status: 'pending', estimatedTotal: '499.00' },
    ])
    await page.goto(PAGE)

    await expect(page.getByText('Queued sales')).toBeVisible()
    await expect(page.getByText('BBBBBBBB')).toBeVisible()
    await expect(page.getByText('₹499.00')).toBeVisible()
  })

  test('a rejected sale is surfaced for a decision, not hidden', async ({ page }) => {
    test.skip(!HAS_SESSION, 'Needs E2E_EMAIL / E2E_PASSWORD for an authenticated /app/* session')
    await seedOutbox(page, [
      {
        clientSaleId: 'cccccccc-0000-0000-0000-000000000001',
        status: 'dead',
        estimatedTotal: '2500.00',
        lastError: 'This shift has already been closed and cannot accept new sales.',
      },
    ])
    await page.goto(PAGE)

    // A sale the server refused must never be silently dropped — it is money
    // that was taken across the counter.
    await expect(page.getByText('Needs a decision')).toBeVisible()
    await expect(page.getByText('This shift has already been closed and cannot accept new sales.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible()
  })

  test('an empty outbox reads as intentional, not broken', async ({ page }) => {
    test.skip(!HAS_SESSION, 'Needs E2E_EMAIL / E2E_PASSWORD for an authenticated /app/* session')
    await page.goto(PAGE)
    await expect(page.getByText('Nothing queued')).toBeVisible()
  })
})

// TODO(Phase 4 follow-up): add a vitest + fake-indexeddb unit suite for
// lib/offline/queue.ts covering claimNext() single-assignment under concurrent
// drains, releaseForRetry() vs resolveSynced() removal semantics, and
// sync.ts backoff/dead-letter classification. The frontend currently has no
// unit-test runner configured, only Playwright.
