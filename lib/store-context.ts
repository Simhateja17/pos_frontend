const ACTIVE_STORE_KEY = 'ambel.activeStore.v1'

export const ACTIVE_STORE_CHANGED_EVENT = 'ambel:active-store-changed'

export function getActiveStoreId(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ACTIVE_STORE_KEY)
}

export function setActiveStoreId(storeId: string | null): void {
  if (typeof window === 'undefined') return
  if (storeId) window.sessionStorage.setItem(ACTIVE_STORE_KEY, storeId)
  else window.sessionStorage.removeItem(ACTIVE_STORE_KEY)
  window.dispatchEvent(new CustomEvent(ACTIVE_STORE_CHANGED_EVENT, { detail: storeId }))
}
