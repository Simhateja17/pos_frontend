/**
 * OFFLINE-01 — durable local storage for the sale outbox.
 *
 * IndexedDB, not localStorage. localStorage is synchronous, ~5MB, and is
 * cleared by "clear site data" and some privacy modes without warning. A queued
 * sale is money the store has already taken across the counter; losing it to a
 * storage eviction is the exact failure this phase exists to prevent.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type QueuedSaleStatus =
  /** Waiting for a sync attempt. */
  | 'pending'
  /** A sync attempt is in flight right now. */
  | 'sending'
  /** Permanently rejected by the server — needs a human decision. */
  | 'dead'

export interface QueuedSale {
  /** Primary key. The same value sent as `clientSaleId`. */
  clientSaleId: string
  /** Exact request body for POST /sales, stored verbatim. */
  body: unknown
  status: QueuedSaleStatus
  attempts: number
  /** Message from the most recent failure, for the reconciliation screen. */
  lastError: string | null
  /** HTTP status of the most recent failure, if any. */
  lastStatus: number | null
  createdAt: string
  updatedAt: string
  /** Cart total at queue time, so the UI can show what the customer was told. */
  estimatedTotal: string
  /** Server's authoritative total once synced — may differ from the estimate. */
  confirmedTotal: string | null
  /** Server sale id once synced. */
  saleId: string | null
}

interface OutboxSchema extends DBSchema {
  sales: {
    key: string
    value: QueuedSale
    indexes: { 'by-status': QueuedSaleStatus; 'by-created': string }
  }
}

const DB_NAME = 'couture-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<OutboxSchema>> | null = null

export function getOutboxDb() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this environment')
  }
  if (!dbPromise) {
    dbPromise = openDB<OutboxSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('sales', { keyPath: 'clientSaleId' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-created', 'createdAt')
      },
    })
  }
  return dbPromise
}

/** True when durable queuing is possible at all. */
export function isOutboxSupported() {
  return typeof indexedDB !== 'undefined'
}

/** Test seam — drops the cached connection so a suite can reopen cleanly. */
export function resetOutboxDbForTests() {
  dbPromise = null
}
