import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE, apiGet } from '../../api.js'

function formatMoney(value, currency = 'PKR') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function pageStyle() {
  return {
    display: 'grid',
    gap: 18,
    padding: 'clamp(12px, 2vw, 22px)',
  }
}

function sectionStyle() {
  return {
    borderRadius: 24,
    border: '1px solid rgba(148,163,184,0.16)',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 18px 48px rgba(15,23,42,0.08)',
    padding: 'clamp(18px, 2.2vw, 24px)',
  }
}

export default function AgentClosings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const financeBase = `${String(API_BASE || '/api').replace(/\/$/, '')}/finance`

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await apiGet('/api/finance/agent-remittances?limit=100')
        if (!active) return
        setItems(Array.isArray(response?.remittances) ? response.remittances : [])
        setError('')
      } catch (err) {
        if (!active) return
        setItems([])
        setError(err?.message || 'Failed to load closings')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const closings = useMemo(
    () => items.filter((item) => String(item?.status || '').toLowerCase() === 'sent').sort((a, b) => new Date(b?.sentAt || b?.createdAt || 0) - new Date(a?.sentAt || a?.createdAt || 0)),
    [items]
  )

  return (
    <div style={pageStyle()}>
      <section style={{ ...sectionStyle(), background: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,41,59,0.94))', color: '#f8fafc' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(226,232,240,0.78)', fontWeight: 800 }}>Closings</div>
          <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>Agent closing statements</div>
          <div style={{ color: 'rgba(226,232,240,0.84)', maxWidth: 760, fontSize: 15 }}>
            Review paid commission closings, payment timestamps, and open the saved PDF statement for each payout.
          </div>
        </div>
      </section>

      <section style={sectionStyle()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ borderRadius: 20, padding: 18, border: '1px solid rgba(59,130,246,0.16)', background: 'rgba(59,130,246,0.05)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Paid Closings</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#0f172a' }}>{closings.length}</div>
          </div>
          <div style={{ borderRadius: 20, padding: 18, border: '1px solid rgba(5,150,105,0.16)', background: 'rgba(5,150,105,0.05)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Latest Paid At</div>
            <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{formatDateTime(closings[0]?.sentAt || closings[0]?.createdAt)}</div>
          </div>
        </div>
      </section>

      <section style={sectionStyle()}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Closing history</div>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>Each paid commission record keeps its downloadable closing PDF.</div>
          </div>

          {loading ? <div style={{ color: '#64748b' }}>Loading closings…</div> : null}
          {!loading && error ? <div style={{ color: '#dc2626' }}>{error}</div> : null}

          {!loading && !error && !closings.length ? (
            <div style={{ borderRadius: 22, border: '1px dashed rgba(148,163,184,0.28)', padding: 24, color: '#64748b', background: 'rgba(248,250,252,0.84)' }}>
              No paid closing statements are available yet.
            </div>
          ) : null}

          {!loading && !error
            ? closings.map((item) => (
                <div key={item._id} style={{ borderRadius: 22, border: '1px solid rgba(148,163,184,0.16)', padding: 18, background: '#fff', display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{formatMoney(item?.amount, item?.currency || 'PKR')}</span>
                        <span style={{ borderRadius: 999, padding: '4px 10px', background: 'rgba(5,150,105,0.10)', color: '#047857', fontSize: 12, fontWeight: 800 }}>Paid</span>
                      </div>
                      <div style={{ color: '#475569', fontSize: 14 }}>Paid at {formatDateTime(item?.sentAt || item?.createdAt)}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Rate: {Number(item?.commissionRate || 0)}% {item?.totalOrderValueAED ? `• Order value AED ${Number(item.totalOrderValueAED || 0).toFixed(2)}` : ''}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Note: {item?.note || '-'}</div>
                    </div>
                    <a
                      href={`${financeBase}/agent-remittances/${item._id}/download-receipt`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: 'none',
                        borderRadius: 16,
                        padding: '11px 16px',
                        background: '#0f172a',
                        color: '#fff',
                        fontWeight: 800,
                      }}
                    >
                      Open PDF
                    </a>
                  </div>
                </div>
              ))
            : null}
        </div>
      </section>
    </div>
  )
}
