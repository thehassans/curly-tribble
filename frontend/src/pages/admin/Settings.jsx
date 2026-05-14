import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiUploadPatch, clearApiCache } from '../../api.js'
import { DEFAULT_BRANDING, normalizeBranding, resolveBrandAsset } from '../../util/branding.js'

const WORKSPACE_COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', currencySymbol: '৳' },
  { code: 'SA', name: 'KSA',        flag: '🇸🇦', currency: 'SAR', currencySymbol: '﷼' },
  { code: 'AE', name: 'UAE',        flag: '🇦🇪', currency: 'AED', currencySymbol: 'د.إ' },
  { code: 'OM', name: 'Oman',       flag: '🇴🇲', currency: 'OMR', currencySymbol: 'ر.ع.' },
  { code: 'BH', name: 'Bahrain',    flag: '🇧🇭', currency: 'BHD', currencySymbol: 'BD' },
  { code: 'KW', name: 'Kuwait',     flag: '🇰🇼', currency: 'KWD', currencySymbol: 'KD' },
  { code: 'QA', name: 'Qatar',      flag: '🇶🇦', currency: 'QAR', currencySymbol: 'QR' },
  { code: 'IN', name: 'India',      flag: '🇮🇳', currency: 'INR', currencySymbol: '₹' },
  { code: 'PK', name: 'Pakistan',   flag: '🇵🇰', currency: 'PKR', currencySymbol: 'Rs' },
  { code: 'JO', name: 'Jordan',     flag: '🇯🇴', currency: 'JOD', currencySymbol: 'JD' },
  { code: 'US', name: 'USA',        flag: '🇺🇸', currency: 'USD', currencySymbol: '$' },
  { code: 'GB', name: 'UK',         flag: '🇬🇧', currency: 'GBP', currencySymbol: '£' },
  { code: 'CA', name: 'Canada',     flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'AU', name: 'Australia',  flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$' },
]

const TEXT_FIELDS = [
  { key: 'title', label: 'Workspace Title', placeholder: 'My E-Commerce' },
  { key: 'appName', label: 'Short Name', placeholder: 'MyApp' },
  { key: 'companyName', label: 'Company Name', placeholder: 'My Company' },
  { key: 'portalName', label: 'Portal Name', placeholder: 'My Admin' },
  { key: 'storeName', label: 'Storefront Name', placeholder: 'My Store' },
  { key: 'staffLoginSubtitle', label: 'Login Subtitle', placeholder: 'Sign in to your workspace' },
  { key: 'footerText', label: 'Footer Text', placeholder: 'Powered by …' },
  { key: 'reportSignature', label: 'Report Signature', placeholder: 'My Company' },
  { key: 'reportFooterText', label: 'Report Footer', placeholder: 'All Rights Reserved' },
  { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://commerce.example.com' },
]

const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--fg)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5, display: 'block' }

function UploadField({ label, preview, accept, file, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 7 }}>
      <span style={lbl}>{label}</span>
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-2)', cursor: 'pointer', position: 'relative' }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--panel)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : 'Choose file…'}</span>
        <input type="file" accept={accept} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={e => onChange(e.target.files?.[0] || null)} />
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
  const [baseCurrency, setBaseCurrency] = useState('AED')
  const [businessCountries, setBusinessCountries] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const requestedOwnerId = String(searchParams.get('ownerId') || '').trim()

  async function loadUsers() {
    const { users: rows = [] } = await apiGet('/api/users?role=user', { skipCache: true })
    setUsers(rows)
    if (requestedOwnerId && rows.some(r => r?._id === requestedOwnerId)) { setSelectedId(requestedOwnerId); return }
    if (!selectedId && rows[0]?._id) setSelectedId(rows[0]._id)
  }

  useEffect(() => { loadUsers().catch(() => {}) }, [requestedOwnerId])

  useEffect(() => {
    if (requestedOwnerId && requestedOwnerId !== selectedId && users.some(r => r?._id === requestedOwnerId))
      setSelectedId(requestedOwnerId)
  }, [requestedOwnerId, selectedId, users])

  const selectedUser = useMemo(() => users.find(r => r._id === selectedId) || null, [users, selectedId])

  useEffect(() => {
    if (!selectedUser) return
    setBusinessName(selectedUser.businessName || '')
    setCustomDomain(selectedUser.customDomain || '')
    setBranding(normalizeBranding({ ...DEFAULT_BRANDING, ...(selectedUser.workspaceBranding || {}) }))
    setBaseCurrency(selectedUser.workspaceSettings?.baseCurrency || 'AED')
    setBusinessCountries(Array.isArray(selectedUser.workspaceSettings?.businessCountries) ? selectedUser.workspaceSettings.businessCountries : [])
    setHeaderFile(null); setLoginFile(null); setDarkFile(null); setFaviconFile(null)
  }, [selectedUser])

  const headerPreview = headerFile ? URL.createObjectURL(headerFile) : resolveBrandAsset(branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const loginPreview = loginFile ? URL.createObjectURL(loginFile) : resolveBrandAsset(branding.loginLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const darkPreview = darkFile ? URL.createObjectURL(darkFile) : resolveBrandAsset(branding.darkLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const faviconPreview = faviconFile ? URL.createObjectURL(faviconFile) : resolveBrandAsset(branding.favicon, `${import.meta.env.BASE_URL}magneticcommerce-favicon.png`)

  async function saveWorkspace(e) {
    e.preventDefault()
    if (!selectedUser?._id) return
    setSaving(true); setMessage('')
    try {
      const fd = new FormData()
      fd.append('businessName', businessName); fd.append('customDomain', customDomain)
      fd.append('baseCurrency', baseCurrency)
      fd.append('businessCountries', JSON.stringify(businessCountries))
      if (headerFile) fd.append('header', headerFile)
      if (loginFile) fd.append('login', loginFile)
      if (darkFile) fd.append('dark', darkFile)
      if (faviconFile) fd.append('favicon', faviconFile)
      for (const f of TEXT_FIELDS) fd.append(f.key, branding[f.key] || '')
      const res = await apiUploadPatch(`/api/users/${selectedUser._id}/workspace`, fd)
      clearApiCache('/api/users')
      setUsers(prev => prev.map(r => r._id === selectedUser._id ? res.user : r))
      setMessage('Saved')
      setHeaderFile(null); setLoginFile(null); setDarkFile(null); setFaviconFile(null)
    } catch (err) {
      setMessage(err?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>

      {/* Heading */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>Settings</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Manage workspace branding, domain, and identity</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

        {/* Sidebar: workspace selector */}
        <div style={{ display: 'grid', gap: 8, position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            Workspaces
          </div>
          {users.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>No workspaces yet.</div>
          )}
          {users.map(u => {
            const active = u._id === selectedId
            const name = u.businessName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Workspace'
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => setSelectedId(u._id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--panel)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: active ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700,
                  color: active ? 'var(--accent)' : 'var(--muted)',
                }}>
                  {name[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Main: settings form */}
        {selectedUser ? (
          <form onSubmit={saveWorkspace} style={{ display: 'grid', gap: 24 }}>

            {/* Business */}
            <div style={{ display: 'grid', gap: 14, padding: '20px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--panel)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Business</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <span style={lbl}>Business Countries</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {WORKSPACE_COUNTRIES.map(c => {
                    const active = businessCountries.includes(c.name)
                    return (
                      <button key={c.code} type="button" onClick={() => setBusinessCountries(prev => prev.includes(c.name) ? prev.filter(x => x !== c.name) : [...prev, c.name])}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: active ? '1px solid var(--accent)' : '1px solid var(--border)', background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--panel-2)', color: active ? 'var(--accent)' : 'var(--fg)' }}>
                        <span>{c.flag}</span><span>{c.name}</span>{active && <span style={{ fontSize: 10, opacity: 0.7 }}>{c.currency}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div><label style={lbl}>Base Currency</label>
                <select style={inp} value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                  {WORKSPACE_COUNTRIES.map(c => <option key={c.currency} value={c.currency}>{c.flag} {c.currency} — {c.name} ({c.currencySymbol})</option>)}
                </select>
              </div>
            </div>

            {/* Identity */}
            <div style={{ display: 'grid', gap: 14, padding: '20px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--panel)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Identity</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                <div><label style={lbl}>Business Name</label><input style={inp} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Company" /></div>
                <div><label style={lbl}>Custom Domain</label><input style={inp} value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="commerce.example.com" /></div>
                {TEXT_FIELDS.map(f => (
                  <div key={f.key}><label style={lbl}>{f.label}</label><input style={inp} value={branding[f.key] || ''} onChange={e => setBranding(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} /></div>
                ))}
              </div>
            </div>

            {/* Branding assets */}
            <div style={{ display: 'grid', gap: 14, padding: '20px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--panel)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Branding Assets</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                <UploadField label="Header Logo" preview={headerPreview} accept="image/*" file={headerFile} onChange={setHeaderFile} />
                <UploadField label="Login Logo" preview={loginPreview} accept="image/*" file={loginFile} onChange={setLoginFile} />
                <UploadField label="Dark Logo" preview={darkPreview} accept="image/*" file={darkFile} onChange={setDarkFile} />
                <UploadField label="Favicon" preview={faviconPreview} accept="image/png,image/svg+xml,image/x-icon,.ico" file={faviconFile} onChange={setFaviconFile} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, color: message === 'Saved' ? '#10b981' : '#ef4444', fontWeight: 500 }}>{message}</span>
              <button type="submit" disabled={saving} style={{ height: 36, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

          </form>
        ) : (
          <div style={{ padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>Select a workspace to edit settings.</div>
        )}
      </div>
    </div>
  )
}
