import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Tabs from '../ui/Tabs.jsx'
import { getThemeMode, setThemeMode, subscribeThemeMode } from '../util/themeMode.js'

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'agent' },
  { to: '/admin/settings', label: 'Settings', icon: 'manager' },
]

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [closed, setClosed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [theme, setTheme] = useState(() => getThemeMode())

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setClosed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const initial = getThemeMode()
    setTheme(initial)
    setThemeMode(initial)
  }, [])

  useEffect(() => subscribeThemeMode((next) => setTheme(next)), [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(setThemeMode(next))
  }

  function doLogout() {
    try { localStorage.removeItem('token'); localStorage.removeItem('me'); localStorage.removeItem('navColors') } catch {}
    try { navigate('/login', { replace: true }) } catch {}
    setTimeout(() => { try { window.location.assign('/login') } catch {} }, 30)
  }

  const path = location.pathname || ''
  const pageTitle = PAGE_TITLES[path] || PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/')) || ''] || 'Admin'
  const isLight = theme === 'light'

  return (
    <div>
      <Sidebar closed={closed} links={NAV_LINKS} onToggle={() => setClosed(c => !c)} />
      <div className={`main ${closed ? 'full' : ''}`}>

        {/* Ultra-minimal topbar */}
        <div
          className="topbar"
          style={{
            background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(13,13,18,0.97)',
            borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            paddingTop: 0,
            paddingBottom: 0,
            minHeight: 52,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setClosed(c => !c)}
              title={closed ? 'Expand' : 'Collapse'}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)',
                color: isLight ? '#0f172a' : '#e2e8f0',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{
              fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
              color: isLight ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              Admin
            </span>
            {!isMobile && (
              <>
                <span style={{ color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', fontSize: 16 }}>/</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: isLight ? '#0f172a' : '#f1f5f9' }}>{pageTitle}</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleTheme}
              title={isLight ? 'Dark mode' : 'Light mode'}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)',
                color: isLight ? '#0f172a' : '#e2e8f0',
                display: 'grid', placeItems: 'center',
              }}
            >
              {isLight ? <MoonIcon /> : <SunIcon />}
            </button>
            {!isMobile && (
              <NavLink
                to="/user"
                style={{
                  height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', textDecoration: 'none',
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.09)',
                }}
              >
                User Panel
              </NavLink>
            )}
            <button
              onClick={doLogout}
              style={{
                height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'transparent', cursor: 'pointer',
                color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className={`container ${isMobile ? 'with-mobile-tabs' : ''}`}>
          <Outlet />
        </div>

        {isMobile && (() => {
          const mobileItems = [
            { key: 'dashboard', label: 'Dashboard', icon: '▦', to: '/admin' },
            { key: 'users', label: 'Users', icon: '◎', to: '/admin/users' },
            { key: 'settings', label: 'Settings', icon: '⚙', to: '/admin/settings' },
          ]
          const activeKey =
            path === '/admin' ? 'dashboard' :
            path.includes('/admin/users') ? 'users' :
            path.includes('/admin/settings') ? 'settings' : 'dashboard'
          return (
            <Tabs
              items={mobileItems}
              activeKey={activeKey}
              onChange={(k) => { const t = mobileItems.find(x => x.key === k); if (t) navigate(t.to) }}
            />
          )
        })()}
      </div>
    </div>
  )
}
