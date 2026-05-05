const THEME_STORAGE_KEY = 'theme'
const THEME_EVENT = 'theme-mode-changed'

export function getThemeMode() {
  try {
    const saved = String(localStorage.getItem(THEME_STORAGE_KEY) || '').trim().toLowerCase()
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  } catch {}
  return 'dark'
}

export function applyThemeMode(mode) {
  const next = mode === 'light' ? 'light' : 'dark'
  try {
    document.documentElement.setAttribute('data-theme', next)
  } catch {}
  return next
}

export function setThemeMode(mode) {
  const next = applyThemeMode(mode)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: next } }))
  } catch {}
  return next
}

export function syncThemeMode() {
  return applyThemeMode(getThemeMode())
}

export function subscribeThemeMode(listener) {
  if (typeof window === 'undefined') return () => {}
  const handler = (event) => {
    try {
      listener(String(event?.detail?.theme || getThemeMode()).trim().toLowerCase() === 'light' ? 'light' : 'dark')
    } catch {
      listener(getThemeMode())
    }
  }
  window.addEventListener(THEME_EVENT, handler)
  return () => window.removeEventListener(THEME_EVENT, handler)
}
