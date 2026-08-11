import { readFile } from 'node:fs/promises'
import { expect, test } from './fixtures'

const HAS_DISPOSABLE_SESSION =
  process.env.E2E_NON_PRODUCTION === 'true' &&
  Boolean(process.env.E2E_SUPABASE_URL) &&
  Boolean(process.env.E2E_SUPABASE_ANON_KEY) &&
  Boolean(process.env.E2E_SUPABASE_EMAIL) &&
  Boolean(process.env.E2E_SUPABASE_PASSWORD)

test.describe('India operational reports', () => {
  test.skip(!HAS_DISPOSABLE_SESSION, 'Requires seeded disposable non-production report data.')

  test('runs payment and goods-received reports and downloads their server rows', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/app/reports')
    await expect(authenticatedPage.getByRole('heading', { name: 'Reports' })).toBeVisible()

    await authenticatedPage.getByRole('button', { name: 'Payments' }).click()
    await authenticatedPage.getByRole('button', { name: 'Payments by method' }).click()
    await expect(authenticatedPage.getByRole('heading', { name: 'Payments by method' })).toBeVisible()
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    const paymentDownload = authenticatedPage.waitForEvent('download')
    await authenticatedPage.getByRole('button', { name: 'Export CSV' }).click()
    const paymentFile = await paymentDownload
    expect(paymentFile.suggestedFilename()).toMatch(/^payments-by-method-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/)
    const paymentCsv = await readFile((await paymentFile.path())!, 'utf8')
    expect(paymentCsv).toContain('Payment method')
    expect(paymentCsv).toContain('Net amount')
    expect(paymentCsv.trim().split('\n').length).toBeGreaterThan(1)

    await authenticatedPage.getByRole('button', { name: 'Purchases' }).click()
    await authenticatedPage.getByRole('button', { name: 'Goods received by day' }).click()
    await expect(authenticatedPage.getByRole('heading', { name: 'Goods received by day' })).toBeVisible()
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    const receiptDownload = authenticatedPage.waitForEvent('download')
    await authenticatedPage.getByRole('button', { name: 'Export CSV' }).click()
    const receiptFile = await receiptDownload
    expect(receiptFile.suggestedFilename()).toMatch(/^goods-received-by-day-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/)
    const receiptCsv = await readFile((await receiptFile.path())!, 'utf8')
    expect(receiptCsv).toContain('Receipt date')
    expect(receiptCsv).toContain('Receipt cost')
    expect(receiptCsv.trim().split('\n').length).toBeGreaterThan(1)
  })
})
