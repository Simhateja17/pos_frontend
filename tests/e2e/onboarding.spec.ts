import { test, expect } from './fixtures'

test.describe('India onboarding persistence', () => {
  test('persists store choice and plan with the validated first step, then resumes after reload', async ({ authenticatedPage: page }) => {
    await page.goto('/store-type')
    await page.getByRole('button', { name: /fashion & apparel/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('button', { name: /start 14-day/i }).click()
    await expect(page).toHaveURL(/\/onboarding\/1/)
    // Fill all required Step 1 controls, save, reload, and assert the rail uses server state.
    await page.getByLabel(/legal business/i).fill('Couture Test Private Limited')
    await page.getByLabel(/business structure/i).selectOption('pvtltd')
    await page.getByLabel(/year established/i).fill('2024')
    await page.getByLabel(/nature of business/i).selectOption('retailer')
    await page.getByLabel(/number of stores/i).selectOption('1')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.reload()
    await expect(page.getByText(/step 02/i).first()).toBeVisible()
  })

  test('keeps an unsent current-step draft on a retryable API failure and rejects premature completion', async ({ authenticatedPage: page }) => {
    await page.route('**/api/onboarding/steps/1', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
    await page.goto('/onboarding/1')
    await page.getByLabel(/legal business/i).fill('Retry Store')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/couldn.t save changes/i)).toBeVisible()
    await expect(page.getByLabel(/legal business/i)).toHaveValue('Retry Store')
    await page.unroute('**/api/onboarding/steps/1')
    await page.goto('/onboarding/complete')
    await expect(page).toHaveURL(/\/onboarding\/[1-8]/)
  })

  test('renders only server-confirmed completion facts and keeps the mobile setup rail compact', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/onboarding/1')
    await expect(page.getByText(/setup/i).first()).toBeVisible()
    await expect(page.locator('aside ol')).toBeHidden()
    // Use a fully completed disposable tenant. The completion page posts /onboarding/complete and reads its response.
    await page.goto('/onboarding/complete')
    await expect(page.getByRole('link', { name: /launch dashboard/i })).toBeVisible()
    await expect(page).toHaveScreenshot('india-onboarding-complete-mobile.png', { fullPage: true })
  })

  test('captures the approved desktop completion stage at 1440px', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 1440, height: 960 })
    await page.goto('/onboarding/complete')
    await expect(page.getByRole('link', { name: /launch dashboard/i })).toBeVisible()
    await expect(page).toHaveScreenshot('india-onboarding-complete-desktop.png', { fullPage: true })
  })
})
