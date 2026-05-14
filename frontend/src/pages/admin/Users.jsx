import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiUpload, clearApiCache } from '../../api.js'
import PasswordInput from '../../components/PasswordInput.jsx'
import PhoneInput from 'react-phone-number-input'
import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import { DEFAULT_BRANDING, normalizeBranding, resolveBrandAsset } from '../../util/branding.js'
import 'react-phone-number-input/style.css'

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

const QUICK_FIELDS = [
  { key: 'title', label: 'Workspace Title', placeholder: 'My E-Commerce' },
  { key: 'companyName', label: 'Company Name', placeholder: 'My Company' },
  { key: 'storeName', label: 'Storefront Name', placeholder: 'My Store' },
  { key: 'portalName', label: 'Portal Name', placeholder: 'My Admin' },
  { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://commerce.example.com' },
]

function Field({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function UploadField({ label, preview, file, onChange, accept = 'image/*' }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-2)', position: 'relative' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : 'Choose file…'}</span>
        <input type="file" accept={accept} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
      {children}
    </div>
  )
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [view, setView] = useState('list')
  const [impersonating, setImpersonating] = useState(null)

  async function loginAs(userId) {
    setImpersonating(userId)
    try {
      const data = await apiPost(`/api/users/${userId}/impersonate`, {})
      // Save current admin session so we can restore it later
      const adminToken = localStorage.getItem('token')
      const adminMe = localStorage.getItem('me')
      if (adminToken) sessionStorage.setItem('admin_token_backup', adminToken)
      if (adminMe) sessionStorage.setItem('admin_me_backup', adminMe)
      localStorage.setItem('token', data.token)
      localStorage.setItem('me', JSON.stringify(data.user))
      window.location.href = '/user'
    } catch (e) {
      alert(e?.message || 'Failed to login as user')
    } finally {
      setImpersonating(null)
    }
  }

  async function load() {
    try {
      const { users: rows = [] } = await apiGet('/api/users?role=user', { skipCache: true })
      setUsers(Array.isArray(rows) ? rows : [])
    } catch {}
  }
  useEffect(() => { load() }, [])

  function CreateWorkspacePage({ onCreated, onCancel }) {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [country, setCountry] = useState('')
    const [password, setPassword] = useState('')
    const [customDomain, setCustomDomain] = useState('')
    const [branding, setBranding] = useState(() => normalizeBranding(DEFAULT_BRANDING))
    const [headerFile, setHeaderFile] = useState(null)
    const [darkFile, setDarkFile] = useState(null)
    const [businessCountries, setBusinessCountries] = useState([])
    const [baseCurrency, setBaseCurrency] = useState('AED')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function toggleCountry(name) {
      setBusinessCountries(prev => {
        const next = prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
        // Auto-set base currency from the first selected country
        if (!prev.includes(name) && prev.length === 0) {
          const entry = WORKSPACE_COUNTRIES.find(c => c.name === name)
          if (entry) setBaseCurrency(entry.currency)
        }
        return next
      })
    }

    const countryOptions = useMemo(() => {
      try { return getCountries().map(c => ({ code: c, label: `${c} (+${getCountryCallingCode(c)})` })) } catch { return [] }
    }, [])

    const headerPreview = headerFile ? URL.createObjectURL(headerFile) : resolveBrandAsset(branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
    const darkPreview = darkFile ? URL.createObjectURL(darkFile) : resolveBrandAsset(branding.darkLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)

    async function submit() {
      if (!firstName || !email || !password) { setError('First name, email and password are required'); return }
      setLoading(true); setError('')
      try {
        const fd = new FormData()
        fd.append('firstName', firstName); fd.append('lastName', lastName)
        fd.append('businessName', businessName); fd.append('email', email)
        fd.append('phone', phone || ''); fd.append('country', country)
        fd.append('password', password); fd.append('role', 'user')
        fd.append('customDomain', customDomain)
        fd.append('baseCurrency', baseCurrency)
        fd.append('businessCountries', JSON.stringify(businessCountries))
        if (headerFile) fd.append('header', headerFile)
        if (darkFile) fd.append('dark', darkFile)
        QUICK_FIELDS.forEach(f => fd.append(f.key, branding[f.key] || ''))
        await apiUpload('/api/users', fd)
        clearApiCache('/api/users')
        onCreated()
      } catch (e) {
        setError(e?.message || 'Failed to create workspace')
      } finally { setLoading(false) }
    }

    const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--fg)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

    return (
      <div style={{ display: 'grid', gap: 28, maxWidth: 900 }}>
        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
          <span style={{ color: 'var(--border)', fontSize: 16 }}>/</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>New Workspace</span>
        </div>

        {/* Owner */}
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionHeading>Owner</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <Field label="First Name"><input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ahmed" /></Field>
            <Field label="Last Name"><input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Wasim" /></Field>
            <Field label="Email"><input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" /></Field>
            <Field label="Password"><PasswordInput value={password} onChange={setPassword} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <Field label="Country">
              <select style={inputStyle} value={country} onChange={e => setCountry(e.target.value)}>
                <option value="">Select country</option>
                {countryOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
              </select>
            </Field>
            <Field label="Phone">
              <PhoneInput international country={country || undefined} defaultCountry={country || undefined} value={phone} onChange={setPhone} placeholder="+880 1234 567890" style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Business */}
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionHeading>Business</SectionHeading>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Business Countries</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WORKSPACE_COUNTRIES.map(c => {
                const active = businessCountries.includes(c.name)
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
                      borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--panel-2)',
                      color: active ? 'var(--accent)' : 'var(--fg)',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                    {active && <span style={{ fontSize: 11, opacity: 0.7 }}>{c.currency}</span>}
                  </button>
                )
              })}
            </div>
            {businessCountries.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Select at least one country where this workspace will operate</div>
            )}
          </div>
          <Field label="Base Currency">
            <select style={inputStyle} value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
              {WORKSPACE_COUNTRIES.map(c => (
                <option key={c.currency} value={c.currency}>{c.flag} {c.currency} — {c.name} ({c.currencySymbol})</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Workspace */}
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionHeading>Workspace</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <Field label="Business Name"><input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Company" /></Field>
            <Field label="Custom Domain"><input style={inputStyle} value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="commerce.example.com" /></Field>
            {QUICK_FIELDS.map(f => (
              <Field key={f.key} label={f.label}>
                <input style={inputStyle} value={branding[f.key] || ''} onChange={e => setBranding(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </Field>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionHeading>Branding</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            <UploadField label="Header Light Logo" preview={headerPreview} file={headerFile} onChange={setHeaderFile} />
            <UploadField label="Header Dark Logo" preview={darkPreview} file={darkFile} onChange={setDarkFile} />
          </div>
        </div>

        {error && <div style={{ fontSize: 13, color: '#ef4444', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ height: 38, padding: '0 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} style={{ height: 38, padding: '0 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating…' : 'Create Workspace'}
          </button>
        </div>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div style={{ padding: '28px 0' }}>
        <CreateWorkspacePage
          onCreated={() => { load(); setView('list') }}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>Workspaces</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{users.length} workspace{users.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => setView('create')}
          style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Workspace
        </button>
      </div>

      {/* User list */}
      {users.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>No workspaces yet</div>
          <button
            onClick={() => setView('create')}
            style={{ height: 38, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Create first workspace
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 1 }}>
          {users.map((u) => {
            const wb = normalizeBranding({ ...DEFAULT_BRANDING, ...(u.workspaceBranding || {}) })
            const preview = resolveBrandAsset(wb.headerLogo || wb.loginLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
            const name = u.businessName || wb.companyName || `${u.firstName || ''} ${u.lastName || ''}`.trim()
            return (
              <div
                key={u._id}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--panel)'}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={preview} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} {u.customDomain ? `· ${u.customDomain}` : ''}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, display: 'none' }} className="show-desktop">{new Date(u.createdAt).toLocaleDateString()}</div>
                <button
                  onClick={() => navigate(`/admin/settings?ownerId=${encodeURIComponent(u._id)}`)}
                  style={{ height: 30, padding: '0 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                >
                  Manage
                </button>
                <button
                  onClick={() => loginAs(u._id)}
                  disabled={impersonating === u._id}
                  style={{ height: 30, padding: '0 14px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: impersonating === u._id ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: impersonating === u._id ? 0.7 : 1 }}
                >
                  {impersonating === u._id ? '…' : 'Login as'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
