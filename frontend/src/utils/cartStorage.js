export const CART_STORAGE_KEY = 'shopping_cart'
export const CART_STORAGE_BACKUP_KEY = 'shopping_cart_bak'

export function normalizeCartArray(items) {
  return Array.isArray(items) ? items.filter(Boolean) : []
}

export function readCartItems() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {}

  try {
    const backup = sessionStorage.getItem(CART_STORAGE_BACKUP_KEY)
    const parsed = backup ? JSON.parse(backup) : []
    if (Array.isArray(parsed)) return parsed
  } catch {}

  return []
}

export function writeCartItems(items, { dispatchEvent = true } = {}) {
  const next = normalizeCartArray(items)
  const payload = JSON.stringify(next)

  try { localStorage.setItem(CART_STORAGE_KEY, payload) } catch {}
  try { sessionStorage.setItem(CART_STORAGE_BACKUP_KEY, payload) } catch {}

  if (dispatchEvent) {
    try { window.dispatchEvent(new CustomEvent('cartUpdated')) } catch {}
  }

  return next
}

export function clearCartItems(options) {
  return writeCartItems([], options)
}
