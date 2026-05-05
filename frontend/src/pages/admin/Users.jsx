import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiUpload, clearApiCache } from '../../api.js'
import Modal from '../../components/Modal.jsx'
import PasswordInput from '../../components/PasswordInput.jsx'
import PhoneInput from 'react-phone-number-input'
import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import { DEFAULT_BRANDING, normalizeBranding, resolveBrandAsset } from '../../util/branding.js'
import 'react-phone-number-input/style.css'

const QUICK_FIELDS = [
  { key: 'title', label: 'Workspace Title', placeholder: 'Magnetic E-Commerce' },
  { key: 'companyName', label: 'Company Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'storeName', label: 'Storefront Name', placeholder: 'Magnetic E-Commerce' },
  { key: 'portalName', label: 'Portal Name', placeholder: 'Magnetic E-Commerce Admin' },
  { key: 'websiteUrl', label: 'Website URL', placeholder: 'https://commerce.magnetic-ict.com' },
]

function UploadField({ label, preview, file, onChange, accept = 'image/*' }) {
  return (
    <div className="theme-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{file ? file.name : 'Upload image asset'}</div>
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 14, border: '1px solid var(--border)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

export default function AdminUsers(){
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)

  async function load(){
    const { users: rows = [] } = await apiGet('/api/users?role=user', { skipCache: true })
    setUsers(Array.isArray(rows) ? rows : [])
  }
  useEffect(()=>{ load().catch(()=>{}) }, [])

  function CreateUserForm({ onCreated }){
    const [firstName,setFirstName]=useState('')
    const [lastName,setLastName]=useState('')
    const [businessName,setBusinessName]=useState('')
    const [email,setEmail]=useState('')
    const [phone,setPhone]=useState('')
    const [country,setCountry]=useState('')
    const [password,setPassword]=useState('')
    const [customDomain,setCustomDomain]=useState('')
    const [branding,setBranding]=useState(() => normalizeBranding(DEFAULT_BRANDING))
    const [headerFile,setHeaderFile]=useState(null)
    const [loginFile,setLoginFile]=useState(null)
    const [faviconFile,setFaviconFile]=useState(null)
    const [loading,setLoading]=useState(false)
    const [error,setError]=useState('')

    const countryOptions = useMemo(()=>{
      try{
        return getCountries().map(c => ({
          code: c,
          label: `${c} (+${getCountryCallingCode(c)})`,
        }))
      }catch{
        return []
      }
    }, [])

    const headerPreview = headerFile ? URL.createObjectURL(headerFile) : resolveBrandAsset(branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
    const loginPreview = loginFile ? URL.createObjectURL(loginFile) : resolveBrandAsset(branding.loginLogo || branding.headerLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
    const faviconPreview = faviconFile ? URL.createObjectURL(faviconFile) : resolveBrandAsset(branding.favicon, `${import.meta.env.BASE_URL}magnetic-logo.svg`)

    useEffect(() => {
      return () => {
        try { if (headerFile) URL.revokeObjectURL(headerPreview) } catch {}
        try { if (loginFile) URL.revokeObjectURL(loginPreview) } catch {}
        try { if (faviconFile) URL.revokeObjectURL(faviconPreview) } catch {}
      }
    }, [headerFile, loginFile, faviconFile, headerPreview, loginPreview, faviconPreview])

    async function submit(){
      setLoading(true)
      setError('')
      try{
        const fd = new FormData()
        fd.append('firstName', firstName)
        fd.append('lastName', lastName)
        fd.append('businessName', businessName)
        fd.append('email', email)
        fd.append('phone', phone || '')
        fd.append('country', country)
        fd.append('password', password)
        fd.append('role', 'user')
        fd.append('customDomain', customDomain)
        if (headerFile) fd.append('header', headerFile)
        if (loginFile) fd.append('login', loginFile)
        if (faviconFile) fd.append('favicon', faviconFile)
        QUICK_FIELDS.forEach((field) => fd.append(field.key, branding[field.key] || ''))
        await apiUpload('/api/users', fd)
        clearApiCache('/api/users')
        onCreated()
      }catch(e){
        setError(e?.message || 'Failed to create user workspace')
      }finally{ setLoading(false) }
    }

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <div>
            <div className="label">Owner First Name</div>
            <input className="input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First Name" />
          </div>
          <div>
            <div className="label">Owner Last Name</div>
            <input className="input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last Name" />
          </div>
          <div>
            <div className="label">Business Name</div>
            <input className="input" value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Magnetic E-Commerce" />
          </div>
          <div>
            <div className="label">Custom Domain</div>
            <input className="input" value={customDomain} onChange={e=>setCustomDomain(e.target.value)} placeholder="commerce.magnetic-ict.com" />
          </div>
          <div>
            <div className="label">Email</div>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div>
            <div className="label">Country</div>
            <select className="input" value={country} onChange={e=>setCountry(e.target.value)}>
              <option value="">Select Country</option>
              {countryOptions.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="label">Phone</div>
          <div className="input-group">
            <PhoneInput
              international
              country={country || undefined}
              defaultCountry={country || undefined}
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
              className="input"
            />
          </div>
        </div>

        <div>
          <div className="label">Password</div>
          <PasswordInput value={password} onChange={setPassword} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <UploadField label="Header Logo" preview={headerPreview} file={headerFile} onChange={setHeaderFile} />
          <UploadField label="Login Logo" preview={loginPreview} file={loginFile} onChange={setLoginFile} />
          <UploadField label="Favicon" preview={faviconPreview} file={faviconFile} onChange={setFaviconFile} accept="image/png,image/svg+xml,image/x-icon,.ico" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          {QUICK_FIELDS.map((field) => (
            <div key={field.key}>
              <div className="label">{field.label}</div>
              <input
                className="input"
                value={branding[field.key] || ''}
                onChange={e=>setBranding(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {error ? <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div> : null}

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:4}}>
          <button type="button" className="btn secondary" onClick={()=>setOpen(false)}>Cancel</button>
          <button type="button" className="btn" onClick={submit} disabled={loading}>{loading?'Creating...':'Create Workspace User'}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-title gradient heading-blue">Users</div>
          <div className="page-subtitle">Create and manage separate business workspaces for each user panel.</div>
        </div>
        <button className="btn" onClick={()=>setOpen(true)}>Create User Workspace</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {users.map((u)=> {
          const workspaceBranding = normalizeBranding({ ...DEFAULT_BRANDING, ...(u.workspaceBranding || {}) })
          const preview = resolveBrandAsset(workspaceBranding.headerLogo || workspaceBranding.loginLogo, `${import.meta.env.BASE_URL}magnetic-logo.svg`)
          return (
            <div key={u._id} className="theme-card" style={{ padding: 18, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  <img src={preview} alt={workspaceBranding.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{u.businessName || workspaceBranding.companyName || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{u.firstName} {u.lastName} · {u.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
                <div><strong style={{ color: 'var(--fg)' }}>Storefront:</strong> {workspaceBranding.storeName}</div>
                <div><strong style={{ color: 'var(--fg)' }}>Portal:</strong> {workspaceBranding.portalName}</div>
                <div><strong style={{ color: 'var(--fg)' }}>Domain:</strong> {u.customDomain || 'Not set yet'}</div>
                <div><strong style={{ color: 'var(--fg)' }}>Created:</strong> {new Date(u.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn secondary" onClick={() => navigate(`/admin/settings?ownerId=${encodeURIComponent(u._id)}`)}>Manage Workspace</button>
                {u.customDomain ? <span className="btn secondary" style={{ minHeight: 0, padding: '8px 10px' }}>{u.customDomain}</span> : null}
              </div>
            </div>
          )
        })}
        {!users.length && <div className="theme-card" style={{ padding: 24, color: 'var(--muted)' }}>No workspace users created yet.</div>}
      </div>

      <Modal title="Create User Workspace" open={open} onClose={()=>setOpen(false)} maxWidth="1100px">
        <CreateUserForm onCreated={()=>{ setOpen(false); load().catch(()=>{}) }} />
      </Modal>
    </div>
  )
}
