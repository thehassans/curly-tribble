import { useEffect, useState } from 'react'
import { DEFAULT_BRANDING, fetchBranding, normalizeBranding } from './branding.js'

export function useBranding(initial = {}, options = {}) {
  const [branding, setBranding] = useState(() => normalizeBranding({ ...DEFAULT_BRANDING, ...initial }))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await fetchBranding(options)
        if (!cancelled) setBranding(next)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [options?.ownerId])

  return [branding, setBranding]
}
