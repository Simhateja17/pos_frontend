import { expect, test } from './fixtures'

const indiaRoutes = [
  '/app/dashboard',
  '/app/billing',
  '/app/orders',
  '/app/customers',
  '/app/payments',
  '/app/returns',
  '/app/shifts',
  '/app/inventory',
  '/app/settings/members',
  '/app/expenses',
]

test.describe('India and US route isolation (user-owned browser specification)', () => {
  test('every approved India route keeps the India shell and resolves independently of US pages', async ({ authenticatedPage }) => {
    for (const route of indiaRoutes) {
      await authenticatedPage.goto(route)
      await expect(authenticatedPage.getByLabel('India application navigation')).toBeVisible()
      await expect(authenticatedPage).toHaveURL(new RegExp(`${route.replace(/[/?]/g, '\\$&')}$`))
    }
  })

  test('an unavailable India module is explicit rather than a legacy preview', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/app/expenses')
    await expect(authenticatedPage.getByRole('heading', { name: 'Expenses is not enabled' })).toBeVisible()
    await expect(authenticatedPage.getByText('No operational data is being simulated')).toBeVisible()
    await expect(authenticatedPage.locator('table, [data-preview], .kpi')).toHaveCount(0)
  })

  test('US routes retain their independent composition at desktop and mobile widths', async ({ authenticatedPage, appContext }, testInfo) => {
    for (const viewport of [{ width: 1440, height: 960, name: 'desktop' }, { width: 393, height: 852, name: 'mobile' }]) {
      await authenticatedPage.setViewportSize(viewport)
      await authenticatedPage.goto('/us')
      await expect(authenticatedPage.getByLabel('India application navigation')).toHaveCount(0)
      await expect(authenticatedPage.getByText('Modern POS for US Retail')).toBeVisible()
      await expect(authenticatedPage.locator('body')).not.toContainText(appContext.tenant.businessName)
      await testInfo.attach(`us-route-isolation-${viewport.name}`, {
        body: await authenticatedPage.screenshot(),
        contentType: 'image/png',
      })
    }
  })

  test('India onboarding and US onboarding use separate route families and stored state', async ({ authenticatedPage }) => {
    // India's wizard is retired; /onboarding now redirects into the app.
    await authenticatedPage.goto('/onboarding')
    await expect(authenticatedPage).toHaveURL(/\/app\/dashboard/)

    // The US surface keeps its own untouched onboarding route family.
    await authenticatedPage.goto('/us/onboarding/1')
    await expect(authenticatedPage).toHaveURL(/\/us\/onboarding\/1$/)
    await expect(authenticatedPage.getByLabel('India application navigation')).toHaveCount(0)
  })
})
