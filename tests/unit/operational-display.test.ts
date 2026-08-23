import assert from 'node:assert/strict'
import test from 'node:test'

// Node's type-stripping test runner requires the explicit extension; the app
// compiler resolves the same module through the @/ alias.
// @ts-ignore TS5097
import * as operationalDisplay from '../../lib/operational-display.ts'

const {
  equalIntraStateTaxSplit,
  inventoryStatus,
  inventoryVariantMatches,
  normalizeReorderReason,
  purchaseStatusFilters,
} = operationalDisplay

test('SUP-04 exposes the cancelled purchase-order filter', () => {
  assert.ok(purchaseStatusFilters.some((item) => item.value === 'cancelled'))
})

test('reorder display accepts the legacy persisted stock key', () => {
  assert.equal(normalizeReorderReason({ stock: 3, onOrder: 0 }).currentStock, 3)
})

test('zero stock has the same label everywhere', () => {
  assert.deepEqual(inventoryStatus(0, 4), { label: 'Out of stock', tone: 'red' })
  assert.deepEqual(inventoryStatus(2, 4), { label: 'Low stock', tone: 'amber' })
  assert.deepEqual(inventoryStatus(5, 4), { label: 'In stock', tone: 'green' })
})

test('NV-01 inventory search covers case-insensitive barcode, colour and size fields', () => {
  const variant = { sku: 'QA-KURTA-04', barcode: '890QA100003', size: 'M', color: 'Teal', material: 'Cotton' }
  assert.equal(inventoryVariantMatches('QA - Cotton Kurta', variant, '890QA100003'), true)
  assert.equal(inventoryVariantMatches('QA - Cotton Kurta', variant, 'teal'), true)
  assert.equal(inventoryVariantMatches('QA - Cotton Kurta', variant, 'm'), true)
  assert.equal(inventoryVariantMatches('QA - Cotton Kurta', variant, 'magenta'), false)
})

test('SALE-08 keeps odd-paisa intra-state components equal', () => {
  assert.deepEqual(equalIntraStateTaxSplit(157.05), {
    cgst: 78.53,
    sgst: 78.53,
    roundingAdjustment: -0.01,
  })
})
