import assert from 'node:assert/strict'
import test from 'node:test'
// Node's type-stripping test runner requires the explicit extension.
// @ts-ignore TS5097
import { globalSearchMatchScore, isScannableBarcode, normalizeSearchValue } from '../../lib/global-search.ts'

test('global search matching is case-insensitive and trims operator input', () => {
  assert.equal(normalizeSearchValue('  QA-FROCK  '), 'qa-frock')
  assert.equal(globalSearchMatchScore('frock', ['Kids Frock']), 100)
  assert.equal(globalSearchMatchScore('kids', ['Kids Frock']), 200)
})

test('exact operational identifiers outrank prefixes and partial matches', () => {
  const exactBarcode = globalSearchMatchScore('8901234567890', ['8901234567890'], 40)
  const exactSku = globalSearchMatchScore('QA-FROCK-01', ['QA-FROCK-01'], 30)
  const prefix = globalSearchMatchScore('QA-FROCK', ['QA-FROCK-01'])
  assert.ok(exactBarcode > exactSku)
  assert.ok(exactSku > prefix)
})

test('only valid persisted barcode shapes can trigger direct navigation', () => {
  assert.equal(isScannableBarcode('89012345'), true)
  assert.equal(isScannableBarcode('89012345678901'), true)
  assert.equal(isScannableBarcode('1234567'), false)
  assert.equal(isScannableBarcode('QA-FROCK-01'), false)
})
