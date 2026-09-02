const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const read = (path) => fs.readFileSync(path, 'utf8')

test('regional pricing pages use billing period instead of region controls', () => {
  const india = read('app/pricing/page.tsx')
  const international = read('app/us/pricing/page.tsx')
  assert.doesNotMatch(india, /RegionSwitcher/)
  assert.match(india, /PricingPeriod/)
  assert.match(international, /PricingPeriod/)
})

test('annual cards show a monthly equivalent and annual billing total', () => {
  const grid = read('components/marketing/pricing-plans.tsx')
  assert.match(grid, /plan\.annual\.totalAmountMinor \/ 12/)
  assert.match(grid, /Billed.*annually/)
  assert.match(grid, /billingCycle=\$\{cycle\}/)
})
