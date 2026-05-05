import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiUploadPatch, clearApiCache } from '../../api.js'
import { DEFAULT_BRANDING, normalizeBranding, resolveBrandAsset } from '../../util/branding.js'

const TEXT_FIELDS = [
  { key: 'title', label: 'Workspace Title', placeholder: 'Magnetic E-Commerce' },
  { key: 'appName', label: 'Short Brand Name', placeholder: 'Magnetic' },
  { key: 'companyName', label: 'Company Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'portalName', label: 'Portal Name', placeholder: 'Magnetic E-Commerce Admin' },
  { key: 'storeName', label: 'Storefront Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'staffLoginSubtitle', label: 'Staff Login Subtitle', placeholder: 'Sign in to your workspace' },
  { key: 'footerText', label: 'Footer Text', placeholder: 'Powered by Magnetic E-Commerce' },
  { key: 'reportSignature', label: 'Report Signature', placeholder: 'Magnetic E-Commerce' },
  { key: 'reportFooterText', label: 'Report Footer Text', placeholder: 'All Rights Reserved' },
  { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://commerce.magnetic-ict.com' },
]

function UploadField({ label, preview, accept, file, onChange }) {
  return (
    <div className="theme-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{file ? file.name : 'Upload a new asset if you want to replace the current one.'}</div>
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

export default function AdminSettings() {
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [branding, setBranding] = useState(() => normalizeBranding(DEFAULT_BRANDING))
  const [headerFile, setHeaderFile] = useState(null)
  const [loginFile, setLoginFile] = useState(null)
  const [darkFile, setDarkFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const requestedOwnerId = String(searchParams.get('ownerId') || '').trim()

  async function loadUsers() {
    const { users: rows = [] } = await apiGet('/api/users?role=user', { skipCache: true })
    setUsers(rows)
    if (requestedOwnerId && rows.some((item) => item?._id === requestedOwnerId)) {
      setSelectedId(requestedOwnerId)
      return
    }
    if (!selectedId && rows[0]?._id) setSelectedId(rows[0]._id)
  }

  useEffect(() => {
    loadUsers().catch(() => {})
  }, [requestedOwnerId])

  const selectedUser = useMemo(() => users.find((item) => item._id === selectedId) || null, [users, selectedId])

  useEffect(() => {
    if (!selectedUser) return
    setBusinessName(selectedUser.businessName || '')
    setCustomDomain(selectedUser.customDomain || '')
    setBranding(normalizeBranding({ ...DEFAULT_BRANDING, ...(selectedUser.workspaceBranding || {}) }))
    setHeaderFile(null)
    setLoginFile(null)
    setDarkFile(null)
    setFaviconFile(null)
  }, [selectedUser])

  const headerPreview = headerFile ? URL.createObjectURL(headerFile) : resolveBrandAsset(branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const loginPreview = loginFile ? URL.createObjectURL(loginFile) : resolveBrandAsset(branding.loginLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const darkPreview = darkFile ? URL.createObjectURL(darkFile) : resolveBrandAsset(branding.darkLogo || branding.headerLogo || branding.loginLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const faviconPreview = faviconFile ? URL.createObjectURL(faviconFile) : resolveBrandAsset(branding.favicon, `${import.meta.env.BASE_URL}magneticcommerce-favicon.png`)

  useEffect(() => {
    if (requestedOwnerId && requestedOwnerId !== selectedId && users.some((item) => item?._id === requestedOwnerId)) {
      setSelectedId(requestedOwnerId)
    }
  }, [requestedOwnerId, selectedId, users])

  useEffect(() => {
    return () => {
      try { if (headerFile) URL.revokeObjectURL(headerPreview) } catch {}
      try { if (loginFile) URL.revokeObjectURL(loginPreview) } catch {}
      try { if (darkFile) URL.revokeObjectURL(darkPreview) } catch {}
      try { if (faviconFile) URL.revokeObjectURL(faviconPreview) } catch {}
    }
  }, [headerFile, loginFile, darkFile, faviconFile, headerPreview, loginPreview, darkPreview, faviconPreview])

  async function saveWorkspace(e) {
    e.preventDefault()
    if (!selectedUser?._id) return
    setSaving(true)
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('businessName', businessName)
      fd.append('customDomain', customDomain)
      if (headerFile) fd.append('header', headerFile)
      if (loginFile) fd.append('login', loginFile)
      if (darkFile) fd.append('dark', darkFile)
      if (faviconFile) fd.append('favicon', faviconFile)
      for (const field of TEXT_FIELDS) fd.append(field.key, branding[field.key] || '')
      const res = await apiUploadPatch(`/api/users/${selectedUser._id}/workspace`, fd)
      clearApiCache('/api/users')
      setUsers((prev) => prev.map((item) => (item._id === selectedUser._id ? res.user : item)))
      setMessage('Workspace settings updated')
      setHeaderFile(null)
      setLoginFile(null)
      setDarkFile(null)
      setFaviconFile(null)
    } catch (err) {
      setMessage(err?.message || 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-title gradient heading-blue">Admin Settings</div>
          <div className="page-subtitle">Manage each user workspace, branding, light and dark logos, favicon, and custom domain from one place.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div className="theme-card" style={{ padding: 20, display: 'grid', gap: 16, position: 'sticky', top: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Workspace Directory</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Pick a business workspace to manage branding and storefront identity.</div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {users.map((user) => {
              const active = user._id === selectedId
              const brand = normalizeBranding({ ...DEFAULT_BRANDING, ...(user.workspaceBranding || {}) })
              const preview = resolveBrandAsset(brand.headerLogo || brand.loginLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => setSelectedId(user._id)}
                  className="theme-card"
                  style={{
                    padding: 14,
                    textAlign: 'left',
                    display: 'grid',
                    gap: 10,
                    border: active ? '1px solid #f59e0b' : '1px solid var(--border)',
                    background: active ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(17,24,39,0.02))' : 'var(--panel)',
                    boxShadow: active ? '0 18px 40px rgba(245,158,11,0.12)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid var(--border)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                      <img src={preview} alt={brand.companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{user.businessName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || brand.companyName}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span className="btn secondary" style={{ padding: '4px 10px', minHeight: 0 }}>{brand.storeName}</span>
                    {user.customDomain ? <span className="btn secondary" style={{ padding: '4px 10px', minHeight: 0 }}>{user.customDomain}</span> : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={saveWorkspace} className="theme-card" style={{ padding: 24, display: 'grid', gap: 18 }}>
          {selectedUser ? (
            <>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{selectedUser.businessName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Workspace Settings'}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>These settings control the storefront logo, favicon, titles, login copy, and workspace identity for this user.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                <div>
                  <div className="label">Business Name</div>
                  <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Magnetic E-Commerce" />
                </div>
                <div>
                  <div className="label">Custom Domain</div>
                  <input className="input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="commerce.magnetic-ict.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <UploadField label="Header Logo" preview={headerPreview} accept="image/*" file={headerFile} onChange={setHeaderFile} />
                <UploadField label="Login Logo" preview={loginPreview} accept="image/*" file={loginFile} onChange={setLoginFile} />
                <UploadField label="Dark Mode Logo" preview={darkPreview} accept="image/*" file={darkFile} onChange={setDarkFile} />
                <UploadField label="Favicon" preview={faviconPreview} accept="image/png,image/svg+xml,image/x-icon,.ico" file={faviconFile} onChange={setFaviconFile} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                {TEXT_FIELDS.map((field) => (
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: message.includes('updated') ? '#059669' : 'var(--muted)', fontWeight: 600 }}>{message || 'Select a workspace and save when you are ready.'}</div>
                <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Workspace Settings'}</button>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--muted)' }}>No workspaces found yet.</div>
          )}
        </form>
      </div>
    </div>
  )
}
