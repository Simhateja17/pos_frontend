import { expect, test } from './fixtures'

const customerId = '41111111-1111-4111-8111-111111111111'
const saleId = '51111111-1111-4111-8111-111111111111'

test('creates and edits a GST customer, attaches it at checkout, and reads its persisted sale history', async ({ authenticatedPage }) => {
  let customer = {
    id: customerId,
    name: 'Asha Rao',
    billingName: 'Asha Rao',
    phone: '+919876543210',
    email: 'asha@example.test',
    gstin: '27ABCDE1234F1Z5',
    addressLine1: '12 Hill Road',
    addressLine2: null,
    city: 'Mumbai',
    stateCode: '27',
    postalCode: '400001',
    country: 'IN',
    notes: null,
    createdAt: '2026-08-11T10:00:00.000Z',
    updatedAt: '2026-08-11T10:00:00.000Z',
  }
  const purchaseHistory = [{
    id: saleId,
    documentId: null,
    documentNumber: null,
    documentType: null,
    date: '2026-08-11T11:00:00.000Z',
    store: { id: 'store-a', name: 'Bandra' },
    total: '1250.00',
    status: 'completed',
    paymentMethods: ['cash'],
  }]
  const saleDetail = {
    id: saleId,
    clientSaleId: '61111111-1111-4111-8111-111111111111',
    shiftId: null,
    customerId,
    subtotal: '1250.00',
    discountAmount: '0.00',
    taxAmount: '0.00',
    totalAmount: '1250.00',
    cashReceived: '1250.00',
    changeDue: '0.00',
    status: 'completed',
    createdBy: null,
    createdAt: '2026-08-11T11:00:00.000Z',
    lines: [],
    payments: [{ id: '71111111-1111-4111-8111-111111111111', saleId, method: 'cash' as const, direction: 'payment' as const, amount: '1250.00', referenceCode: null, createdBy: null, createdAt: '2026-08-11T11:00:00.000Z' }],
  }

  await authenticatedPage.route('**/customers/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/purchases')) {
      await route.fulfill({ json: { items: purchaseHistory, total: purchaseHistory.length, nextCursor: null } })
      return
    }

    if (request.method() === 'PATCH') {
      const body = JSON.parse(request.postData() ?? '{}') as { city?: string }
      customer = { ...customer, city: body.city ?? customer.city, updatedAt: '2026-08-11T12:00:00.000Z' }
      await route.fulfill({ json: customer })
      return
    }

    await route.fulfill({ json: customer })
  })
  await authenticatedPage.route('**/customers', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      customer = { ...customer, ...JSON.parse(request.postData() ?? '{}') }
      await route.fulfill({ status: 201, json: customer })
      return
    }
    if (request.method() === 'GET') {
      await route.fulfill({ json: [{ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, createdAt: customer.createdAt }] })
      return
    }
    await route.continue()
  })
  await authenticatedPage.route('**/customers/records*', async (route) => {
    await route.fulfill({ json: { items: [customer], total: 1, nextCursor: null } })
  })
  await authenticatedPage.route('**/shifts*', (route) => route.fulfill({ json: [] }))
  await authenticatedPage.route('**/terminals/device*', (route) => route.fulfill({ json: { terminal: null } }))
  await authenticatedPage.route(`**/sales/${saleId}`, (route) => route.fulfill({ json: saleDetail }))

  await authenticatedPage.goto('/app/customers')
  await authenticatedPage.getByRole('button', { name: 'New customer' }).click()
  await authenticatedPage.getByLabel('Billing name').fill('Asha Rao')
  await authenticatedPage.getByLabel('Phone').fill('09876543210')
  await authenticatedPage.getByLabel('Email').fill('asha@example.test')
  await authenticatedPage.getByLabel('GSTIN (optional)').fill('27ABCDE1234F1Z5')
  await authenticatedPage.getByLabel('City').fill('Mumbai')
  await authenticatedPage.getByLabel('State code').selectOption('27')
  await authenticatedPage.getByLabel('PIN code').fill('400001')
  await authenticatedPage.getByRole('button', { name: 'Create customer' }).click()
  await expect(authenticatedPage.getByRole('link', { name: 'View profile' })).toBeVisible()

  await authenticatedPage.getByRole('link', { name: 'View profile' }).click()
  await expect(authenticatedPage.getByText('27ABCDE1234F1Z5')).toBeVisible()
  await authenticatedPage.getByRole('button', { name: 'Edit profile' }).click()
  await authenticatedPage.getByLabel('City').fill('Pune')
  await authenticatedPage.getByRole('button', { name: 'Save changes' }).click()
  await expect(authenticatedPage.getByText('Pune')).toBeVisible()

  await authenticatedPage.goto(`/app/billing?customerId=${customerId}`)
  await expect(authenticatedPage.getByText('Returning customer')).toBeVisible()

  await authenticatedPage.goto(`/app/customers/${customerId}`)
  await expect(authenticatedPage.getByText(`Sale ${saleId.slice(0, 8).toUpperCase()}`)).toBeVisible()
  await expect(authenticatedPage.getByText('₹1,250.00')).toBeVisible()
  const openBill = authenticatedPage.getByRole('link', { name: 'Open bill' })
  await expect(openBill).toHaveAttribute('href', `/app/orders/${saleId}`)
  await openBill.click()
  await expect(authenticatedPage).toHaveURL(`/app/orders/${saleId}`)
  await expect(authenticatedPage.getByRole('heading', { name: 'Bill 51111111' })).toBeVisible()
})
