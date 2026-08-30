import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-ignore TS5097
import { exactScannerMatches } from '../../lib/hardware/barcode-scanner.ts'

const catalog = [
  { name: 'Leading zero EAN', variant: { sku: 'SKU-ONE', barcode: '0012345678905' } },
  { name: 'Second item', variant: { sku: 'SKU-TWO', barcode: '8901234567890' } },
]

test('scanner lookup preserves leading zeroes and requires an exact barcode', () => {
  assert.equal(exactScannerMatches(catalog, '0012345678905')[0]?.name, 'Leading zero EAN')
  assert.equal(exactScannerMatches(catalog, '12345678905').length, 0)
})

test('scanner lookup accepts case-insensitive exact SKU but not partial input', () => {
  assert.equal(exactScannerMatches(catalog, 'sku-two')[0]?.name, 'Second item')
  assert.equal(exactScannerMatches(catalog, 'SKU').length, 0)
})

test('blank scanner suffix events cannot select a product', () => {
  assert.equal(exactScannerMatches(catalog, '  ').length, 0)
})
