import { expect, test } from './fixtures'

const HAS_DISPOSABLE_SESSION =
  process.env.E2E_NON_PRODUCTION === 'true' &&
  Boolean(process.env.E2E_SUPABASE_URL) &&
  Boolean(process.env.E2E_SUPABASE_ANON_KEY) &&
  Boolean(process.env.E2E_SUPABASE_EMAIL) &&
  Boolean(process.env.E2E_SUPABASE_PASSWORD)

const saleId = '11111111-1111-4111-8111-111111111111'
const invoiceId = '21111111-1111-4111-8111-111111111111'
const creditNoteId = '31111111-1111-4111-8111-111111111111'
const lineId = '41111111-1111-4111-8111-111111111111'
const variantId = '51111111-1111-4111-8111-111111111111'

const seller = {
  legalName: 'Ambel Retail Private Limited',
  tradeName: 'Ambel Retail',
  gstin: '27ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  addressLine1: '1 Market Road',
  addressLine2: null,
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  postalCode: '400001',
  country: 'IN',
  phone: null,
  email: null,
}

const invoice = {
  id: invoiceId,
  documentType: 'tax_invoice' as const,
  financialYear: '2026-27',
  sequenceNumber: '1',
  documentNumber: 'AMB/26-27/000001',
  documentDate: '2026-08-11T10:00:00.000Z',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  storeId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  saleId,
  customerId: null,
  returnReferenceId: null,
  originalDocumentId: null,
  originalDocumentNumber: null,
  seller,
  buyer: null,
  placeOfSupply: { state: 'Maharashtra', stateCode: '27', isInterState: false },
  payments: [{ method: 'upi', direction: 'payment' as const, amount: '236.00', referenceCode: 'UPI-123' }],
  subtotal: '200.00',
  discountTotal: '0.00',
  taxableTotal: '200.00',
  cgstTotal: '18.00',
  sgstTotal: '18.00',
  igstTotal: '0.00',
  cessTotal: '0.00',
  roundingAmount: '0.00',
  grandTotal: '236.00',
  lines: [{
    saleLineItemId: lineId,
    originalLineId: null,
    variantId,
    description: 'Cotton Kurta',
    sku: 'KURTA-01',
    hsnSac: '6203',
    unit: 'PCS',
    quantity: '2',
    unitPrice: '100.00',
    grossValue: '200.00',
    discountValue: '0.00',
    taxableValue: '200.00',
    gstRate: '18',
    cgstAmount: '18.00',
    sgstAmount: '18.00',
    igstAmount: '0.00',
    cessAmount: '0.00',
    lineTotal: '236.00',
  }],
  createdAt: '2026-08-11T10:00:00.000Z',
}

const creditNote = {
  ...invoice,
  id: creditNoteId,
  documentType: 'credit_note' as const,
  sequenceNumber: '1',
  documentNumber: 'CN/26-27/000001',
  documentDate: '2026-08-12T10:00:00.000Z',
  returnReferenceId: '61111111-1111-4111-8111-111111111111',
  originalDocumentId: invoiceId,
  originalDocumentNumber: invoice.documentNumber,
  payments: [{ method: 'upi', direction: 'refund' as const, amount: '118.00', referenceCode: 'UPI-REFUND' }],
  subtotal: '100.00',
  taxableTotal: '100.00',
  cgstTotal: '9.00',
  sgstTotal: '9.00',
  grandTotal: '118.00',
  lines: [{ ...invoice.lines[0], originalLineId: lineId, quantity: '1', grossValue: '100.00', taxableValue: '100.00', cgstAmount: '9.00', sgstAmount: '9.00', lineTotal: '118.00' }],
}

const sale = {
  id: saleId,
  customerId: null,
  totalAmount: '236.00',
  createdAt: invoice.documentDate,
  lines: [{ id: lineId, variantId, quantity: 2, unitPrice: '100.00', lineTotal: '200.00' }],
  payments: [{ method: 'upi' as const, direction: 'payment' as const, amount: '236.00', referenceCode: 'UPI-123' }],
}

test.describe('GST tax documents', () => {
  test.skip(!HAS_DISPOSABLE_SESSION, 'Requires a disposable non-production authenticated session.')

  test('completed sale → invoice → partial return → credit note leaves the original invoice unchanged', async ({ authenticatedPage }) => {
    await authenticatedPage.route(`**/tax-documents/invoices/sale/${saleId}`, (route) => route.fulfill({ json: invoice }))
    await authenticatedPage.route(`**/tax-documents/${invoiceId}`, (route) => route.fulfill({ json: invoice }))
    await authenticatedPage.route(`**/tax-documents/invoices/${invoiceId}/credit-notes`, (route) => route.fulfill({
      json: [{ ...creditNote, lines: undefined }],
    }))

    // The completed-sale receipt links to this route. The invoice is resolved
    // lazily, exactly as the production API does for older completed sales.
    await authenticatedPage.goto(`/app/documents?saleId=${saleId}`)
    await expect(authenticatedPage.getByText('AMB/26-27/000001')).toBeVisible()
    await expect(authenticatedPage.getByText('₹236.00').first()).toBeVisible()
    await expect(authenticatedPage.getByText('UPI ₹236.00 · UPI-123')).toBeVisible()

    await authenticatedPage.route(`**/sales?receiptNumber=*`, (route) => route.fulfill({ json: [sale] }))
    await authenticatedPage.route(`**/returns`, async (route) => {
      const body = route.request().postDataJSON()
      expect(body.returnReferenceId).toMatch(/^[0-9a-f-]{36}$/i)
      expect(body.refundPayments).toEqual([{ method: 'upi', amount: '118.00', referenceCode: 'UPI-123' }])
      await route.fulfill({ status: 201, json: {
        saleId,
        returnReferenceId: body.returnReferenceId,
        refundTotal: '118.00',
        creditNoteId,
        creditNoteNumber: creditNote.documentNumber,
        idempotent: false,
      } })
    })

    await authenticatedPage.goto('/checkout/returns?shiftId=71111111-1111-4111-8111-111111111111')
    await authenticatedPage.getByPlaceholder('Bill Number or Invoice Number').fill('R-100')
    await authenticatedPage.getByRole('button', { name: 'Search' }).click()
    await authenticatedPage.getByRole('checkbox').check()
    await authenticatedPage.getByRole('button', { name: 'Review refund' }).click()
    await authenticatedPage.getByRole('button', { name: 'Confirm refund request' }).click()
    await expect(authenticatedPage.getByText('Refund of ₹118.00 recorded by the server.')).toBeVisible()
    await expect(authenticatedPage.getByRole('link', { name: creditNote.documentNumber })).toBeVisible()

    // Re-read the invoice after the return: the original two-unit line and
    // original total remain unchanged; the credit note is a separate document.
    await authenticatedPage.goto(`/app/documents/${invoiceId}`)
    await expect(authenticatedPage.getByText('AMB/26-27/000001')).toBeVisible()
    await expect(authenticatedPage.getByText('2 / PCS')).toBeVisible()
    await expect(authenticatedPage.getByText('₹236.00').first()).toBeVisible()
    await expect(authenticatedPage.getByText(creditNote.documentNumber)).toBeVisible()
  })
})
