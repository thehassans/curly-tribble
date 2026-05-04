import { useEffect, useState } from 'react'
import { DEFAULT_BRANDING, fetchBranding, normalizeBranding } from './branding.js'

export function useBranding(initial = {}) {
  const [branding, setBranding] = useState(() => normalizeBranding({ ...DEFAULT_BRANDING, ...initial }))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await fetchBranding()
        if (!cancelled) setBranding(next)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return [branding, setBranding]
}
