import React, { useEffect, useState } from 'react'
import MetricCard from '../../components/MetricCard.jsx'
import { apiGet } from '../../api.js'
import { Link } from 'react-router-dom'

export default function AdminDashboard(){
  const [users, setUsers] = useState([])
  useEffect(()=>{
    (async()=>{
      try{
        const { users: rows } = await apiGet('/api/users?role=user', { skipCache: true })
        setUsers(Array.isArray(rows) ? rows : [])
      }catch(_e){}
    })()
  },[])

  const totalUsers = users.length
  const withDomains = users.filter((user) => String(user?.customDomain || '').trim()).length
  const withBranding = users.filter((user) => String(user?.workspaceBranding?.title || user?.workspaceBranding?.companyName || '').trim()).length

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-title gradient heading-blue">Admin Dashboard</div>
          <div className="page-subtitle">Overview of user workspaces and separate business panels</div>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12}}>
        <MetricCard title="Total Users" value={totalUsers} icon="👥" />
        <MetricCard title="Branded Workspaces" value={withBranding} icon="🎨" />
        <MetricCard title="Custom Domains" value={withDomains} icon="�" />
      </div>

      <div className="theme-card" style={{ marginTop: 18, padding: 20, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Recent User Workspaces</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Use Settings to manage business identity, logo, title, and favicon for each workspace.</div>
          </div>
          <Link to="/admin/settings" className="btn">Open Settings</Link>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {users.slice(0, 8).map((user) => (
            <div key={user._id} className="theme-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{user.businessName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Workspace'}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {user.customDomain ? <span className="btn secondary" style={{ minHeight: 0, padding: '6px 10px' }}>{user.customDomain}</span> : null}
                <Link to="/admin/settings" className="btn secondary">Manage</Link>
              </div>
            </div>
          ))}
          {!users.length && <div style={{ color: 'var(--muted)' }}>No user workspaces created yet.</div>}
        </div>
      </div>
    </div>
  )
}
