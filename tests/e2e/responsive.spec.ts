import { expect, test } from './fixtures'

/*
 * The India design system is a port of a desktop-only prototype, so the
 * failure mode these tests guard is a fixed desktop grid surviving into a
 * phone viewport and pushing the page sideways. They deliberately use the
 * unauthenticated `page` fixture: layout is a CSS concern, the shell and the
 * page/card headers render before any tenant data resolves, and keeping these
 * backend-free means the guard runs anywhere.
 */

const PHONE = { width: 390, height: 844 }

const ROUTES = [
  '/app/dashboard',
  '/app/orders',
  '/app/inventory',
  '/app/customers',
  '/app/payments',
  '/app/purchases',
  '/app/reports',
  '/app/offline-sync',
  '/checkout',
]

/*
 * These screens render their header and KPI row only once the context request
 * has settled — unauthenticated, that means after the failure comes back. Wait
 * for the network to go quiet so assertions run against the settled layout
 * rather than an empty first paint.
 */
async function openSettled(page: import('@playwright/test').Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
}

for (const route of ROUTES) {
  test(`${route} fits a phone viewport without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openSettled(page, route)

    // scrollWidth is the honest check: it catches any descendant that escapes
    // the viewport, including ones a per-element assertion would miss.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
}

test('the KPI row reflows from its desktop column count down to two on a phone', async ({ page }) => {
  // /app/orders asks for four columns, which is what the old inline
  // grid-template-columns pinned it to at every width.
  await page.setViewportSize(PHONE)
  await openSettled(page, '/app/orders')

  const kpiRow = page.locator('.kpi-row').first()
  await expect(kpiRow).toBeVisible()
  const phoneColumns = await kpiRow.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(phoneColumns).toBe(2)

  await page.setViewportSize({ width: 1440, height: 900 })
  const desktopColumns = await kpiRow.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(desktopColumns).toBe(4)
})

test('the billing split collapses on a phone and keeps its wide aside on desktop', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await openSettled(page, '/checkout')

  const split = page.locator('.split-2').first()
  await expect(split).toBeVisible()
  expect(await split.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1)

  // The payment column is set through --split-aside; desktop must still get it.
  await page.setViewportSize({ width: 1440, height: 900 })
  expect(await split.evaluate((el) => getComputedStyle(el).gridTemplateColumns)).toMatch(/ 420px$/)
})

test('the topbar drops its desktop-only clusters and the drawer stays off-canvas', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await openSettled(page, '/app/orders')

  const sidebar = page.locator('.sidebar')
  await expect(sidebar).toHaveCSS('position', 'fixed')
  // Off-canvas rather than hidden, so the open transition has something to move.
  expect(await sidebar.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0)

  await expect(page.locator('.crumb')).toBeHidden()
  await expect(page.locator('.store-switch')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
})
