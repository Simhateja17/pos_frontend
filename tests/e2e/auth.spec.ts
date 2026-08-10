import { expect, test } from '@playwright/test'

async function openLogin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Good to have you back.' })).toBeVisible()
}

async function completeAccountStep(page: import('@playwright/test').Page) {
  await page.goto('/signup')
  await page.getByLabel(/Full name/).fill('Test Owner')
  await page.getByLabel(/Mobile number/).fill('9820000000')
  await page.getByLabel(/^Email address/).fill('owner@example.test')
  await page.getByLabel(/^Password/).fill('test-password')
  await page.getByLabel(/I agree to Ambel POS/).check()
  await page.getByRole('button', { name: 'Create account & continue' }).click()
}

test('lands straight on the India login form and captures desktop evidence', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Good to have you back.' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('india-login-form-1440.png'), fullPage: true })

  await expect(page.getByRole('tablist', { name: 'Sign-in method' })).toBeVisible()
  await expect(page.getByLabel(/^Email address/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('retains the two-step India signup flow and captures mobile evidence', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await completeAccountStep(page)

  await expect(page.getByRole('heading', { name: 'Complete your business profile.' })).toBeVisible()
  await expect(page.getByLabel(/Business name/)).toBeVisible()
  await expect(page.getByLabel(/PIN code/)).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('india-signup-business-mobile.png'), fullPage: true })
})

test('shows a safe invalid-login error without clearing entered credentials', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid email or password' }) })
  })
  await openLogin(page)

  await page.getByLabel(/^Email address/).fill('owner@example.test')
  await page.getByLabel(/^Password/).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.')
  await expect(page.getByLabel(/^Email address/)).toHaveValue('owner@example.test')
  await expect(page.getByLabel(/^Password/)).toHaveValue('wrong-password')
  await expect(page).toHaveURL(/\/login$/)
})

test('maps duplicate-account backend errors to the signup email field without changing the form step', async ({ page }) => {
  await page.route('**/api/auth/signup', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'An account already exists with this email. Log in instead' }),
    })
  })
  await completeAccountStep(page)
  await page.getByLabel(/Business name/).fill('Test Boutique')
  await page.getByLabel(/Business address/).fill('1 Test Street')
  await page.getByLabel(/^PIN code/).fill('400001')
  await page.getByRole('button', { name: 'Create account' }).click()

  const emailError = page.getByText('An account already exists with this email. Log in instead')
  await expect(emailError).toBeVisible()
  await expect(page.getByLabel(/^Email address/)).toHaveValue('owner@example.test')
  await expect(page.getByRole('heading', { name: 'Complete your business profile.' })).toBeVisible()
})

test('allows a disposable non-production account to enter only after backend session and context validation', async ({ page }) => {
  test.skip(
    process.env.E2E_NON_PRODUCTION !== 'true' || !process.env.E2E_SUPABASE_EMAIL || !process.env.E2E_SUPABASE_PASSWORD,
    'Requires disposable non-production E2E credentials.',
  )

  await openLogin(page)
  await page.getByLabel(/^Email address/).fill(process.env.E2E_SUPABASE_EMAIL!)
  await page.getByLabel(/^Password/).fill(process.env.E2E_SUPABASE_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
})
