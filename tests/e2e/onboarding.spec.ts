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

  test('a completed onboarding record does not block subscription creation', async ({ authenticatedPage: page }) => {
    const quote = {
      baseAmountMinor: 2_117_797,
      taxAmountMinor: 381_203,
      totalAmountMinor: 2_499_000,
      taxRateBps: 1_800,
      taxMode: 'included' as const,
      taxLabel: 'GST (18% included)',
    }
    const plan = {
      key: 'growth',
      region: 'IN' as const,
      currency: 'INR' as const,
      name: 'Growth',
      description: 'Test growth plan',
      popular: true,
      features: ['Test feature'],
      monthly: quote,
      annual: quote,
      monthlyAvailable: true,
      annualAvailable: true,
      providerConfigured: { monthly: true, annual: true },
    }
    const stepRequests: string[] = []

    await page.route('**/billing/plans*', (route) => route.fulfill({
      json: { mode: 'test', region: 'IN', plans: [plan] },
    }))
    await page.route('**/onboarding', (route) => route.fulfill({
      json: {
        data: {}, currentStep: 1, completed: true, completedAt: '2026-08-05T00:00:00.000Z',
        requiredSteps: [1], requiredStepsComplete: true, pendingSteps: [],
      },
    }))
    await page.route('**/onboarding/steps/1', (route) => {
      stepRequests.push(route.request().url())
      return route.fulfill({ status: 409, json: { error: 'Onboarding is already complete' } })
    })
    await page.route('**/billing/subscription', (route) => route.fulfill({
      status: 201,
      json: {
        attemptId: '00000000-0000-4000-8000-000000000001',
        razorpayKeyId: 'rzp_test_example',
        razorpaySubscriptionId: 'sub_test_example',
        status: 'created', region: 'IN', planKey: 'growth', billingCycle: 'annual', currency: 'INR', quote,
      },
    }))
    await page.route('https://checkout.razorpay.com/v1/checkout.js', (route) => route.fulfill({
      contentType: 'application/javascript',
      body: 'window.Razorpay = class { open() {} }',
    }))

    await page.goto('/plans')
    await expect(page.getByRole('button', { name: /pay .*activate/i })).toBeEnabled()
    const subscriptionRequest = page.waitForRequest('**/billing/subscription')
    await page.getByRole('button', { name: /pay .*activate/i }).click()
    await subscriptionRequest
    expect(stepRequests).toHaveLength(0)
  })

  test('US onboarding continues when the selected subscription is already active', async ({ authenticatedPage: page }) => {
    const quote = {
      baseAmountMinor: 1_188_00,
      taxAmountMinor: 0,
      totalAmountMinor: 1_188_00,
      taxRateBps: 0,
      taxMode: 'exclusive' as const,
      taxLabel: 'Tax calculated according to your tax settings',
    }
    const plan = {
      key: 'growth',
      includedStores: 1,
      region: 'INTL' as const,
      currency: 'USD' as const,
      name: 'Growth',
      description: 'Test growth plan',
      popular: true,
      features: ['ML reorder intelligence'],
      entitlements: {
        maxLocations: 3,
        maxActiveUsers: 10,
        maxActiveRegisters: 5,
        monthlyPosTransactions: 'unlimited' as const,
        monthlySalesOrders: 'unlimited' as const,
        monthlyEcommerceOrders: 'unlimited' as const,
        monthlyPurchaseOrders: 'unlimited' as const,
        monthlyBills: 'unlimited' as const,
        dailyApiCalls: 'unlimited' as const,
        integrations: 'unlimited' as const,
      },
      addons: [],
      monthly: quote,
      annual: quote,
      monthlyAvailable: true,
      annualAvailable: true,
      providerConfigured: { monthly: true, annual: true },
    }
    let subscriptionRequests = 0

    await page.route('**/billing/plans*', (route) => route.fulfill({
      json: { mode: 'test', region: 'INTL', plans: [plan] },
    }))
    await page.route('**/billing/status', (route) => route.fulfill({
      json: {
        hasSubscription: true,
        entitlement: 'active',
        accessAllowed: true,
        graceUntil: null,
        planKey: 'growth',
        region: 'INTL',
        entitlementSource: 'subscription',
        entitlementVersion: 'intl-mvp-01-v1',
        entitlements: plan.entitlements,
        usage: {
          businessMonth: '2026-08-01',
          locations: 1,
          activeUsers: 1,
          activeRegisters: 1,
          monthlyPosTransactions: 0,
        },
        subscription: {
          id: '00000000-0000-4000-8000-000000000002',
          providerSubscriptionId: 'sub_test_existing',
          planKey: 'growth',
          billingCycle: 'annual',
          currency: 'USD',
          status: 'active',
          cancelAtCycleEnd: false,
          currentEndAt: null,
          lastPaymentId: null,
          lastInvoiceId: null,
        },
      },
    }))
    await page.route('**/billing/subscription', (route) => {
      subscriptionRequests += 1
      return route.fulfill({ status: 500, json: { error: 'subscription should not be recreated' } })
    })

    await page.goto('/us/onboarding/1')
    await expect(page.getByRole('button', { name: /continue setup/i })).toBeEnabled()
    await page.getByRole('button', { name: /continue setup/i }).click()
    await expect(page).toHaveURL(/\/us\/onboarding\/complete$/)
    expect(subscriptionRequests).toBe(0)
  })
})
