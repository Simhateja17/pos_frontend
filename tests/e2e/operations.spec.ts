import { expect, test } from './fixtures'

const shiftId = '11111111-1111-4111-8111-111111111111'
const memberId = '21111111-1111-4111-8111-111111111111'

test('inventory renders server low-stock facts and its empty state without preview records', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.route('**/stock-movements/low-stock', (route) => route.fulfill({ json: [{ variantId: 'v1', productId: 'p1', productName: 'Cotton Kurta', sku: 'CK-1', size: 'M', color: 'Blue', material: null, quantity: 1, reorderThreshold: 3 }] }))
  await authenticatedPage.goto('/app/inventory')
  await expect(authenticatedPage.getByText('Low-stock exceptions')).toBeVisible()
  await expect(authenticatedPage.getByText('Cotton Kurta')).toBeVisible()
  await authenticatedPage.setViewportSize({ width: 390, height: 844 })
  await testInfo.attach('inventory-mobile-low-stock', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
  await authenticatedPage.route('**/stock-movements/low-stock', (route) => route.fulfill({ json: [] }))
  await authenticatedPage.reload()
  await expect(authenticatedPage.getByText('All stock levels are healthy')).toBeVisible()
})

test('inventory calculates on-hand value from recorded moving-average cost', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/stock-movements/low-stock', (route) => route.fulfill({ json: [] }))
  await authenticatedPage.route('**/products', (route) =>
    route.fulfill({
      json: [
        {
          id: 'p1',
          name: 'Cotton Kurta',
          categoryId: null,
          category: null,
          createdAt: '2026-07-25T00:00:00.000Z',
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              sku: 'CK-1',
              barcode: null,
              unitOfMeasure: 'piece',
              size: 'M',
              color: 'Blue',
              material: null,
              price: '1000.00',
              movingAverageCost: '400.00',
              isTaxable: true,
              reorderThreshold: 3,
              identityLocked: false,
              currentStock: 3,
              createdAt: '2026-07-25T00:00:00.000Z',
            },
            {
              id: 'v2',
              productId: 'p1',
              sku: 'CK-2',
              barcode: null,
              unitOfMeasure: 'piece',
              size: 'L',
              color: 'Blue',
              material: null,
              price: '1000.00',
              movingAverageCost: null,
              isTaxable: true,
              reorderThreshold: 3,
              identityLocked: false,
              currentStock: 2,
              createdAt: '2026-07-25T00:00:00.000Z',
            },
          ],
        },
      ],
    }),
  )

  await authenticatedPage.goto('/app/inventory')
  await expect(authenticatedPage.getByText('₹1,200.00')).toBeVisible()
  await expect(authenticatedPage.getByText('1 variant missing cost basis')).toBeVisible()
})

test('shift close requires a confirmation and retains the correction view when the server rejects it', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.addInitScript((id) => window.localStorage.setItem('couture.activeShiftId', id), shiftId)
  await authenticatedPage.route(`**/shifts/${shiftId}/x-report`, (route) => route.fulfill({ json: { shiftId, expectedCash: '1200.00', cashSalesTotal: '1500.00', cardSalesTotal: '800.00', upiSalesTotal: '450.00', checkSalesTotal: '0.00', refundsTotal: '300.00', saleCount: 4 } }))
  await authenticatedPage.goto('/app/shifts')
  await expect(authenticatedPage.getByText('UPI sales')).toBeVisible()
  await expect(authenticatedPage.getByText('₹450.00')).toBeVisible()
  await authenticatedPage.getByLabel('Counted cash').fill('1100.00')
  await authenticatedPage.getByRole('button', { name: 'Close shift and create Z report' }).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'Close shift and create Z report' })).toBeVisible()
  await authenticatedPage.getByRole('button', { name: 'Keep shift open' }).click()
  await authenticatedPage.getByRole('button', { name: 'Close shift and create Z report' }).click()
  await authenticatedPage.route(`**/shifts/${shiftId}/close`, (route) => route.fulfill({ status: 403, json: { error: 'Only a manager can close this shift.' } }))
  await authenticatedPage.getByRole('dialog').getByRole('button', { name: 'Close shift and create Z report' }).click()
  await expect(authenticatedPage.getByRole('alert')).toBeVisible()
  await authenticatedPage.setViewportSize({ width: 390, height: 844 })
  await testInfo.attach('shift-mobile-rejected-close', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})

test('opening a cash register explains that an opening amount is required', async ({ authenticatedPage }) => {
  const terminal = {
    id: '31111111-1111-4111-8111-111111111111',
    name: 'QA Counter 02',
    isActive: true,
    hasOpenShift: false,
    cashMode: 'cash',
    isCurrentDevice: true,
  }

  await authenticatedPage.route('**/shifts', (route) => route.fulfill({ json: [] }))
  await authenticatedPage.route('**/terminals', (route) => route.fulfill({ json: [terminal] }))
  await authenticatedPage.route('**/terminals/device', (route) => route.fulfill({ json: { terminal } }))
  await authenticatedPage.goto('/app/shifts')

  const openButton = authenticatedPage.getByRole('button', { name: 'Open register' })
  await expect(openButton).toBeEnabled()
  await openButton.click()
  await expect(authenticatedPage.getByRole('alert')).toContainText(
    'Enter the opening cash amount before opening the register. Enter ₹0 if the drawer is empty.',
  )

  await authenticatedPage.getByLabel('Opening cash count').fill('0')
  await expect(authenticatedPage.getByRole('alert')).toHaveCount(0)
})

test('members preserves role denial and explicit destructive removal confirmation', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/members', (route) => route.fulfill({ json: [{ id: memberId, name: 'Asha Singh', role: 'cashier', isActive: true, createdAt: '2026-07-25T00:00:00.000Z' }] }))
  await authenticatedPage.goto('/app/settings/members')
  await authenticatedPage.getByRole('button', { name: 'Manage' }).click()
  await authenticatedPage.getByRole('menuitem', { name: 'Change role' }).click()
  await authenticatedPage.getByRole('button', { name: 'Change role' }).click()
  await authenticatedPage.route(`**/members/${memberId}/role`, (route) => route.fulfill({ status: 403, json: { error: 'Owner role required.' } }))
  await authenticatedPage.getByRole('dialog').getByRole('button', { name: 'Change role' }).click()
  await expect(authenticatedPage.getByRole('alert')).toContainText('existing access remains unchanged')
  await authenticatedPage.getByRole('button', { name: 'Keep current role' }).click()
  await authenticatedPage.getByRole('button', { name: 'Manage' }).click()
  await authenticatedPage.getByRole('menuitem', { name: 'Remove access' }).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'Remove access' })).toContainText('lose access immediately')
  await authenticatedPage.getByRole('button', { name: 'Keep member' }).click()
})

test('unsupported India module is honest about its unavailable contract', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/app/expenses')
  await expect(authenticatedPage.getByRole('heading', { name: 'Expenses is not enabled' })).toBeVisible()
  await expect(authenticatedPage.getByText('No operational data is being simulated')).toBeVisible()
  await expect(authenticatedPage.getByText(/preview rows/i)).toBeVisible()
})
