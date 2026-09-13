import { test } from 'node:test'
import assert from 'node:assert/strict'
// @ts-ignore Node's strip-types test runner requires the explicit extension.
import { operationalRegionPath } from '../../lib/operational-region-route.ts'

test('International hosts correct India operational links', () => {
  for (const host of ['www.ambelpos.com', 'ambelpos.com']) {
    assert.equal(operationalRegionPath(host, '/app/inventory/catalog/new'), '/us/dashboard/inventory/catalog/new')
    assert.equal(operationalRegionPath(host, '/app/dashboard'), '/us/dashboard')
    assert.equal(operationalRegionPath(host, '/app'), '/us/dashboard')
    assert.equal(operationalRegionPath(host, '/app/orders/abc'), '/us/dashboard/orders/abc')
  }
})
test('India host corrects International operational links', () => {
  assert.equal(operationalRegionPath('in.ambelpos.com', '/us/dashboard'), '/app/dashboard')
  assert.equal(operationalRegionPath('in.ambelpos.com', '/us/dashboard/inventory/catalog/new'), '/app/inventory/catalog/new')
})
test('correct routes, shared auth, API, marketing and non-production hosts stay unchanged', () => {
  for (const [host, path] of [
    ['www.ambelpos.com', '/us/dashboard/inventory'],
    ['in.ambelpos.com', '/app/inventory'],
    ['www.ambelpos.com', '/application'],
    ['www.ambelpos.com', '/login'],
    ['www.ambelpos.com', '/_backend/context'],
    ['in.ambelpos.com', '/us/pricing'],
    ['localhost', '/app/inventory'],
    ['preview.vercel.app', '/app/inventory'],
  ]) assert.equal(operationalRegionPath(host, path), null)
})
