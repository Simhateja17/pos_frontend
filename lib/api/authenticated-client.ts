import type { components, paths } from './schema'
import { apiClient } from './client'
import { authHeaders } from '@/lib/api/auth-headers'

export type AppContext = components['schemas']['AppContext']
export type BillingStatus = components['schemas']['BillingStatus']
export type NotificationList = components['schemas']['NotificationList']
export type Dashboard = components['schemas']['Dashboard']
export type DashboardRange = components['schemas']['DashboardRange']
export type SaleList = components['schemas']['SaleList']
export type CustomerList = components['schemas']['CustomerList']
export type PaymentRead = components['schemas']['PaymentRead']
export type Store = components['schemas']['Store']
export type StoreList = components['schemas']['StoreList']
export type CreateStoreRequest = components['schemas']['CreateStoreRequest']
export type UpdateStoreRequest = components['schemas']['UpdateStoreRequest']
export type StockTransfer = components['schemas']['StockTransfer']
export type CreateStockTransferRequest = components['schemas']['CreateStockTransferRequest']
export type ReceiveStockTransferRequest = components['schemas']['ReceiveStockTransferRequest']
export type TransferDestination = components['schemas']['TransferDestinationList'][number]
export type Supplier = components['schemas']['Supplier']
export type CreateSupplierRequest = components['schemas']['CreateSupplierRequest']
export type UpdateSupplierRequest = components['schemas']['UpdateSupplierRequest']
export type SupplierProduct = components['schemas']['SupplierProduct']
export type SupplierProductWithVariant = components['schemas']['SupplierProductWithVariant']
export type CreateSupplierProductRequest = components['schemas']['CreateSupplierProductRequest']
export type UpdateSupplierProductRequest = components['schemas']['UpdateSupplierProductRequest']
export type ReorderSuggestion = components['schemas']['ReorderSuggestion']
export type ReorderSuggestionList = components['schemas']['ReorderSuggestionList']
export type ReorderSkipped = components['schemas']['ReorderSkipped']
export type Product = components['schemas']['Product']
export type Variant = components['schemas']['Variant']
export type PurchaseOrder = components['schemas']['PurchaseOrder']
export type PurchaseOrderStatus = components['schemas']['PurchaseOrderStatus']
export type CreatePurchaseOrderRequest = components['schemas']['CreatePurchaseOrderRequest']
export type ReceivePurchaseOrderRequest = components['schemas']['ReceivePurchaseOrderRequest']
export type ReceiptResult = components['schemas']['ReceiptResult']
export type ImportBatch = components['schemas']['ImportBatch']
export type ImportBatchList = components['schemas']['ImportBatchList']
export type ImportKind = components['schemas']['ImportKind']
export type ImportColumnMapping = components['schemas']['ImportColumnMapping']
export type ImportMappingSuggestion = components['schemas']['ImportMappingSuggestion']
export type ImportTargetField = components['schemas']['ImportTargetField']
export type UploadImportRequest = components['schemas']['UploadImportRequest']
export type CommitImportRequest = components['schemas']['CommitImportRequest']
export type ImportCommitResult = components['schemas']['ImportCommitResult']
export type ReportTable = components['schemas']['ReportTable']
export type ReportKind = components['schemas']['ReportKind']
export type ReportCatalog = components['schemas']['ReportCatalog']
export type ReportQuery = NonNullable<paths['/reports']['get']['parameters']['query']>
export type EmailLog = components['schemas']['EmailLog']
export type EmailLogEntry = components['schemas']['EmailLogEntry']
export type EmailSuppressionList = components['schemas']['EmailSuppressionList']
export type CreateEmailSuppressionRequest = components['schemas']['CreateEmailSuppressionRequest']
export type SaleRecordQuery = NonNullable<paths['/sales/records']['get']['parameters']['query']>
export type CustomerRecordQuery = NonNullable<paths['/customers/records']['get']['parameters']['query']>
export type PaymentRecordQuery = NonNullable<paths['/sales/payments']['get']['parameters']['query']>

/**
 * Keep the shell tolerant during a rolling deploy. Older backends return the
 * notifications array but predate the owner dailyDigest field; normalizing at
 * the API boundary prevents a missing optional field from crashing every app
 * page that renders the notification bell.
 */
function normalizeNotificationList(data: NotificationList): NotificationList {
  const payload = data as NotificationList & {
    notifications?: unknown
    dailyDigest?: unknown
  }
  return {
    ...data,
    notifications: Array.isArray(payload.notifications) ? payload.notifications as NotificationList['notifications'] : [],
    dailyDigest: Array.isArray(payload.dailyDigest) ? payload.dailyDigest as NotificationList['dailyDigest'] : [],
  }
}

export class AuthenticatedRequestError extends Error {
  constructor(
    public readonly kind: 'unauthenticated' | 'forbidden' | 'network' | 'unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'AuthenticatedRequestError'
  }
}

async function authorizationHeader() {
  const headers = await authHeaders()
  if (!headers) {
    throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
  }
  return headers
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error.error
  }
  return fallback
}

export async function getAuthenticatedNotifications(): Promise<NotificationList> {
  try {
    const { data, error, response } = await apiClient.GET('/notifications', {
      headers: await authorizationHeader(),
    })

    if (response.status === 401) {
      throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    }

    if (error || !data) {
      throw new AuthenticatedRequestError('unavailable', 'Notifications are unavailable right now. Please retry.')
    }

    return normalizeNotificationList(data)
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error

    throw new AuthenticatedRequestError(
      'network',
      'We could not reach notifications. Check your connection and retry.',
    )
  }
}

/** Marks every currently-unread notification read. Fails silently — a failed mark-read must not block viewing the list. */
export async function markAuthenticatedNotificationsRead(): Promise<void> {
  try {
    await apiClient.POST('/notifications/read', { headers: await authorizationHeader() })
  } catch {
    // best-effort only
  }
}

export async function getAuthenticatedAppContext(): Promise<AppContext> {
  try {
    const { data, error, response } = await apiClient.GET('/context', {
      headers: await authorizationHeader(),
    })

    if (response.status === 401) {
      throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    }

    if (response.status === 403) {
      throw new AuthenticatedRequestError('forbidden', 'Your account cannot access this store context.')
    }

    if (error || !data) {
      throw new AuthenticatedRequestError('unavailable', 'Store context is unavailable right now. Please retry.')
    }

    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error

    throw new AuthenticatedRequestError(
      'network',
      'We could not reach the store context. Check your connection and retry.',
    )
  }
}

export async function getAuthenticatedBillingStatus(): Promise<BillingStatus> {
  try {
    const { data, error, response } = await apiClient.GET('/billing/status', {
      headers: await authorizationHeader(),
    })
    if (response.status === 401) throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    if (error || !data) throw new AuthenticatedRequestError('unavailable', 'Subscription status is unavailable right now. Please retry.')
    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error
    throw new AuthenticatedRequestError('network', 'We could not reach subscription status. Check your connection and retry.')
  }
}

export async function getAuthenticatedDashboard(range: DashboardRange): Promise<Dashboard> {
  try {
    const { data, error, response } = await apiClient.GET('/dashboard', {
      params: { query: { range } },
      headers: await authorizationHeader(),
    })

    if (response.status === 401) {
      throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    }

    if (response.status === 403) {
      throw new AuthenticatedRequestError('forbidden', 'Your account cannot access this dashboard.')
    }

    if (error || !data) {
      throw new AuthenticatedRequestError('unavailable', 'Current store data is unavailable right now. Please retry.')
    }

    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error

    throw new AuthenticatedRequestError(
      'network',
      'We could not reach current store data. Check your connection and retry.',
    )
  }
}

async function authenticatedRead<T>(
  request: () => Promise<{ data?: T; error?: unknown; response: Response }>,
  message: string,
): Promise<T> {
  try {
    const { data, error, response } = await request()
    if (response.status === 401) throw new AuthenticatedRequestError('unauthenticated', 'Your session has expired. Sign in again to continue.')
    if (response.status === 403) throw new AuthenticatedRequestError('forbidden', 'Your account cannot access these store records.')
    if (error || !data) throw new AuthenticatedRequestError('unavailable', apiErrorMessage(error, message))
    return data
  } catch (error) {
    if (error instanceof AuthenticatedRequestError) throw error
    throw new AuthenticatedRequestError('network', 'We could not reach store records. Check your connection and retry.')
  }
}

export function getAuthenticatedSales(query: SaleRecordQuery): Promise<SaleList> {
  return authenticatedRead(
    async () => apiClient.GET('/sales/records', { params: { query }, headers: await authorizationHeader() }),
    'Sales records are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedCustomers(query: CustomerRecordQuery): Promise<CustomerList> {
  return authenticatedRead(
    async () => apiClient.GET('/customers/records', { params: { query }, headers: await authorizationHeader() }),
    'Customer records are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedPayments(query: PaymentRecordQuery): Promise<PaymentRead> {
  return authenticatedRead(
    async () => apiClient.GET('/sales/payments', { params: { query }, headers: await authorizationHeader() }),
    'Payment records are unavailable right now. Please retry.',
  )
}

/**
 * The business's shops (Phase 8).
 *
 * The server decides what comes back: an owner receives every shop, a manager
 * or cashier receives only their own. The client does not filter — doing so
 * here would be a UI convenience masquerading as a permission.
 */
export function getAuthenticatedStores(): Promise<StoreList> {
  return authenticatedRead(
    async () => apiClient.GET('/stores', { headers: await authorizationHeader() }),
    'Store records are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedStore(body: CreateStoreRequest): Promise<Store> {
  return authenticatedRead(
    async () => apiClient.POST('/stores', { body, headers: await authorizationHeader() }),
    'That store could not be saved. Please retry.',
  )
}

export function updateAuthenticatedStore(storeId: string, body: UpdateStoreRequest): Promise<Store> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/stores/{storeId}', {
        params: { path: { storeId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That store could not be saved. Please retry.',
  )
}

export function getAuthenticatedTransfers(): Promise<StockTransfer[]> {
  return authenticatedRead(
    async () => apiClient.GET('/transfers', { headers: await authorizationHeader() }),
    'Stock transfers are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedTransferDestinations(): Promise<TransferDestination[]> {
  return authenticatedRead(
    async () => apiClient.GET('/transfers/destinations', { headers: await authorizationHeader() }),
    'Transfer destinations are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedTransfer(body: CreateStockTransferRequest): Promise<StockTransfer> {
  return authenticatedRead(
    async () => apiClient.POST('/transfers', { body, headers: await authorizationHeader() }),
    'That stock transfer could not be sent. Please retry.',
  )
}

export function receiveAuthenticatedTransfer(
  transferId: string,
  body: ReceiveStockTransferRequest,
): Promise<StockTransfer> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/transfers/{transferId}/receive', {
        params: { path: { transferId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That transfer receipt could not be saved. Please retry.',
  )
}

export function getAuthenticatedSuppliers(): Promise<Supplier[]> {
  return authenticatedRead(
    async () => apiClient.GET('/suppliers', { headers: await authorizationHeader() }),
    'Supplier records are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedSupplier(supplierId: string): Promise<Supplier> {
  return authenticatedRead(
    async () =>
      apiClient.GET('/suppliers/{supplierId}', { params: { path: { supplierId } }, headers: await authorizationHeader() }),
    'That supplier is unavailable right now. Please retry.',
  )
}

export function createAuthenticatedSupplier(body: CreateSupplierRequest): Promise<Supplier> {
  return authenticatedRead(
    async () => apiClient.POST('/suppliers', { body, headers: await authorizationHeader() }),
    'That supplier could not be saved. Please retry.',
  )
}

export function updateAuthenticatedSupplier(supplierId: string, body: UpdateSupplierRequest): Promise<Supplier> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/suppliers/{supplierId}', {
        params: { path: { supplierId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That supplier could not be updated. Please retry.',
  )
}

export function getAuthenticatedSupplierProductsForSupplier(supplierId: string): Promise<SupplierProductWithVariant[]> {
  return authenticatedRead(
    async () =>
      apiClient.GET('/suppliers/{supplierId}/products', {
        params: { path: { supplierId } },
        headers: await authorizationHeader(),
      }),
    'Products for this supplier are unavailable right now. Please retry.',
  )
}

export function getAuthenticatedSupplierProducts(variantId: string): Promise<SupplierProduct[]> {
  return authenticatedRead(
    async () =>
      apiClient.GET('/variants/{variantId}/supplier-products', {
        params: { path: { variantId } },
        headers: await authorizationHeader(),
      }),
    'Suppliers for this product are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedSupplierProduct(
  variantId: string,
  body: CreateSupplierProductRequest,
): Promise<SupplierProduct> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/variants/{variantId}/supplier-products', {
        params: { path: { variantId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That supplier could not be linked to this product. Please retry.',
  )
}

export function updateAuthenticatedSupplierProduct(
  variantId: string,
  supplierProductId: string,
  body: UpdateSupplierProductRequest,
): Promise<SupplierProduct> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/variants/{variantId}/supplier-products/{supplierProductId}', {
        params: { path: { variantId, supplierProductId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That supplier link could not be updated. Please retry.',
  )
}

export async function deleteAuthenticatedSupplierProduct(variantId: string, supplierProductId: string): Promise<void> {
  const headers = await authorizationHeader()
  const { error } = await apiClient.DELETE('/variants/{variantId}/supplier-products/{supplierProductId}', {
    params: { path: { variantId, supplierProductId } },
    headers,
  })
  if (error) throw new Error('That supplier link could not be removed. Please retry.')
}

export function getAuthenticatedReorderSuggestions(): Promise<ReorderSuggestionList> {
  return authenticatedRead(
    async () => apiClient.GET('/reorder/suggestions', { headers: await authorizationHeader() }),
    'Reorder suggestions are unavailable right now. Please retry.',
  )
}

export function generateAuthenticatedReorderSuggestions(): Promise<ReorderSuggestionList> {
  return authenticatedRead(
    async () => apiClient.POST('/reorder/generate', { headers: await authorizationHeader() }),
    'Reorder suggestions could not be recalculated. Please retry.',
  )
}

export function getAuthenticatedProducts(): Promise<Product[]> {
  return authenticatedRead(
    async () => apiClient.GET('/products', { headers: await authorizationHeader() }),
    'Your catalog is unavailable right now. Please retry.',
  )
}

export function getAuthenticatedPurchaseOrders(): Promise<PurchaseOrder[]> {
  return authenticatedRead(
    async () => apiClient.GET('/purchase-orders', { headers: await authorizationHeader() }),
    'Purchase orders are unavailable right now. Please retry.',
  )
}

export function createAuthenticatedPurchaseOrder(body: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
  return authenticatedRead(
    async () => apiClient.POST('/purchase-orders', { body, headers: await authorizationHeader() }),
    'That purchase order could not be created. Please retry.',
  )
}

export function updateAuthenticatedPurchaseOrder(
  poId: string,
  body: { status?: 'sent' | 'cancelled'; expectedDate?: string; notes?: string },
): Promise<PurchaseOrder> {
  return authenticatedRead(
    async () =>
      apiClient.PATCH('/purchase-orders/{poId}', {
        params: { path: { poId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That purchase order could not be updated. Please retry.',
  )
}

export function receiveAuthenticatedPurchaseOrder(
  poId: string,
  body: ReceivePurchaseOrderRequest,
): Promise<ReceiptResult> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/purchase-orders/{poId}/receive', {
        params: { path: { poId } },
        body,
        headers: await authorizationHeader(),
      }),
    'That goods receipt could not be recorded. Please retry.',
  )
}

export function uploadAuthenticatedImport(body: UploadImportRequest): Promise<ImportBatch> {
  return authenticatedRead(
    async () => apiClient.POST('/import/uploads', { body, headers: await authorizationHeader() }),
    'That file could not be read. Check it is a CSV export and retry.',
  )
}

export function getAuthenticatedImportBatches(): Promise<ImportBatchList> {
  return authenticatedRead(
    async () => apiClient.GET('/import/batches', { headers: await authorizationHeader() }),
    'Your import history is unavailable right now. Please retry.',
  )
}

export function suggestAuthenticatedImportMapping(id: string): Promise<ImportMappingSuggestion> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/import/batches/{id}/mapping-suggestion', {
        params: { path: { id } },
        headers: await authorizationHeader(),
      }),
    'A suggested mapping is unavailable right now. Map the columns yourself, or retry.',
  )
}

export function commitAuthenticatedImport(id: string, body: CommitImportRequest): Promise<ImportCommitResult> {
  return authenticatedRead(
    async () =>
      apiClient.POST('/import/batches/{id}/commit', {
        params: { path: { id } },
        body,
        headers: await authorizationHeader(),
      }),
    'That import could not be applied. Nothing was changed — please retry.',
  )
}

export function getAuthenticatedReportCatalog(): Promise<ReportCatalog> {
  return authenticatedRead(
    async () => apiClient.GET('/reports/catalog', { headers: await authorizationHeader() }),
    'The list of reports is unavailable right now. Please retry.',
  )
}

export function getAuthenticatedReport(query: ReportQuery): Promise<ReportTable> {
  return authenticatedRead(
    async () => apiClient.GET('/reports', { params: { query }, headers: await authorizationHeader() }),
    'That report could not be run. Please retry.',
  )
}

export function getAuthenticatedEmailLog(): Promise<EmailLog> {
  return authenticatedRead(
    async () => apiClient.GET('/email/log', { headers: await authorizationHeader() }),
    'The email send log is unavailable right now. Please retry.',
  )
}

export function getAuthenticatedEmailSuppressions(): Promise<EmailSuppressionList> {
  return authenticatedRead(
    async () => apiClient.GET('/email/suppressions', { headers: await authorizationHeader() }),
    'The suppression list is unavailable right now. Please retry.',
  )
}

export function createAuthenticatedEmailSuppression(body: CreateEmailSuppressionRequest): Promise<unknown> {
  return authenticatedRead(
    async () => apiClient.POST('/email/suppressions', { body, headers: await authorizationHeader() }),
    'That address could not be suppressed. Please retry.',
  )
}

export function removeAuthenticatedEmailSuppression(email: string): Promise<unknown> {
  return authenticatedRead(
    async () =>
      apiClient.DELETE('/email/suppressions', {
        params: { query: { email } },
        headers: await authorizationHeader(),
      }),
    'That address could not be allowed again. Please retry.',
  )
}
