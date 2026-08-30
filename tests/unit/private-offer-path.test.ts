import assert from 'node:assert/strict'
import test from 'node:test'
import {
  billingCycleForCatalog,
  billingCyclesForCatalog,
  checkoutPathWithOffer,
} from '../../lib/billing/private-offer-path.ts'

test('keeps a negotiated offer attached to the checkout redirect', () => {
  assert.equal(
    checkoutPathWithOffer('IN', '3d91bf18-3111-40de-bb15-c9b3f37e5f58'),
    '/plans?region=IN&offer=3d91bf18-3111-40de-bb15-c9b3f37e5f58',
  )
})

test('falls back to the regional catalogue when there is no offer', () => {
  assert.equal(checkoutPathWithOffer('IN'), '/plans?region=IN')
})

test('uses the offer cycle when a bare checkout URL resolves to a private offer', () => {
  assert.equal(
    billingCycleForCatalog('annual', { privateOfferId: 'offer-1', billingCycle: 'monthly' }),
    'monthly',
  )
})

test('keeps the selected cycle for the public catalogue', () => {
  assert.equal(billingCycleForCatalog('annual', {}), 'annual')
})

test('shows only monthly for a monthly private offer', () => {
  assert.deepEqual(
    billingCyclesForCatalog({ privateOfferId: 'offer-1', billingCycle: 'monthly' }),
    ['monthly'],
  )
})

test('shows only annual for an annual private offer', () => {
  assert.deepEqual(
    billingCyclesForCatalog({ privateOfferId: 'offer-2', billingCycle: 'annual' }),
    ['annual'],
  )
})

test('shows both cycles for public plans', () => {
  assert.deepEqual(billingCyclesForCatalog({}), ['monthly', 'annual'])
})
