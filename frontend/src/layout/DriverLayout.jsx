import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { API_BASE, apiGet, apiPatch } from '../api.js'
import AccountDropdown from '../components/ui/account-dropdown.jsx'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu.jsx'
import { Boxes, FileText, KeyRound, LogOut, UserPen, Wallet } from 'lucide-react'

export default function DriverLayout() {
  const [closed, setClosed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme)
    } catch {}
    const root = document.documentElement
    if (theme === 'dark') root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
  }, [theme])
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [me, setMe] = useState(() => { try{ return JSON.parse(localStorage.getItem('me')||'{}') }catch{ return {} } })
  // Settings
  const [availability, setAvailability] = useState('available')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [ringtone, setRingtone] = useState('shopify')
  const [showPassModal, setShowPassModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPass, setChangingPass] = useState(false)
  // Driver level for badge (based on delivered orders)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const levelThresholds = useMemo(()=>[0,10,50,100,250,500], [])
  const levelIdx = useMemo(()=>{
    const n = Number(deliveredCount||0)
    let idx = 0
    for (let i=0;i<levelThresholds.length;i++){ if (n >= levelThresholds[i]) idx = i; else break }
    return idx
  }, [deliveredCount, levelThresholds])
  useEffect(()=>{
    let alive = true
    ;(async()=>{
      try{ const m = await apiGet('/api/orders/driver/metrics'); if (alive) setDeliveredCount(Number(m?.status?.delivered||0)) }catch{}
    })()
    return ()=>{ alive = false }
  }, [])

  const mobileTabs = [
    {
      to: '/driver',
      label: 'Dashboard',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: '/driver/panel',
      label: 'Deliveries',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/driver/live-map',
      label: 'Live Map',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      to: '/driver/my-stock',
      label: 'Stock',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.3 7 12 12l8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      to: '/driver/orders/history',
      label: 'History',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      to: '/driver/payout',
      label: 'Payout',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 10h20" />
          <circle cx="16" cy="14" r="2" />
        </svg>
      ),
    },
    {
      to: '/driver/closings',
      label: 'Closings',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      ),
    },
    {
      to: '/driver/me',
      label: 'Me',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20a6 6 0 0 1 12 0" />
        </svg>
      ),
    },
  ]

  const tabsVisible = isMobile
  const hideSidebar = isMobile

  function doLogout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('me')
      localStorage.removeItem('navColors')
    } catch {}
    try {
      navigate('/login', { replace: true })
    } catch {}
    setTimeout(() => {
      try {
        window.location.assign('/login')
      } catch {}
    }, 30)
  }

  // Settings functions
  async function updateAvailability(val) {
    try {
      await apiPatch('/api/users/me/availability', { availability: val })
      setAvailability(val)
      setMe(n => {
        const updated = { ...n, availability: val }
        try {
          localStorage.setItem('me', JSON.stringify(updated))
        } catch {}
        return updated
      })
    } catch (err) {
      alert(err?.message || 'Failed to update availability')
    }
  }

  function storeSoundPrefs(enabled, tone) {
    try {
      localStorage.setItem('wa_sound', enabled ? 'true' : 'false')
      localStorage.setItem('wa_ringtone', tone)
    } catch {}
  }

  function playPreview() {
    if (!soundEnabled) {
      setSoundEnabled(true)
      storeSoundPrefs(true, ringtone)
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const toneAt = (when, freq, dur, type = 'sine', attack = 0.01, release = 0.1) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.value = freq
        osc.connect(gain)
        gain.connect(ctx.destination)
        const now = ctx.currentTime + when
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.3, now + attack)
        gain.gain.linearRampToValueAtTime(0, now + dur - release)
        osc.start(now)
        osc.stop(now + dur)
      }
      const n = ringtone || 'shopify'
      if (n === 'shopify') {
        toneAt(0.0, 932, 0.12, 'triangle')
        toneAt(0.1, 1047, 0.12, 'triangle')
        toneAt(0.2, 1245, 0.16, 'triangle')
        return
      }
      if (n === 'bell') {
        toneAt(0.0, 880, 0.6, 'sine', 0.0001, 0.4)
        toneAt(0.0, 1760, 0.4, 'sine', 0.0001, 0.18)
        return
      }
      if (n === 'ping') {
        toneAt(0, 1200, 0.08)
        return
      }
      if (n === 'knock') {
        toneAt(0, 100, 0.05, 'square')
        toneAt(0.08, 100, 0.05, 'square')
        return
      }
      if (n === 'beep') {
        toneAt(0, 800, 0.15)
        return
      }
    } catch {}
  }

  async function handlePasswordChange(e) {
    e?.preventDefault?.()
    if (!currentPassword || !newPassword) {
      alert('Please fill all fields')
      return
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match')
      return
    }
    setChangingPass(true)
    try {
      await apiPatch('/api/users/me/password', {
        currentPassword,
        newPassword,
      })
      alert('Password changed successfully!')
      setShowPassModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      alert(err?.message || 'Failed to change password')
    } finally {
      setChangingPass(false)
    }
  }

  // Initialize settings from localStorage and user data
  useEffect(() => {
    try {
      const v = localStorage.getItem('wa_sound')
      setSoundEnabled(v ? v !== 'false' : true)
    } catch {}
    try {
      setRingtone(localStorage.getItem('wa_ringtone') || 'shopify')
    } catch {}
    if (me?.availability) {
      setAvailability(me.availability)
    }
  }, [me])

  return (
    <div>
      <div
        className={`main ${hideSidebar ? 'full-mobile' : closed ? 'full' : ''} ${tabsVisible ? 'with-mobile-tabs' : ''}`}
      >
        {/* Professional topbar matching user panel */}
        {(
          <div
            className="topbar"
            style={{
              background: 'var(--sidebar-bg)',
              borderBottom: '1px solid var(--sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              minHeight: '60px',
              padding: '0 1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {(() => {
                const fallback = `${import.meta.env.BASE_URL}BSBackgroundremoved.png`
                const src = me.headerLogo ? `${API_BASE}${me.headerLogo}` : fallback
                return (
                  <img
                    src={src}
                    alt="Brand logo"
                    style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                  />
                )
              })()}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span aria-hidden style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                  fontSize: '16px'
                }}>🚚</span>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1px'}}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Driver</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{me.firstName || 'Driver'} {me.lastName || ''}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
              {/* Premium Theme Toggle */}
              <button
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '30px',
                  background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '15px',
                  border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: theme === 'dark' ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.1)',
                  padding: 0,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: theme === 'dark' ? '32px' : '4px',
                  transform: 'translateY(-50%)',
                  width: '22px',
                  height: '22px',
                  background: theme === 'dark' ? 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  borderRadius: '50%',
                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  {theme === 'dark' ? '🌙' : '☀️'}
                </div>
              </button>
              
              <AccountDropdown
                name={`${me.firstName || ''} ${me.lastName || ''}`.trim()}
                email={me.email || ''}
                fallbackLabel="Driver"
                triggerLabel="Open account menu"
              >
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-2)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: availability === 'available' ? '#10b981' : '#ef4444',
                        }}
                      />
                      <div className="text-sm font-semibold">Availability</div>
                    </div>
                    <button
                      className={`btn small ${availability === 'available' ? 'success' : 'secondary'}`}
                      onClick={() => updateAvailability(availability === 'available' ? 'offline' : 'available')}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {availability === 'available' ? 'Online' : 'Offline'}
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-[color:var(--muted)]">Notifications</div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="input small"
                      value={ringtone}
                      onChange={(e) => {
                        setRingtone(e.target.value)
                        storeSoundPrefs(soundEnabled, e.target.value)
                      }}
                      style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }}
                    >
                      <option value="shopify">Shopify</option>
                      <option value="bell">Bell</option>
                      <option value="ping">Ping</option>
                      <option value="knock">Knock</option>
                      <option value="beep">Beep</option>
                    </select>
                    <button className="btn small secondary" onClick={playPreview} style={{ fontSize: '11px', padding: '4px 10px' }}>
                      Test
                    </button>
                  </div>
                </div>
                <DropdownMenuSeparator className="mx-0 my-2 bg-[color:var(--border)]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="rounded-2xl px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault()
                      navigate('/driver/profile')
                    }}
                  >
                    <UserPen size={16} strokeWidth={2} className="opacity-70" aria-hidden="true" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-2xl px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault()
                      navigate('/driver/payout')
                    }}
                  >
                    <Wallet size={16} strokeWidth={2} className="opacity-70" aria-hidden="true" />
                    <span>Payout</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-2xl px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault()
                      navigate('/driver/closings')
                    }}
                  >
                    <FileText size={16} strokeWidth={2} className="opacity-70" aria-hidden="true" />
                    <span>Closings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-2xl px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault()
                      navigate('/driver/my-stock')
                    }}
                  >
                    <Boxes size={16} strokeWidth={2} className="opacity-70" aria-hidden="true" />
                    <span>My Stock</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-2xl px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault()
                      setShowPassModal(true)
                    }}
                  >
                    <KeyRound size={16} strokeWidth={2} className="opacity-70" aria-hidden="true" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="mx-0 my-2 bg-[color:var(--border)]" />
                <DropdownMenuItem
                  className="rounded-2xl px-3 py-3 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                  onSelect={(e) => {
                    e.preventDefault()
                    doLogout()
                  }}
                >
                  <LogOut size={16} strokeWidth={2} aria-hidden="true" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </AccountDropdown>
            </div>
          </div>
        )}
        <div
          className={`container ${location.pathname.includes('/inbox/whatsapp') ? 'edge-to-edge' : ''}`}
        >
          <Outlet />
        </div>
      </div>
      {tabsVisible && (
        <nav
          className="mobile-tabs"
          role="navigation"
          aria-label="Primary"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            gap: 0,
            justifyContent: 'flex-start',
          }}
        >
          <style>{'.mobile-tabs::-webkit-scrollbar{display:none}'}</style>
          {mobileTabs.map((tab) => {
            const isMe = tab.to.endsWith('/me')
            const meBadge = isMe && levelIdx > 1 ? `L${levelIdx}` : ''
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/driver'}
                className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
                style={{
                  padding: '6px 4px',
                  flex: '0 0 auto',
                  minWidth: 58,
                  maxWidth: 80,
                  width: `${100 / Math.min(mobileTabs.length, 6)}vw`,
                }}
              >
                <span className="icon" style={{position:'relative'}}>
                  {React.cloneElement(tab.icon, { width: 20, height: 20 })}
                </span>
                <span style={{ fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tab.label}
                </span>
                {isMe && meBadge && (
                  <span className="badge" style={{ marginLeft: 4, fontSize: 8, padding: '1px 4px' }}>{meBadge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>
      )}
      {/* Password Change Modal */}
      {showPassModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPassModal(false)
          }}
        >
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700}}>Change Password</h3>
            <form onSubmit={handlePasswordChange} style={{display: 'grid', gap: '12px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600}}>Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600}}>New Password</label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600}}>Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowPassModal(false)}
                  style={{flex: 1}}
                  disabled={changingPass}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  style={{flex: 1}}
                  disabled={changingPass}
                >
                  {changingPass ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
