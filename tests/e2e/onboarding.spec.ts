import { test, expect } from './fixtures'

/**
 * India onboarding now requires a verified paid subscription. These checks
 * cover the payment summary and the test-mode configuration guard without
 * opening an external Razorpay Checkout session.
 */
test.describe('India onboarding billing', () => {
  test('paid plan selection shows the exact tax-inclusive payment summary', async ({ authenticatedPage: page }) => {
    await page.goto('/plans')
    await page.getByRole('button', { name: /starter/i }).click()
    await expect(page.getByText(/GST \(18% included\)/i)).toBeVisible()
    await expect(page.getByText(/total payable/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /pay .*activate/i })).toBeVisible()
  })

  test('the payment action is unavailable until a Razorpay test Plan ID is configured', async ({ authenticatedPage: page }) => {
    await page.goto('/plans')
    await expect(page.getByText(/waiting for its Razorpay Plan ID/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /pay .*activate/i })).toBeDisabled()
  })

  test('a stale onboarding bookmark returns to the paid plan step', async ({ authenticatedPage: page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/plans/)
  })
})
