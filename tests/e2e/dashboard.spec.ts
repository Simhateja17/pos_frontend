import { expect, test } from './fixtures'

const dashboardFixture = {
  range: '7d',
  period: { startsAt: '2026-07-18T18:30:00.000Z', endsAt: '2026-07-25T18:30:00.000Z' },
  sales: { totalAmount: '18250.50', billCount: 8, averageBillAmount: '2281.31', grossMargin: { status: 'unavailable' as const, reason: 'Canonical product cost data is not persisted.' } },
  cashDrawer: { status: 'open' as const, shiftId: 'd3333333-3333-4333-8333-333333333333', openingCash: '5000.00', openedAt: '2026-07-25T03:30:00.000Z' },
  lowStock: { count: 1, items: [{ variantId: 'a1111111-1111-4111-8111-111111111111', productId: 'b2222222-2222-4222-8222-222222222222', productName: 'Tenant One Cotton Kurta', sku: 'T1-KURTA', quantity: 2, reorderThreshold: 5 }] },
  settlement: { status: 'unavailable' as const, reason: 'Settlement status is not persisted.' },
  trend: { revenue: [{ date: '2026-07-20', amount: '5200.00' }, { date: '2026-07-24', amount: '13050.50' }], profit: { status: 'unavailable' as const, reason: 'Canonical product cost data is not persisted.' } },
  actionable: { items: [{ type: 'low_stock' as const, variantId: 'a1111111-1111-4111-8111-111111111111', productName: 'Tenant One Cotton Kurta', sku: 'T1-KURTA', quantity: 2, reorderThreshold: 5 }] },
}

async function mockDashboard(page: import('@playwright/test').Page) {
  await page.route('**/dashboard?range=*', async (route) => {
    const requestedRange = new URL(route.request().url()).searchParams.get('range')
    await route.fulfill({ json: { ...dashboardFixture, range: requestedRange } })
  })
}

test('renders only typed current-tenant dashboard values and unavailable metrics', async ({ authenticatedPage }, testInfo) => {
  await mockDashboard(authenticatedPage)
  await authenticatedPage.goto('/app/dashboard')
  await expect(authenticatedPage.getByText('₹18,250.50')).toBeVisible()
  await expect(authenticatedPage.getByText('Tenant One Cotton Kurta is low on stock')).toBeVisible()
  await expect(authenticatedPage.getByText('Unavailable: Canonical product cost data is not persisted.')).toBeVisible()
  await expect(authenticatedPage.locator('body')).not.toContainText('Tenant Two Preview Product')
  await testInfo.attach('dashboard-desktop', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})

test('requests each supported range and navigates real action links', async ({ authenticatedPage }) => {
  await mockDashboard(authenticatedPage)
  const requests: string[] = []
  authenticatedPage.on('request', (request) => { if (request.url().includes('/dashboard?')) requests.push(request.url()) })
  await authenticatedPage.goto('/app/dashboard')
  await authenticatedPage.getByRole('button', { name: '14 days' }).click()
  await authenticatedPage.getByRole('button', { name: '30 days' }).click()
  await expect.poll(() => requests.some((url) => url.includes('range=7d')) && requests.some((url) => url.includes('range=14d')) && requests.some((url) => url.includes('range=30d'))).toBe(true)
  await authenticatedPage.getByRole('link', { name: 'Tenant One Cotton Kurta is low on stock' }).click()
  await expect(authenticatedPage).toHaveURL(/\/app\/inventory$/)
})

test('renders an honest empty dashboard and captures the mobile stack', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.setViewportSize({ width: 393, height: 852 })
  await pageEmptyDashboard(authenticatedPage)
  await authenticatedPage.goto('/app/dashboard')
  await expect(authenticatedPage.getByText('Your store is ready for its first sale')).toBeVisible()
  await expect(authenticatedPage.getByRole('link', { name: 'Open register' })).toBeVisible()
  await testInfo.attach('dashboard-mobile-empty', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})

test('shows retry after a dashboard failure', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/dashboard?range=*', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }))
  await authenticatedPage.goto('/app/dashboard')
  await expect(authenticatedPage.getByRole('alert')).toContainText('We couldn’t load current store data')
  await expect(authenticatedPage.getByRole('button', { name: 'Retry loading dashboard' })).toBeVisible()
})

async function pageEmptyDashboard(page: import('@playwright/test').Page) {
  await page.route('**/dashboard?range=*', (route) => route.fulfill({ json: { ...dashboardFixture, sales: { ...dashboardFixture.sales, totalAmount: '0.00', billCount: 0, averageBillAmount: '0.00' }, cashDrawer: { status: 'no_open_shift' }, lowStock: { count: 0, items: [] }, trend: { ...dashboardFixture.trend, revenue: [] }, actionable: { items: [] } } }))
}
