import { test, expect } from './fixtures'

/**
 * The onboarding wizard is gone. Business identity and GST are captured once at
 * signup, plan selection is the only step between signup and the app, and the
 * remaining setup is done in-context from the dashboard's setup prompt.
 */
test.describe('India onboarding', () => {
  test('plan selection records the tier and lands the owner in the app', async ({ authenticatedPage: page }) => {
    await page.goto('/plans')
    await page.getByRole('button', { name: /starter/i }).click()
    await page.getByRole('button', { name: /start 14-day/i }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('a failed plan save still lets the owner reach the app', async ({ authenticatedPage: page }) => {
    await page.route('**/api/onboarding/steps/1', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/plans')
    await page.getByRole('button', { name: /start 14-day/i }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/)
    await page.unroute('**/api/onboarding/steps/1')
  })

  test('the retired wizard route no longer strands a bookmark', async ({ authenticatedPage: page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('renders only server-confirmed completion facts', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 1440, height: 960 })
    await page.goto('/onboarding/complete')
    await expect(page.getByRole('link', { name: /launch dashboard/i })).toBeVisible()
    // The vertical picker is gone, so no category is reported.
    await expect(page.getByText(/^category$/i)).toHaveCount(0)
  })
})
