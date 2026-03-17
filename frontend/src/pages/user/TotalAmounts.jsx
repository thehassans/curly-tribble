import React, { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../../api'

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0))
  } catch {
    return `${currency || 'AED'} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  }
}

function SummaryStat({ label, value, tone }) {
  const tones = {
    blue: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.18)', color: '#1d4ed8' },
    green: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.18)', color: '#047857' },
    amber: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.18)', color: '#b45309' },
    violet: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.18)', color: '#7c3aed' },
    pink: { bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.18)', color: '#be185d' },
    slate: { bg: 'rgba(15,23,42,0.06)', border: 'rgba(148,163,184,0.18)', color: 'var(--text)' },
  }
  const t = tones[tone] || tones.slate
  return (
    <div
      className="card"
      style={{
        padding: 16,
        borderRadius: 18,
        border: `1px solid ${t.border}`,
        background: t.bg,
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: t.color, lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function MetricItem({ label, value, accent = '#0f172a' }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid rgba(148,163,184,0.18)',
        background: 'rgba(255,255,255,0.02)',
        display: 'grid',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: accent, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  )
}

export default function TotalAmounts() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await apiGet('/api/users/total-amounts')
      setRows(Array.isArray(res?.countries) ? res.countries : [])
      setSummary(res?.summary || null)
      setError('')
    } catch (err) {
      setRows([])
      setSummary(null)
      setError(err?.message || 'Failed to load total amounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => String(row?.country || '').toLowerCase().includes(q))
  }, [rows, query])

  const cardSummary = useMemo(() => {
    const src = summary || {
      totalAmount: 0,
      deliveredAmount: 0,
      agentAmount: 0,
      dropshipperAmount: 0,
      driverTotalAmount: 0,
      onlineOrderAmount: 0,
    }
    return [
      { label: 'All Orders Total', value: formatMoney(src.totalAmount, 'AED'), tone: 'blue' },
      { label: 'Delivered Amount', value: formatMoney(src.deliveredAmount, 'AED'), tone: 'green' },
      { label: 'Agent Amount', value: formatMoney(src.agentAmount, 'AED'), tone: 'amber' },
      { label: 'Dropshipper Amount', value: formatMoney(src.dropshipperAmount, 'AED'), tone: 'violet' },
      { label: 'Driver Amount', value: formatMoney(src.driverTotalAmount, 'AED'), tone: 'pink' },
      { label: 'Online Order Amount', value: formatMoney(src.onlineOrderAmount, 'AED'), tone: 'slate' },
    ]
  }, [summary])

  return (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div className="page-header" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="page-title gradient heading-blue">Total Amount</div>
          <div className="page-subtitle">Country-wise totals for all orders, delivered orders, agents, dropshippers, drivers, and online orders.</div>
        </div>
        <button className="btn secondary" type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error ? <div className="card error">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
        {cardSummary.map((item) => (
          <SummaryStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="card-header">
          <div className="card-title">Search Country</div>
          <div className="helper">{filteredRows.length} countries</div>
        </div>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by country name"
        />
      </div>

      {loading ? (
        <div className="card"><div className="section">Loading total amounts...</div></div>
      ) : filteredRows.length === 0 ? (
        <div className="card"><div className="section">No country totals found.</div></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredRows.map((row) => (
            <div
              key={row.country}
              className="card"
              style={{
                display: 'grid',
                gap: 12,
                padding: 16,
                borderRadius: 20,
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(148,163,184,0.04))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>{row.country || 'Other'}</div>
                  <div className="helper">Primary currency: {row.currency || 'AED'}</div>
                </div>
                <span className="chip" style={{ fontWeight: 800 }}>{formatMoney(row.totalAmount, row.currency)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                <MetricItem label="Total Amount" value={formatMoney(row.totalAmount, row.currency)} accent="#1d4ed8" />
                <MetricItem label="Delivered Amount" value={formatMoney(row.deliveredAmount, row.currency)} accent="#047857" />
                <MetricItem label="Agent Amount" value={formatMoney(row.agentAmount, row.currency)} accent="#b45309" />
                <MetricItem label="Agent Delivered Amount" value={formatMoney(row.agentDeliveredAmount, row.currency)} accent="#d97706" />
                <MetricItem label="Dropshipper Amount" value={formatMoney(row.dropshipperAmount, row.currency)} accent="#7c3aed" />
                <MetricItem label="Dropshipper Delivered Amount" value={formatMoney(row.dropshipperDeliveredAmount, row.currency)} accent="#8b5cf6" />
                <MetricItem label="Driver Total Amount" value={formatMoney(row.driverTotalAmount, row.currency)} accent="#be185d" />
                <MetricItem label="Driver Delivered Amount" value={formatMoney(row.driverDeliveredAmount, row.currency)} accent="#db2777" />
                <MetricItem label="Online Order Amount" value={formatMoney(row.onlineOrderAmount, row.currency)} accent="#0f766e" />
                <MetricItem label="Online Order Delivered Amount" value={formatMoney(row.onlineOrderDeliveredAmount, row.currency)} accent="#0f766e" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
