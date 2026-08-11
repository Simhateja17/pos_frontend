import { expect, test } from './fixtures'

const freePlan = {
  key: 'free',
  includedStores: 1,
  region: 'IN' as const,
  currency: 'INR' as const,
  name: 'Free',
  description: 'Essential POS billing and inventory for one retail location.',
  popular: false,
  features: ['POS billing and cart', 'Inventory management', 'GST-ready reports and CSV export', 'Offline billing and sync', 'Email support'],
  monthly: { baseAmountMinor: 0, taxAmountMinor: 0, totalAmountMinor: 0, taxRateBps: 0, taxMode: 'included' as const, taxLabel: 'GST (0% included)' },
  annual: { baseAmountMinor: 0, taxAmountMinor: 0, totalAmountMinor: 0, taxRateBps: 0, taxMode: 'included' as const, taxLabel: 'GST (0% included)' },
  monthlyAvailable: false,
  annualAvailable: false,
  providerConfigured: { monthly: false, annual: false },
}

test.describe('India entitlement UI contract', () => {
  test('shows the server-reported Free usage for implemented resources', async ({ authenticatedPage: page }) => {
    await page.route('**/billing/plans*', (route) => route.fulfill({ json: { mode: 'test', region: 'IN', plans: [freePlan] } }))
    await page.route('**/billing/status', (route) => route.fulfill({
      json: {
        hasSubscription: false,
        entitlement: 'blocked',
        accessAllowed: false,
        graceUntil: null,
        planKey: 'free',
        region: 'IN',
        entitlementSource: 'free',
        entitlementVersion: 'india-mvp-04-v1',
        entitlements: {
          maxLocations: 1,
          maxActiveUsers: 1,
          maxActiveRegisters: 1,
          monthlyPosTransactions: 50,
          monthlySalesOrders: 50,
          monthlyEcommerceOrders: 50,
          monthlyPurchaseOrders: 20,
          monthlyBills: 20,
          dailyApiCalls: 1500,
          integrations: 0,
        },
        usage: {
          businessMonth: '2026-08-01',
          locations: 1,
          activeUsers: 1,
          activeRegisters: 1,
          monthlyPosTransactions: 50,
        },
        subscription: null,
      },
    }))

    await page.goto('/plans')
    await expect(page.getByRole('region', { name: 'Plan usage' })).toContainText('free plan usage')
    await expect(page.getByRole('region', { name: 'Plan usage' })).toContainText('POS transactions')
    await expect(page.getByRole('region', { name: 'Plan usage' })).toContainText('50 / 50')
    await expect(page.getByRole('region', { name: 'Plan usage' })).toContainText('Active users')
  })

  test('keeps the cart intact when the 51st sale is rejected by the entitlement adapter', async ({ authenticatedPage: page }) => {
    let saleRequests = 0
    await page.route('**/products?*', (route) => route.fulfill({ json: [{
      id: 'product-1',
      name: 'Kurta',
      variants: [{ id: 'variant-1', productId: 'product-1', sku: 'K-001', size: 'M', color: 'Blue', material: null, price: '100.00', currentStock: 4 }],
    }] }))
    await page.route('**/sales', (route) => {
      saleRequests += 1
      return route.fulfill({
        status: 403,
        json: {
          error: 'POS transactions limit reached (50/50). Upgrade your plan to continue.',
          code: 'entitlement_limit_reached',
          entitlement: 'monthlyPosTransactions',
          limit: 50,
          usage: 50,
        },
      })
    })

    await page.goto('/checkout?shiftId=41111111-1111-4111-8111-111111111111')
    await page.getByPlaceholder(/scan barcode/i).fill('Kurta')
    await page.getByRole('button', { name: /add/i }).click()
    await page.getByRole('button', { name: 'Cash' }).click()
    await page.getByPlaceholder('₹0.00').fill('100.00')
    await page.getByRole('button', { name: 'Charge sale' }).click()

    await expect(page.getByRole('alert')).toContainText(/50\/50|limit reached/i)
    await expect(page.getByText('Kurta')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Completed sale receipt' })).toHaveCount(0)
    expect(saleRequests).toBe(1)
  })
})
