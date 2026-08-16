import { expect, test } from './fixtures'

const saleId = '11111111-1111-4111-8111-111111111111'
const lineId = '21111111-1111-4111-8111-111111111111'
const variantId = '31111111-1111-4111-8111-111111111111'

const sale = {
  id: saleId, customerId: null, totalAmount: '1180.00', createdAt: '2026-07-25T08:00:00.000Z',
  lines: [{ id: lineId, variantId, quantity: 1, unitPrice: '1000.00', lineTotal: '1180.00' }],
  payments: [{ method: 'cash' as const, direction: 'payment' as const, amount: '1180.00', referenceCode: null }],
}

test('checkout retains correction state until the sale API confirms a charge', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.route('**/products?*', (route) => route.fulfill({ json: [{ id: 'p', name: 'Kurta', variants: [{ id: variantId, productId: 'p', sku: 'K-001', size: 'M', color: 'Blue', material: null, price: '1000.00', currentStock: 4 }] }] }))
  await authenticatedPage.goto('/checkout?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByPlaceholder(/scan barcode/i).fill('Kurta')
  await authenticatedPage.getByRole('button', { name: /add/i }).click()
  await authenticatedPage.getByRole('button', { name: 'Cash' }).click()
  await authenticatedPage.getByPlaceholder('₹0.00').fill('1000.00')
  await expect(authenticatedPage.getByText('Pre-charge estimate')).toBeVisible()
  await expect(authenticatedPage.getByRole('button', { name: 'Charge sale' })).toBeVisible()
  await authenticatedPage.route('**/sales', (route) => route.fulfill({ status: 400, json: { error: 'Stock changed. Correct this bill and try again.' } }))
  await authenticatedPage.getByRole('button', { name: 'Charge sale' }).click()
  await expect(authenticatedPage.getByRole('alert')).toContainText('Stock changed')
  await expect(authenticatedPage.getByText('Kurta')).toBeVisible()
  await testInfo.attach('checkout-desktop-error', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})

test('checkout shows a receipt only after a successful server charge and resend outcome', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/products?*', (route) => route.fulfill({ json: [{ id: 'p', name: 'Kurta', variants: [{ id: variantId, productId: 'p', sku: 'K-001', size: 'M', color: 'Blue', material: null, price: '1000.00', currentStock: 4 }] }] }))
  await authenticatedPage.route('**/customers?*', (route) => route.fulfill({ json: [{ id: '41111111-1111-4111-8111-111111111111', name: 'Asha', phone: '+919999999999', email: 'asha@example.test' }] }))
  await authenticatedPage.route('**/sales/*/resend-receipt', (route) => route.fulfill({ status: 200, json: { ok: true, email: 'asha@example.test' } }))
  await authenticatedPage.route('**/sales', (route) => route.fulfill({ status: 201, json: { id: saleId, createdAt: '2026-07-25T08:00:00.000Z', subtotal: '2000.00', discountAmount: '0.00', taxAmount: '360.00', totalAmount: '2360.00', businessName: 'Test Store', lines: [{ variantId, quantity: 2, unitPrice: '1000.00', lineTotal: '2000.00' }] } }))
  await authenticatedPage.goto('/checkout?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByPlaceholder(/scan barcode/i).fill('Kurta')
  await authenticatedPage.getByRole('button', { name: /add/i }).click()
  await authenticatedPage.getByLabel('Increase quantity for Kurta').click()
  await authenticatedPage.getByPlaceholder(/search by phone/i).fill('Asha')
  await authenticatedPage.getByRole('button', { name: /Asha/ }).click()
  await authenticatedPage.getByRole('button', { name: 'Cash' }).click()
  await authenticatedPage.getByPlaceholder('₹0.00').fill('2000.00')
  await authenticatedPage.getByRole('button', { name: 'Charge sale' }).click()
  await expect(authenticatedPage.getByRole('region', { name: 'Completed sale receipt' })).toContainText('₹2360.00 recorded by the server')
  await authenticatedPage.getByPlaceholder('Enter customer email').fill('asha@example.test')
  await authenticatedPage.getByRole('button', { name: 'Email receipt' }).click()
  await expect(authenticatedPage.getByText('Receipt sent to asha@example.test.')).toBeVisible()
})

test('returns require an explicit confirmation and report only a server-confirmed refund', async ({ authenticatedPage }, testInfo) => {
  await authenticatedPage.route('**/sales?receiptNumber=*', (route) => route.fulfill({ json: [sale] }))
  await authenticatedPage.goto('/checkout/returns?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByPlaceholder(/receipt or invoice number/i).fill('Q9-202627-0003')
  await authenticatedPage.getByRole('button', { name: 'Search' }).click()
  await authenticatedPage.getByRole('checkbox').check()
  await authenticatedPage.getByRole('button', { name: 'Review refund' }).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'Confirm refund request' })).toBeVisible()
  await authenticatedPage.getByRole('button', { name: 'Keep return open' }).click()
  await expect(authenticatedPage.getByRole('dialog')).toHaveCount(0)
  await authenticatedPage.getByRole('button', { name: 'Review refund' }).click()
  await authenticatedPage.route('**/returns', (route) => route.fulfill({ status: 400, json: { error: 'Cannot return 1; only 0 remain returnable.' } }))
  await authenticatedPage.getByRole('button', { name: 'Confirm refund request' }).click()
  await expect(authenticatedPage.getByRole('alert')).toContainText('only 0 remain returnable')
  await expect(authenticatedPage.getByText('Selected-line estimate')).toBeVisible()
  await authenticatedPage.setViewportSize({ width: 393, height: 852 })
  await testInfo.attach('returns-mobile-rejection', { body: await authenticatedPage.screenshot(), contentType: 'image/png' })
})

test('returns display the server-confirmed amount only after a successful refund', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/sales?receiptNumber=*', (route) => route.fulfill({ json: [sale] }))
  await authenticatedPage.route('**/returns', (route) => route.fulfill({ status: 201, json: { saleId, refundedLines: [{ saleLineItemId: lineId, quantity: 1, refundAmount: '1180.00' }], refundTotal: '1180.00' } }))
  await authenticatedPage.goto('/checkout/returns?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByPlaceholder(/receipt or invoice number/i).fill('Q9-202627-0003')
  await authenticatedPage.getByRole('button', { name: 'Search' }).click()
  await authenticatedPage.getByRole('checkbox').check()
  await authenticatedPage.getByRole('button', { name: 'Review refund' }).click()
  await authenticatedPage.getByRole('button', { name: 'Confirm refund request' }).click()
  await expect(authenticatedPage.getByRole('alert')).toContainText('Refund of ₹1180.00 recorded by the server.')
})

test('Other return reasons require operator details before review', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/sales?receiptNumber=*', (route) => route.fulfill({ json: [sale] }))
  await authenticatedPage.goto('/checkout/returns?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByPlaceholder(/receipt or invoice number/i).fill('Q9-202627-0003')
  await authenticatedPage.getByRole('button', { name: 'Search' }).click()
  await authenticatedPage.getByRole('checkbox').check()

  await authenticatedPage.getByRole('combobox', { name: 'Reason for return' }).selectOption('Other return reason')
  const reviewButton = authenticatedPage.getByRole('button', { name: 'Review refund' })
  await expect(authenticatedPage.getByRole('textbox', { name: 'Describe the reason' })).toBeVisible()
  await expect(reviewButton).toBeDisabled()

  await authenticatedPage.getByRole('textbox', { name: 'Describe the reason' }).fill('Customer reported a fit issue not covered by the preset reasons.')
  await expect(reviewButton).toBeEnabled()
})

test('return lookup makes an empty state explicit', async ({ authenticatedPage }) => {
  await authenticatedPage.route('**/sales?customerSearch=*', (route) => route.fulfill({ json: [] }))
  await authenticatedPage.goto('/checkout/returns?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByRole('tab', { name: 'By customer' }).click()
  await authenticatedPage.getByPlaceholder(/customer name/i).fill('No match')
  await authenticatedPage.getByRole('button', { name: 'Search' }).click()
  await expect(authenticatedPage.getByText(/No matching sale found/i)).toBeVisible()
})

test('return customer lookup suggests customers before searching their sales', async ({ authenticatedPage }) => {
  let saleLookupValue: string | null = null
  let releaseSalesLookup!: () => void
  const salesLookupReleased = new Promise<void>((resolve) => {
    releaseSalesLookup = resolve
  })
  await authenticatedPage.route('**/customers?search=*', (route) =>
    route.fulfill({
      json: [{
        id: '41111111-1111-4111-8111-111111111111',
        name: 'Asha Rao',
        phone: '+919870000002',
        email: 'asha@example.test',
        createdAt: '2026-08-15T09:00:00.000Z',
      }],
    }),
  )
  await authenticatedPage.route('**/sales?customerSearch=*', async (route) => {
    saleLookupValue = new URL(route.request().url()).searchParams.get('customerSearch')
    await salesLookupReleased
    return route.fulfill({ json: [] })
  })

  await authenticatedPage.goto('/checkout/returns?shiftId=41111111-1111-4111-8111-111111111111')
  await authenticatedPage.getByRole('tab', { name: 'By customer' }).click()
  await authenticatedPage.getByPlaceholder(/customer name, phone, or email/i).fill('Asha')
  await expect(authenticatedPage.getByRole('listbox', { name: 'Customer suggestions' })).toBeVisible()
  await authenticatedPage.getByRole('option', { name: /Asha Rao/ }).click()
  await expect.poll(() => saleLookupValue).toBe('+919870000002')
  await expect(authenticatedPage.getByRole('status')).toHaveText('Looking up sales history for Asha Rao…')
  releaseSalesLookup()
  await expect(authenticatedPage.getByText(/No matching sale found/i)).toBeVisible()
})
