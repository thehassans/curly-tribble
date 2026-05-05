import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiUploadPatch, clearApiCache } from '../../api.js'
import { DEFAULT_BRANDING, normalizeBranding, resolveBrandAsset, applyBrandingToHead } from '../../util/branding.js'
import { ThemeModeSelector } from '../../components/ui/theme-toggle-buttons.jsx'
import { getThemeMode, setThemeMode, subscribeThemeMode } from '../../util/themeMode.js'

const BRANDING_FIELDS = [
  { key: 'title', label: 'Workspace Title', placeholder: 'Magnetic E-Commerce' },
  { key: 'appName', label: 'Short Brand Name', placeholder: 'Magnetic' },
  { key: 'companyName', label: 'Company Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'portalName', label: 'Portal Name', placeholder: 'Magnetic E-Commerce Admin' },
  { key: 'storeName', label: 'Storefront Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://commerce.magnetic-ict.com' },
  { key: 'staffLoginSubtitle', label: 'Staff Login Subtitle', placeholder: 'Sign in to your workspace' },
  { key: 'footerText', label: 'Footer Text', placeholder: 'Powered by Magnetic E-Commerce' },
]

function UploadField({ label, preview, accept, file, onChange }) {
  return (
    <div className="theme-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{file ? file.name : 'Upload a file to replace the current asset.'}</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 16, border: '1px solid var(--border)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <img src={preview} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      </div>
      <label className="btn secondary" style={{ position: 'relative', justifyContent: 'center' }}>
        Choose File
        <input
          type="file"
          accept={accept}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  )
}

function SectionCard({ title, subtitle, children, tone = 'rgba(99, 102, 241, 0.05)' }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border)', background: `linear-gradient(135deg, ${tone}, rgba(255,255,255,0.02))` }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>{subtitle}</p>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )
}

export default function BusinessSettings() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [branding, setBranding] = useState(() => normalizeBranding(DEFAULT_BRANDING))

  const [headerFile, setHeaderFile] = useState(null)
  const [loginFile, setLoginFile] = useState(null)
  const [darkFile, setDarkFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [themeMode, setThemeModeState] = useState(() => getThemeMode())

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { user } = await apiGet('/api/users/me', { skipCache: true })
        if (!alive || !user) return
        setCurrentUser(user)
        setFirstName(user.firstName || '')
        setLastName(user.lastName || '')
        setEmail(user.email || '')
        setPhone(user.phone || '')
        setBusinessName(user.businessName || '')
        setCustomDomain(user.customDomain || '')
        setBranding(normalizeBranding({ ...DEFAULT_BRANDING, ...(user.workspaceBranding || {}) }))
      } catch (err) {
        if (!alive) return
        setError(err?.message || 'Failed to load business settings')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    const unsubscribe = subscribeThemeMode((next) => setThemeModeState(next))
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const headerPreview = headerFile ? URL.createObjectURL(headerFile) : resolveBrandAsset(branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const loginPreview = loginFile ? URL.createObjectURL(loginFile) : resolveBrandAsset(branding.loginLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const darkPreview = darkFile ? URL.createObjectURL(darkFile) : resolveBrandAsset(branding.darkLogo || branding.headerLogo || branding.loginLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const faviconPreview = faviconFile ? URL.createObjectURL(faviconFile) : resolveBrandAsset(branding.favicon, `${import.meta.env.BASE_URL}magneticcommerce-favicon.png`)

  useEffect(() => {
    return () => {
      try { if (headerFile) URL.revokeObjectURL(headerPreview) } catch {}
      try { if (loginFile) URL.revokeObjectURL(loginPreview) } catch {}
      try { if (darkFile) URL.revokeObjectURL(darkPreview) } catch {}
      try { if (faviconFile) URL.revokeObjectURL(faviconPreview) } catch {}
    }
  }, [headerFile, loginFile, darkFile, faviconFile, headerPreview, loginPreview, darkPreview, faviconPreview])

  const brandSummary = useMemo(() => {
    return branding.companyName || businessName || `${firstName} ${lastName}`.trim() || DEFAULT_BRANDING.companyName
  }, [branding.companyName, businessName, firstName, lastName])

  function syncStoredUser(user) {
    try {
      const me = JSON.parse(localStorage.getItem('me') || '{}')
      localStorage.setItem('me', JSON.stringify({ ...me, ...user }))
    } catch {}
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setMessage('')
    setError('')
    try {
      await apiPost('/api/user/update-profile', { firstName, lastName, phone })
      const nextUser = { ...(currentUser || {}), firstName, lastName, phone }
      setCurrentUser(nextUser)
      syncStoredUser(nextUser)
      setMessage('Personal details updated')
    } catch (err) {
      setError(err?.message || 'Failed to update personal details')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveBusiness(e) {
    e.preventDefault()
    if (!currentUser?._id) return
    setSavingBusiness(true)
    setMessage('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('businessName', businessName)
      formData.append('customDomain', customDomain)
      if (headerFile) formData.append('header', headerFile)
      if (loginFile) formData.append('login', loginFile)
      if (darkFile) formData.append('dark', darkFile)
      if (faviconFile) formData.append('favicon', faviconFile)
      for (const field of BRANDING_FIELDS) formData.append(field.key, branding[field.key] || '')
      const res = await apiUploadPatch(`/api/users/${currentUser._id}/workspace`, formData)
      const nextUser = res?.user || currentUser
      const nextBranding = normalizeBranding({ ...DEFAULT_BRANDING, ...(nextUser.workspaceBranding || {}) })
      setCurrentUser(nextUser)
      setBusinessName(nextUser.businessName || '')
      setCustomDomain(nextUser.customDomain || '')
      setBranding(nextBranding)
      setHeaderFile(null)
      setLoginFile(null)
      setDarkFile(null)
      setFaviconFile(null)
      syncStoredUser(nextUser)
      clearApiCache('/api/users')
      clearApiCache('/api/settings/branding')
      applyBrandingToHead({ title: nextBranding.title, favicon: nextBranding.favicon })
      setMessage('Business settings updated')
    } catch (err) {
      setError(err?.message || 'Failed to update business settings')
    } finally {
      setSavingBusiness(false)
    }
  }

  function handleThemeChange(next) {
    const applied = setThemeMode(next)
    setThemeModeState(applied)
    setMessage(`Appearance updated to ${applied} mode`)
    setError('')
  }

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading settings...</div>
  }

  return (
    <div className="section" style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Business Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 0' }}>
            Manage your workspace identity, branding assets, custom domain, and panel appearance.
          </p>
        </div>
        <div className="theme-card" style={{ padding: '12px 16px', display: 'grid', gap: 4, minWidth: 220 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Current workspace</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{brandSummary}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{customDomain || email || 'No custom domain set yet'}</div>
        </div>
      </div>

      {message ? <div style={{ padding: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, color: '#059669', fontWeight: 600 }}>{message}</div> : null}
      {error ? <div style={{ padding: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, color: '#dc2626', fontWeight: 600 }}>{error}</div> : null}

      <SectionCard title="Personal Information" subtitle="Update your account name and contact number." tone="rgba(99, 102, 241, 0.05)">
        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <div className="label">First Name</div>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <div className="label">Last Name</div>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div>
            <div className="label">Email Address</div>
            <input className="input" value={email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <div>
            <div className="label">Phone Number</div>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Personal Details'}</button>
            <button type="button" className="btn secondary" onClick={() => navigate('/user/change-password')}>Change Password</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Business Settings" subtitle="Change the business name, workspace title, logos, dark-mode logo, favicon, and custom domain that represent your brand." tone="rgba(245, 158, 11, 0.06)">
        <form onSubmit={handleSaveBusiness} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <div className="label">Business Name</div>
              <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Magnetic E-Commerce" />
            </div>
            <div>
              <div className="label">Custom Domain</div>
              <input className="input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="store.yourbrand.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <UploadField label="Header Logo" preview={headerPreview} accept="image/*" file={headerFile} onChange={setHeaderFile} />
            <UploadField label="Login Logo" preview={loginPreview} accept="image/*" file={loginFile} onChange={setLoginFile} />
            <UploadField label="Dark Mode Logo" preview={darkPreview} accept="image/*" file={darkFile} onChange={setDarkFile} />
            <UploadField label="Favicon" preview={faviconPreview} accept="image/png,image/svg+xml,image/x-icon,.ico" file={faviconFile} onChange={setFaviconFile} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            {BRANDING_FIELDS.map((field) => (
              <div key={field.key}>
                <div className="label">{field.label}</div>
                <input
                  className="input"
                  value={branding[field.key] || ''}
                  onChange={(e) => setBranding((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.18)', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: 'var(--fg)', marginBottom: 6 }}>Domain setup</div>
            <div>Point your domain DNS to `commerce.magnetic-ict.com` using a CNAME record, then save the exact hostname here.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>These settings update your storefront title, light and dark branding assets, login branding, and favicon.</div>
            <button type="submit" className="btn" disabled={savingBusiness}>{savingBusiness ? 'Saving...' : 'Save Business Settings'}</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Appearance" subtitle="Choose light or dark mode. Your selected mode will be applied across all panels." tone="rgba(16, 185, 129, 0.05)">
        <div style={{ display: 'grid', gap: 18 }}>
          <ThemeModeSelector value={themeMode} onChange={handleThemeChange} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Current mode: <strong style={{ color: 'var(--fg)' }}>{themeMode === 'light' ? 'Light' : 'Dark'}</strong></div>
            <button type="button" className="btn secondary" onClick={() => handleThemeChange(themeMode === 'light' ? 'dark' : 'light')}>
              Switch to {themeMode === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
