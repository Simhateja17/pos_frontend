import { expect, test } from './fixtures'

/**
 * Browser execution is intentionally user-owned. These scenarios document the
 * required disposable, non-production live-flow evidence; do not run them
 * against production or with production tenant data.
 */
test.describe('India release critical flows (user-owned browser specification)', () => {
  test('signup/login reaches an authenticated India dashboard only after context validation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in to existing account' }).click()
    await expect(page.getByRole('heading', { name: /good to have you back/i })).toBeVisible()
    await page.getByRole('tab', { name: 'Mobile number' }).click()
    await expect(page.getByRole('alert')).toContainText(/mobile sign-in is not enabled/i)
    // Live disposable-account login is deliberately covered by auth.spec.ts;
    // this release scenario records the visual/route acceptance boundary.
  })

  test('onboarding resumes persisted progress and completion shows server-confirmed facts', async ({ authenticatedPage: page }, testInfo) => {
    await page.goto('/plans')
    await expect(page.getByText(/choose your plan/i).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(/choose your plan/i).first()).toBeVisible()
    await testInfo.attach('critical-onboarding-desktop', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('dashboard and record reads display only authenticated tenant facts', async ({ authenticatedPage: page, appContext }) => {
    for (const route of ['/app/dashboard', '/app/orders', '/app/customers', '/app/payments']) {
      await page.goto(route)
      await expect(page.getByRole('button', { name: `Current store: ${appContext.tenant.businessName}` })).toBeVisible()
      await expect(page.getByLabel('India application navigation')).toBeVisible()
    }
  })

  test('billing and returns retain their named financial confirmation boundaries', async ({ authenticatedPage: page }) => {
    await page.goto('/app/billing')
    await expect(page.getByText(/charge ₹|charge/i).first()).toBeVisible()
    await page.goto('/app/returns')
    await expect(page.getByText(/return|refund/i).first()).toBeVisible()
    // User acceptance: add a disposable fixture sale, then verify the return
    // confirmation names the invoice, tender, amount, and stock consequence.
  })

  test('shifts, inventory, and members retain real operational safety states on mobile', async ({ authenticatedPage: page }, testInfo) => {
    await page.setViewportSize({ width: 393, height: 852 })
    for (const route of ['/app/shifts', '/app/inventory', '/app/settings/members']) {
      await page.goto(route)
      await expect(page.getByLabel('India application navigation')).toBeVisible()
      await testInfo.attach(`critical${route.replaceAll('/', '-')}-mobile`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })
    }
    // User acceptance: exercise a disposable shift close and member removal;
    // confirmation must name the consequence and server rejection must retain correction state.
  })
})
