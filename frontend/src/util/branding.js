// Runtime helpers to apply branding (favicon, title, app name, manifest) to <head>
// Works both when the app is served by the backend and during Vite dev.
import { API_BASE, apiGet } from '../api.js'

export const DEFAULT_BRANDING = Object.freeze({
  headerLogo: null,
  loginLogo: null,
  favicon: null,
  title: 'Magnetic E-commerce',
  appName: 'Magnetic',
  companyName: 'Magnetic E-commerce',
  portalName: 'Magnetic E-commerce Management',
  storeName: 'Magnetic Store',
  staffLoginSubtitle: 'Sign in to your Magnetic E-commerce workspace',
  shopLoginSubtitle: 'Access the Magnetic E-commerce shop operations console',
  footerText: 'Powered by Magnetic E-commerce',
  reportSignature: 'Magnetic E-commerce',
  reportFooterText: 'All Rights Reserved',
  websiteUrl: 'https://magnetic-ecommerce.example'
})

function normalizeText(value, fallback){
  if (typeof value !== 'string') return fallback
  const next = value.trim()
  return next || fallback
}

function normalizeAsset(value){
  if (typeof value !== 'string') return null
  const next = value.trim()
  return next || null
}

export function normalizeBranding(value = {}){
  const source = value && typeof value === 'object' ? value : {}
  return {
    headerLogo: normalizeAsset(source.headerLogo),
    loginLogo: normalizeAsset(source.loginLogo),
    favicon: normalizeAsset(source.favicon),
    title: normalizeText(source.title, DEFAULT_BRANDING.title),
    appName: normalizeText(source.appName, DEFAULT_BRANDING.appName),
    companyName: normalizeText(source.companyName, DEFAULT_BRANDING.companyName),
    portalName: normalizeText(source.portalName, DEFAULT_BRANDING.portalName),
    storeName: normalizeText(source.storeName, DEFAULT_BRANDING.storeName),
    staffLoginSubtitle: normalizeText(source.staffLoginSubtitle, DEFAULT_BRANDING.staffLoginSubtitle),
    shopLoginSubtitle: normalizeText(source.shopLoginSubtitle, DEFAULT_BRANDING.shopLoginSubtitle),
    footerText: normalizeText(source.footerText, DEFAULT_BRANDING.footerText),
    reportSignature: normalizeText(source.reportSignature, DEFAULT_BRANDING.reportSignature),
    reportFooterText: normalizeText(source.reportFooterText, DEFAULT_BRANDING.reportFooterText),
    websiteUrl: normalizeText(source.websiteUrl, DEFAULT_BRANDING.websiteUrl),
  }
}

export function resolveBrandAsset(src, fallback = `${import.meta.env.BASE_URL}magnetic-logo.svg`){
  if (!src || typeof src !== 'string') return fallback
  if (/^(https?:|data:|blob:)/i.test(src)) return src
  return `${API_BASE || ''}${src}`
}

export async function fetchBranding(){
  const j = await apiGet('/api/settings/branding')
  return normalizeBranding(j)
}

function setOrCreateLink(rel, attrs = {}){
  let el = document.querySelector(`head link[rel="${rel}"]`)
  if (!el){ el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el) }
  for (const [k,v] of Object.entries(attrs)){
    if (v == null) { el.removeAttribute(k) } else { el.setAttribute(k, String(v)) }
  }
  return el
}

function guessMimeFromHref(href){
  try{
    const u = String(href).split('?')[0].toLowerCase()
    if (u.endsWith('.svg')) return 'image/svg+xml'
    if (u.endsWith('.png')) return 'image/png'
    if (u.endsWith('.ico')) return 'image/x-icon'
    if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'image/jpeg'
    return null
  }catch{ return null }
}

export function applyBrandingToHead({ title, appName, favicon } = {}){
  try{
    if (title && typeof title === 'string'){
      const next = title.trim()
      const cur = String(document.title || '').trim()
      const shouldSet = !cur || next.length >= cur.length || (cur.length < 25 && next.length >= 25)
      if (next && shouldSet) document.title = next
    }
    const base = String(API_BASE || '').trim()
    let sameOrigin = !base || base.startsWith('/')
    if (!sameOrigin && /^https?:\/\//i.test(base)) {
      try {
        sameOrigin = new URL(base).origin === location.origin
      } catch {
        sameOrigin = false
      }
    }
    // Favicon (also reuse for apple-touch-icon)
    if (favicon && typeof favicon === 'string'){
      const isAbs = /^(https?:|data:|blob:)/i.test(favicon)
      const baseHref = isAbs ? favicon : `${API_BASE || ''}${favicon}`
      const bust = (baseHref.includes('blob:') || baseHref.includes('data:')) ? baseHref : `${baseHref}${baseHref.includes('?') ? '&' : '?'}v=${Date.now()}`
      const mime = guessMimeFromHref(baseHref)
      setOrCreateLink('icon', { href: bust, type: mime || null })
      setOrCreateLink('shortcut icon', { href: bust, type: mime || null })
      setOrCreateLink('apple-touch-icon', { href: bust })
    }
    // Manifest: prefer dynamic manifest when same-origin
    if (sameOrigin){
      setOrCreateLink('manifest', { href: '/api/settings/manifest' })
    }
  }catch{}
}

export async function bootstrapBranding(){
  try{
    const j = await fetchBranding()
    applyBrandingToHead({ title: j.title || null, appName: j.appName || null, favicon: j.favicon || null })
  }catch{}
}
