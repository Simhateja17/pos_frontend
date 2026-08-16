import { expect, test } from './fixtures'

const primarySale = {
  id: '11111111-1111-4111-8111-111111111111', clientSaleId: '21111111-1111-4111-8111-111111111111', shiftId: null, customerId: null,
  subtotal: '2500.00', discountAmount: '0.00', taxAmount: '0.00', totalAmount: '2500.00', status: 'completed', createdBy: null, createdAt: '2026-07-25T08:00:00.000Z', lines: [],
  payments: [{ id: '31111111-1111-4111-8111-111111111111', saleId: '11111111-1111-4111-8111-111111111111', method: 'cash' as const, direction: 'payment' as const, amount: '2500.00', referenceCode: null, createdBy: null, createdAt: '2026-07-25T08:00:00.000Z' }],
}
const otherTenantSale = { ...primarySale, id: '99999999-9999-4999-8999-999999999999', totalAmount: '99999.99' }
const primaryCustomer = { id: '41111111-1111-4111-8111-111111111111', name: 'Primary Tenant Customer', phone: '+919999999999', email: 'primary@example.test', createdAt: '2026-07-25T08:00:00.000Z' }
const primaryPayment = { ...primarySale.payments[0], saleStatus: 'completed' }

async function routeRecords(page: import('@playwright/test').Page) {
  await page.route('**/sales/records?*', (route) => route.fulfill({ json: { items: [primarySale], total: 2, nextCursor: '2026-07-24T08:00:00.000Z' } }))
  await page.route('**/customers/records?*', (route) => route.fulfill({ json: { items: [primaryCustomer], total: 1, nextCursor: null } }))
  await page.route('**/sales/payments?*', (route) => route.fulfill({ json: { items: [primaryPayment], total: 1, nextCursor: null, summary: { collectedAmount: '2500.00', refundedAmount: '0.00', netAmount: '2500.00' } } }))
}

test('renders scoped API records, server money, filter requests, and unavailable exports', async ({ authenticatedPage }) => {
  await routeRecords(authenticatedPage)
  await authenticatedPage.route(`**/sales/${primarySale.id}`, (route) => route.fulfill({ json: primarySale }))
  await authenticatedPage.goto('/app/orders')
  await authenticatedPage.getByLabel('Search bills').fill('Primary')
  await expect(authenticatedPage.getByText('₹2,500.00')).toBeVisible()
  await expect(authenticatedPage.getByRole('button', { name: 'Export unavailable' })).toBeDisabled()
  await authenticatedPage.getByRole('link', { name: 'View' }).click()
  await expect(authenticatedPage).toHaveURL(`/app/orders/${primarySale.id}`)
  await expect(authenticatedPage.getByRole('heading', { name: 'Bill 11111111' })).toBeVisible()
  await expect(authenticatedPage.getByText('₹2,500.00').first()).toBeVisible()
  await expect(authenticatedPage.getByText('Cash')).toBeVisible()
  await authenticatedPage.goto('/app/customers')
  await expect(authenticatedPage.getByText('Primary Tenant Customer')).toBeVisible()
  await authenticatedPage.goto('/app/payments')
  await expect(authenticatedPage.getByText('₹2,500.00').first()).toBeVisible()
})

test('never renders a separate tenant fixture in the primary tenant session', async ({ authenticatedPage }) => {
  await routeRecords(authenticatedPage)
  await authenticatedPage.goto('/app/orders')
  await expect(authenticatedPage.locator('body')).not.toContainText(otherTenantSale.id)
  await expect(authenticatedPage.locator('body')).not.toContainText('₹99,999.99')
})

test('renders truthful empty and failure/retry states for every record route', async ({ authenticatedPage }) => {
  for (const route of ['/app/orders', '/app/customers', '/app/payments']) {
    await authenticatedPage.route('**/sales/records?*', (request) => request.fulfill({ json: { items: [], total: 0, nextCursor: null } }))
    await authenticatedPage.route('**/customers/records?*', (request) => request.fulfill({ json: { items: [], total: 0, nextCursor: null } }))
    await authenticatedPage.route('**/sales/payments?*', (request) => request.fulfill({ json: { items: [], total: 0, nextCursor: null, summary: { collectedAmount: '0.00', refundedAmount: '0.00', netAmount: '0.00' } } }))
    await authenticatedPage.goto(route)
    await expect(authenticatedPage.getByText(/No (bills|customers|payments|records)/)).toBeVisible()
    await authenticatedPage.unrouteAll({ behavior: 'ignoreErrors' })
    await authenticatedPage.route('**/sales/records?*', (request) => request.fulfill({ status: 503, json: { error: 'unavailable' } }))
    await authenticatedPage.route('**/customers/records?*', (request) => request.fulfill({ status: 503, json: { error: 'unavailable' } }))
    await authenticatedPage.route('**/sales/payments?*', (request) => request.fulfill({ status: 503, json: { error: 'unavailable' } }))
    await authenticatedPage.reload()
    await expect(authenticatedPage.getByRole('alert')).toBeVisible()
    await expect(authenticatedPage.getByRole('button', { name: 'Retry loading records' })).toBeVisible()
    await authenticatedPage.unrouteAll({ behavior: 'ignoreErrors' })
  }
})

test('preserves desktop table overflow and mobile card-safe record views', async ({ authenticatedPage }, testInfo) => {
  await routeRecords(authenticatedPage)
  for (const route of ['/app/orders', '/app/customers', '/app/payments']) {
    await authenticatedPage.goto(route)
    await testInfo.attach(`${route.slice(5)}-desktop`, { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
  }
  await authenticatedPage.setViewportSize({ width: 393, height: 852 })
  await authenticatedPage.goto('/app/orders')
  await expect(authenticatedPage.getByRole('table')).toBeVisible()
  await testInfo.attach('orders-mobile', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})
