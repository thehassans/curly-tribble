import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import { apiGet, apiPost } from '../api.js'
import { useToast } from '../ui/Toast'

const PROMPT_SEEN_KEY = '__buysial_mobile_onboarding_prompt_seen_v3__'
const PROFILE_KEY = '__buysial_mobile_delivery_profile__'

function isNativeApp() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') || {}
  } catch {
    return {}
  }
}

export function readMobileDeliveryProfile() {
  return readProfile()
}

export default function MobileDeliveryProfilePrompt() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return undefined

    let shouldOpen = false
    try {
      shouldOpen = !localStorage.getItem('token') && localStorage.getItem(PROMPT_SEEN_KEY) !== '1'
    } catch {
      shouldOpen = false
    }
    if (!shouldOpen) return undefined

    const timer = window.setTimeout(() => setOpen(true), 1850)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiGet('/api/settings/google-oauth')
        if (!cancelled) setGoogleClientId(String(res?.clientId || '').trim())
      } catch {}
    })()

    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open || !googleClientId) return undefined
    if (window.google?.accounts?.id) {
      setGoogleReady(true)
      return undefined
    }

    const existing = document.getElementById('buysial-mobile-google-gsi')
    if (existing) {
      const timer = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          setGoogleReady(true)
          window.clearInterval(timer)
        }
      }, 120)
      return () => window.clearInterval(timer)
    }

    const script = document.createElement('script')
    script.id = 'buysial-mobile-google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setGoogleReady(true)
    document.head.appendChild(script)

    return undefined
  }, [open, googleClientId])

  const closePrompt = useCallback((markSeen = true) => {
    if (markSeen) {
      try { localStorage.setItem(PROMPT_SEEN_KEY, '1') } catch {}
    }
    setOpen(false)
  }, [])

  const handleSkip = useCallback(() => {
    try {
      const existing = readProfile()
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        ...existing,
        skipped: true,
        updatedAt: new Date().toISOString(),
      }))
    } catch {}
    closePrompt(true)
  }, [closePrompt])

  const handleSignup = useCallback(() => {
    closePrompt(true)
    window.location.href = '/register'
  }, [closePrompt])

  const handleGoogleLogin = useCallback(async (response) => {
    if (!response?.credential) {
      toast.error('Google sign-in failed')
      return
    }

    setGoogleLoading(true)
    try {
      const data = await apiPost('/api/auth/google', {
        credential: response.credential,
        clientId: googleClientId
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('me', JSON.stringify(data.user))
      closePrompt(true)
      window.location.href = '/customer'
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }, [closePrompt, googleClientId, toast])

  useEffect(() => {
    if (!open || !googleClientId || !googleReady || !window.google?.accounts?.id) return undefined
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
    } catch {}
    return undefined
  }, [open, googleClientId, googleReady, handleGoogleLogin])

  const handleGoogleContinue = useCallback(() => {
    if (!googleClientId || !window.google?.accounts?.id) {
      toast.error('Google sign-in is not ready yet')
      return
    }
    try {
      window.google.accounts.id.prompt()
    } catch {
      toast.error('Google sign-in is not ready yet')
    }
  }, [googleClientId, toast])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="mobile-delivery-prompt-backdrop">
        <div className="mobile-delivery-prompt-card" role="dialog" aria-modal="true" aria-labelledby="mobile-delivery-prompt-title">
          <div className="mobile-delivery-prompt-topline">
            <img src={`${import.meta.env.BASE_URL}mobile-app-icon.png`} alt="BuySial" className="mobile-delivery-prompt-logo" />
            <span>Buysial</span>
          </div>

          <h2 id="mobile-delivery-prompt-title">Welcome to Buysial</h2>
          <p>Sign up to shop faster, save your profile, and continue seamlessly.</p>

          <div className="mobile-delivery-prompt-actions stacked">
            <button type="button" className="mobile-delivery-save" onClick={handleSignup}>Sign up</button>
            <button type="button" className="mobile-delivery-google" onClick={handleGoogleContinue} disabled={googleLoading || !googleClientId || !googleReady}>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          <button type="button" className="mobile-delivery-skip-link" onClick={handleSkip}>Skip for now</button>
        </div>
      </div>

      <style>{`
        .mobile-delivery-prompt-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .mobile-delivery-prompt-card {
          width: min(100%, 332px);
          border-radius: 24px;
          padding: 20px 18px 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 24px 80px rgba(15,23,42,0.12);
        }

        .mobile-delivery-prompt-topline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mobile-delivery-prompt-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .mobile-delivery-prompt-card h2 {
          margin: 14px 0 6px;
          color: #0f172a;
          font-size: 21px;
          line-height: 1.08;
          letter-spacing: -0.04em;
          font-weight: 700;
        }

        .mobile-delivery-prompt-card p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.55;
          font-weight: 500;
        }

        .mobile-delivery-prompt-actions.stacked {
          display: grid;
          gap: 8px;
          margin-top: 18px;
        }

        .mobile-delivery-save,
        .mobile-delivery-google {
          height: 42px;
          border-radius: 14px;
          border: none;
          font-size: 12px;
          font-weight: 700;
        }

        .mobile-delivery-save {
          background: #0f172a;
          color: #ffffff;
        }

        .mobile-delivery-google {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid rgba(148,163,184,0.18);
        }

        .mobile-delivery-save:disabled,
        .mobile-delivery-google:disabled {
          opacity: 0.5;
        }

        .mobile-delivery-skip-link {
          margin-top: 10px;
          width: 100%;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        @media (max-width: 480px) {
          .mobile-delivery-prompt-card {
            width: min(100%, 312px);
            padding: 18px 16px 14px;
          }

          .mobile-delivery-prompt-card h2 {
            font-size: 20px;
          }
        }
      `}</style>
    </>,
    document.body
  )
}
