import assert from 'node:assert/strict'
import test from 'node:test'
// Node's type-stripping test runner requires the explicit extension.
// @ts-ignore TS5097
import * as salePreparation from '../../lib/checkout/sale-preparation.ts'

const {
  checkoutDiscountState,
  saleContentSignature,
  serializeMoneyIfPresent,
  serializeOptionalMoney,
  serializeOptionalPercent,
} = salePreparation

test('sale payload money uses the API two-decimal contract', () => {
  assert.equal(serializeOptionalMoney('100'), '100.00')
  assert.equal(serializeOptionalMoney('50.5'), '50.50')
  assert.equal(serializeOptionalMoney('0'), undefined)
})

test('idempotency comparison ignores the key but detects a different bill', () => {
  const first = { clientSaleId: 'first', lines: [{ quantity: 1 }], payments: [{ amount: '100.00' }] }
  const retry = { ...first, clientSaleId: 'retry-key' }
  const changed = { ...first, clientSaleId: 'first', lines: [{ quantity: 2 }] }
  assert.equal(saleContentSignature(first), saleContentSignature(retry))
  assert.notEqual(saleContentSignature(first), saleContentSignature(changed))
})

test('optional cash does not serialize an absent value as NaN', () => {
  assert.equal(serializeMoneyIfPresent(undefined), undefined)
  assert.equal(serializeMoneyIfPresent(''), undefined)
  assert.equal(serializeMoneyIfPresent('1591.82'), '1591.82')
})

test('percent discounts support the exact 100 percent boundary', () => {
  assert.equal(serializeOptionalPercent('15'), '15.00')
  assert.equal(serializeOptionalPercent('100'), '100.00')
})

test('invalid line discounts do not alter the tender total', () => {
  const negative = checkoutDiscountState([{ unitPrice: '1299.00', quantity: 1, discountAmount: '-50' }], 'none', '')
  assert.equal(negative.discountedSubtotal, 1299)
  assert.match(negative.error ?? '', /cannot be negative/i)

  const excessive = checkoutDiscountState([{ unitPrice: '1299.00', quantity: 1, discountAmount: '1500' }], 'none', '')
  assert.equal(excessive.discountedSubtotal, 1299)
  assert.match(excessive.error ?? '', /cannot exceed/i)
})

test('bill summary discount includes valid line and whole-bill discounts', () => {
  const state = checkoutDiscountState([{ unitPrice: '1299.00', quantity: 1, discountAmount: '50' }], 'amount', '100')
  assert.equal(state.grossSubtotal, 1299)
  assert.equal(state.lineDiscountTotal, 50)
  assert.equal(state.cartDiscount, 100)
  assert.equal(state.totalDiscount, 150)
  assert.equal(state.discountedSubtotal, 1149)
})
