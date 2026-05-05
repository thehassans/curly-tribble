import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Tabs from '../ui/Tabs.jsx'
import { DEFAULT_BRANDING, resolveBrandAsset } from '../util/branding.js'
import { useBranding } from '../util/useBranding.js'
import { getThemeMode, setThemeMode, subscribeThemeMode } from '../util/themeMode.js'

export default function AdminLayout(){
  const navigate = useNavigate()
  const location = useLocation()
  const [closed, setClosed] = useState(()=> (typeof window!=='undefined' ? window.innerWidth <= 768 : false))
  const [isMobile, setIsMobile] = useState(()=> (typeof window!=='undefined' ? window.innerWidth <= 768 : false))
  const [theme, setTheme] = useState(() => getThemeMode())

  useEffect(()=>{
    function onResize(){
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setClosed(true)
    }
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  },[])

  useEffect(() => {
    const initial = getThemeMode()
    setTheme(initial)
    setThemeMode(initial)
  }, [])

  useEffect(() => subscribeThemeMode((next) => setTheme(next)), [])

  // Swatch helpers for header theme controls
  function applyNavColors(cfg){
    if (!cfg) return
    const RESET_KEYS = ['sidebar-bg','sidebar-border','nav-active-bg','nav-active-fg']
    const { __theme, __reset, ...vars } = cfg
    if (__reset || Object.keys(vars).length === 0){
      RESET_KEYS.forEach(k => document.documentElement.style.removeProperty(`--${k}`))
      try{ localStorage.removeItem('navColors') }catch{}
    } else {
      Object.entries(vars).forEach(([k,v])=>{
        document.documentElement.style.setProperty(`--${k}`, v)
      })
      localStorage.setItem('navColors', JSON.stringify(vars))
    }
    if (__theme){
      setTheme(setThemeMode(__theme))
    }
  }
  const navPresets = [
    { title:'Default', cfg:{ __reset:true }, sample:'linear-gradient(135deg,var(--panel-2),var(--panel))' },
    { title:'Purple',  cfg:{ 'sidebar-bg':'#1a1036', 'sidebar-border':'#2b1856', 'nav-active-bg':'#3f1d67', 'nav-active-fg':'#f5f3ff' }, sample:'#7c3aed' },
    { title:'Green',   cfg:{ 'sidebar-bg':'#06251f', 'sidebar-border':'#0b3b31', 'nav-active-bg':'#0f3f33', 'nav-active-fg':'#c7f9ec' }, sample:'#10b981' },
    { title:'Blue',    cfg:{ 'sidebar-bg':'#0b1220', 'sidebar-border':'#223',    'nav-active-bg':'#1e293b', 'nav-active-fg':'#e2e8f0' }, sample:'#2563eb' },
    { title:'Slate',   cfg:{ 'sidebar-bg':'#0f172a', 'sidebar-border':'#1e293b', 'nav-active-bg':'#1f2937', 'nav-active-fg':'#e5e7eb' }, sample:'#334155' },
    { title:'Orange',  cfg:{ 'sidebar-bg':'#2a1304', 'sidebar-border':'#3b1d08', 'nav-active-bg':'#4a1f0a', 'nav-active-fg':'#ffedd5' }, sample:'#f97316' },
    { title:'Pink',    cfg:{ 'sidebar-bg':'#2a0b17', 'sidebar-border':'#3a0f20', 'nav-active-bg':'#4b1026', 'nav-active-fg':'#ffe4e6' }, sample:'#ec4899' },
    { title:'Light Pink', cfg:{ 'sidebar-bg':'#2b1020', 'sidebar-border':'#3a152b', 'nav-active-bg':'#4b1a36', 'nav-active-fg':'#ffd7ef' }, sample:'#f9a8d4' },
    { title:'Blush',   cfg:{ '__theme':'light', 'sidebar-bg':'#FFB5C0', 'sidebar-border':'#f39bab', 'nav-active-bg':'#ffdfe6', 'nav-active-fg':'#111827' }, sample:'#FFB5C0' },
    { title:'White',   cfg:{ '__theme':'light', 'sidebar-bg':'#ffffff', 'sidebar-border':'#e5e7eb', 'nav-active-bg':'#f1f5f9', 'nav-active-fg':'#111827' }, sample:'#ffffff' },
  ]
  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/settings', label: 'Settings' },
  ]
  function doLogout(){
    try{
      localStorage.removeItem('token')
      localStorage.removeItem('me')
      localStorage.removeItem('navColors')
    }catch{}
    try{ navigate('/login', { replace:true }) }catch{}
    setTimeout(()=>{ try{ window.location.assign('/login') }catch{} }, 30)
  }
  const [branding] = useBranding()
  const brandName = branding.companyName || branding.title || DEFAULT_BRANDING.companyName
  const logoSrc = resolveBrandAsset(branding.headerLogo || branding.loginLogo, `${import.meta.env.BASE_URL}magnetic-commerce.png`)
  const isLight = theme === 'light'
  return (
    <div>
      <Sidebar closed={closed} links={links} onToggle={()=>setClosed(c=>!c)} />
      <div className={`main ${closed ? 'full' : ''}`}>
        <div
          className="topbar"
          style={{
            background: isLight
              ? 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.96))'
              : 'linear-gradient(135deg, rgba(10,10,10,0.96), rgba(30,41,59,0.96))',
            borderBottom: isLight ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isLight ? '0 20px 50px rgba(148,163,184,0.18)' : '0 20px 50px rgba(15,23,42,0.28)',
            backdropFilter: 'blur(16px)',
            paddingTop: 18,
            paddingBottom: 18,
          }}
        >
          <div className="flex items-center gap-4 min-h-12">
            <button
              className="btn secondary w-9 h-9 p-0 grid place-items-center"
              onClick={()=> setClosed(c=>!c)}
              title={closed ? 'Open menu' : 'Close menu'}
              aria-label={closed ? 'Open menu' : 'Close menu'}
              style={{ borderRadius: 999, background: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)', color: isLight ? '#0f172a' : '#fff', border: isLight ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(255,255,255,0.12)' }}
            >
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: isMobile ? '10px 12px' : '12px 18px', borderRadius: 24, background: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88))' : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))', border: isLight ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(255,255,255,0.12)', minWidth: isMobile ? undefined : 320 }}>
              <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 18, background: 'rgba(255,255,255,0.96)', display: 'grid', placeItems: 'center', overflow: 'hidden', boxShadow: isLight ? '0 10px 24px rgba(148,163,184,0.22)' : '0 12px 30px rgba(0,0,0,0.25)' }}>
                <img src={logoSrc} alt={brandName} className="h-full w-full object-contain" />
              </div>
              {!isMobile && (
                <div style={{ display: 'grid', gap: 3 }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: isLight ? 'rgba(15,23,42,0.56)' : 'rgba(255,255,255,0.62)', fontWeight: 700 }}>Admin Control</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: isLight ? '#0f172a' : '#fff', lineHeight: 1 }}>{brandName}</div>
                  <div style={{ fontSize: 13, color: isLight ? 'rgba(51,65,85,0.82)' : 'rgba(255,255,255,0.72)' }}>Manage users, workspace branding, and separate business panels.</div>
                </div>
              )}
            </div>
            {!isMobile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-bold tracking-tight"
                style={{ background: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)', color: isLight ? '#0f172a' : '#fff', border: isLight ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(255,255,255,0.12)' }}>
                <span role="img" aria-label="gear">⚙️</span>
                <span>Workspace Admin</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <div role="group" aria-label="Theme colors" className="flex items-center gap-2">
                {navPresets.map(p => (
                  <button
                    key={p.title}
                    type="button"
                    title={p.title}
                    aria-label={p.title}
                    onClick={()=> applyNavColors(p.cfg)}
                    className="w-4 h-4 rounded-full shadow-inner cursor-pointer"
                    style={{ background: p.sample, border: isLight ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(255,255,255,0.3)' }}
                  />
                ))}
              </div>
            )}
            {!isMobile && <NavLink to="/user" className="btn secondary mr-2" style={{ borderRadius: 999, background: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)', color: isLight ? '#0f172a' : '#fff', border: isLight ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(255,255,255,0.12)' }}>User Panel</NavLink>}
            <button type="button" className="btn danger" onClick={doLogout} style={{ borderRadius: 999 }}>
              Logout
            </button>
          </div>
        </div>
        <div className={`container ${isMobile ? 'with-mobile-tabs' : ''}`}>
          <Outlet />
        </div>
        {/* Mobile bottom tabs */}
        {isMobile && (
          (()=>{
            const path = location.pathname || ''
            const items = [
              { key:'dashboard', label:'Dashboard', icon:'📊', to:'/admin' },
              { key:'users', label:'Users', icon:'👥', to:'/admin/users' },
              { key:'settings', label:'Settings', icon:'⚙️', to:'/admin/settings' },
            ]
            const activeKey = (
              path === '/admin' || path.startsWith('/admin$') ? 'dashboard' :
              path.includes('/admin/users') ? 'users' :
              path.includes('/admin/settings') ? 'settings' :
              'dashboard'
            )
            return (
              <Tabs
                items={items}
                activeKey={activeKey}
                onChange={(k)=>{ const t = items.find(x=>x.key===k); if(t) navigate(t.to) }}
              />
            )
          })()
        )}
      </div>
    </div>
  )
}
