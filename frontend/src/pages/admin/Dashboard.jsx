import React, { useEffect, useState } from 'react'
import { apiGet } from '../../api.js'
import { Link, useNavigate } from 'react-router-dom'

function StatBlock({ label, value, sub }) {
  return (
    <div style={{ padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--panel)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--fg)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('/api/users?role=user', { skipCache: true })
      .then(({ users: rows }) => setUsers(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const withDomains = users.filter(u => String(u?.customDomain || '').trim()).length
  const withBranding = users.filter(u => String(u?.workspaceBranding?.companyName || u?.workspaceBranding?.title || '').trim()).length

  return (
    <div style={{ display: 'grid', gap: 28 }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Overview of all user workspaces</div>
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Workspace
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatBlock label="Total Workspaces" value={loading ? '—' : users.length} sub="All time" />
        <StatBlock label="Custom Domains" value={loading ? '—' : withDomains} sub={`${users.length - withDomains} without`} />
        <StatBlock label="Branded" value={loading ? '—' : withBranding} sub="Custom branding set" />
      </div>

      {/* Workspace list */}
      <div style={{ display: 'grid', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Recent Workspaces</span>
          <Link to="/admin/settings" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Manage all →</Link>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>No workspaces yet</div>
            <button
              onClick={() => navigate('/admin/users')}
              style={{ height: 34, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Create first workspace
            </button>
          </div>
        ) : (
          users.slice(0, 8).map((u, i) => (
            <div
              key={u._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
                borderBottom: i < Math.min(users.length, 8) - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'var(--panel-2)', border: '1px solid var(--border)',
                display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: 'var(--muted)',
              }}>
                {(u.businessName || u.firstName || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.businessName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Workspace'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}{u.customDomain ? ` · ${u.customDomain}` : ''}
                </div>
              </div>
              <Link
                to={`/admin/settings?ownerId=${u._id}`}
                style={{ height: 28, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--fg)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
              >
                Manage
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
