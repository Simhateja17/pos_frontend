import assert from 'node:assert/strict'
import test from 'node:test'
import { checkoutPathWithOffer } from '../../lib/billing/private-offer-path.ts'

test('keeps a negotiated offer attached to the checkout redirect', () => {
  assert.equal(
    checkoutPathWithOffer('IN', '3d91bf18-3111-40de-bb15-c9b3f37e5f58'),
    '/plans?region=IN&offer=3d91bf18-3111-40de-bb15-c9b3f37e5f58',
  )
})

test('falls back to the regional catalogue when there is no offer', () => {
  assert.equal(checkoutPathWithOffer('IN'), '/plans?region=IN')
})
