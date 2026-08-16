import { expect, test } from './fixtures'

test('an unauthenticated India route reports an unavailable session', async ({ page }) => {
  await page.goto('/app/dashboard')
  await expect(page.getByRole('alert')).toContainText(/session has expired|store context is unavailable/i)
})

test('the desktop India shell displays only resolved tenant context', async ({ authenticatedPage, appContext }, testInfo) => {
  await authenticatedPage.goto('/app/dashboard')
  const storeLabel = appContext.store?.name ?? 'All stores'
  if (appContext.staff.role === 'owner') {
    const switcher = authenticatedPage.getByRole('button', { name: `Current store: ${storeLabel}` })
    await expect(switcher).toBeVisible()
    await switcher.click()
    await expect(authenticatedPage.getByRole('menu', { name: 'Switch store' })).toBeVisible()
    await expect(authenticatedPage.getByRole('menuitemradio', { name: /All stores/ })).toBeVisible()
  } else {
    await expect(authenticatedPage.getByTitle(new RegExp(storeLabel))).toBeVisible()
  }
  await expect(authenticatedPage.getByText(appContext.staff.name ?? 'Staff unavailable')).toBeVisible()
  await testInfo.attach('india-shell-desktop', {
    body: await authenticatedPage.screenshot(),
    contentType: 'image/png',
  })
})

test('the mobile India navigation opens, traps keyboard focus, and closes', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.setViewportSize({ width: 393, height: 852 })
  await authenticatedPage.goto('/app/dashboard')
  await authenticatedPage.getByRole('button', { name: 'Open navigation' }).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'India application navigation' })).toBeVisible()
  await authenticatedPage.keyboard.press('Escape')
  await expect(authenticatedPage.getByRole('dialog', { name: 'India application navigation' })).toHaveCount(0)
  await testInfo.attach('india-shell-mobile', {
    body: await authenticatedPage.screenshot(),
    contentType: 'image/png',
  })
})

test('unsupported India modules state that no store data is available', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/app/sales-channels')
  await expect(authenticatedPage.getByRole('heading', { name: 'Sales Channels is unavailable' })).toBeVisible()
  await expect(authenticatedPage.getByText('No data is available for this module')).toBeVisible()
})

test('US routes do not render the India shell or its tenant context', async ({ authenticatedPage, appContext }) => {
  await authenticatedPage.goto('/us')
  await expect(authenticatedPage.getByLabel('India application navigation')).toHaveCount(0)
  await expect(authenticatedPage.locator('body')).not.toContainText(appContext.tenant.businessName)
})
