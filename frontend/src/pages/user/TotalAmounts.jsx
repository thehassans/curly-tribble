import React, { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../../api'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey) {
  const safe = `${monthKey || currentMonthKey()}-01T00:00:00Z`
  const date = new Date(safe)
  if (Number.isNaN(date.getTime())) return monthKey || ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

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

function formatCount(value) {
  return Number(value || 0).toLocaleString()
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
    <div className="card" style={{ padding: 16, borderRadius: 18, border: `1px solid ${t.border}`, background: t.bg, display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: t.color, lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function BreakdownRow({ title, accent, fields }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.15)', background: `${accent}12`, color: accent, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 0 }}>
        {fields.map((field) => (
          <div key={field.label} style={{ padding: '12px 14px', borderRight: '1px solid rgba(148,163,184,0.12)', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>{field.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: field.color || 'var(--text)' }}>{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CountryBlock({ row, summary = false }) {
  const moneyCode = row?.currency || 'AED'
  return (
    <div className="card" style={{ display: 'grid', gap: 12, padding: 16, borderRadius: 22, border: summary ? '1px solid rgba(59,130,246,0.28)' : '1px solid rgba(148,163,184,0.18)', background: summary ? 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(255,255,255,0.03))' : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(148,163,184,0.04))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>{row?.country || 'Other'}</div>
          <div className="helper">Primary currency: {moneyCode}</div>
        </div>
        <span className="chip" style={{ fontWeight: 900 }}>{formatMoney(row?.totalAmount, moneyCode)}</span>
      </div>

      <BreakdownRow
        title="All Orders"
        accent="#1d4ed8"
        fields={[
          { label: 'Total Amount', value: formatMoney(row?.totalAmount, moneyCode), color: '#1d4ed8' },
          { label: 'Delivered Amount', value: formatMoney(row?.deliveredAmount, moneyCode), color: '#047857' },
          { label: 'Total Orders', value: formatCount(row?.totalOrders) },
          { label: 'Delivered Orders', value: formatCount(row?.deliveredOrders) },
          { label: 'Cancelled Orders', value: formatCount(row?.cancelledOrders) },
        ]}
      />

      <BreakdownRow
        title="Agent"
        accent="#b45309"
        fields={[
          { label: 'Agent Total Amount', value: formatMoney(row?.agentAmount, moneyCode), color: '#b45309' },
          { label: 'Agent Delivered Amount', value: formatMoney(row?.agentDeliveredAmount, moneyCode), color: '#d97706' },
          { label: 'Agent Total Order', value: formatCount(row?.agentTotalOrders) },
          { label: 'Agent Delivered Order', value: formatCount(row?.agentDeliveredOrders) },
          { label: 'Agent Cancelled Order', value: formatCount(row?.agentCancelledOrders) },
        ]}
      />

      <BreakdownRow
        title="Dropshipper"
        accent="#7c3aed"
        fields={[
          { label: 'Dropshipper Total Amount', value: formatMoney(row?.dropshipperAmount, moneyCode), color: '#7c3aed' },
          { label: 'Dropshipper Delivered Amount', value: formatMoney(row?.dropshipperDeliveredAmount, moneyCode), color: '#8b5cf6' },
          { label: 'Dropshipper Total Order', value: formatCount(row?.dropshipperTotalOrders) },
          { label: 'Dropshipper Delivered Order', value: formatCount(row?.dropshipperDeliveredOrders) },
          { label: 'Dropshipper Cancelled Order', value: formatCount(row?.dropshipperCancelledOrders) },
        ]}
      />

      <BreakdownRow
        title="Driver"
        accent="#be185d"
        fields={[
          { label: 'Driver Total Amount', value: formatMoney(row?.driverTotalAmount, moneyCode), color: '#be185d' },
          { label: 'Driver Delivered Amount', value: formatMoney(row?.driverDeliveredAmount, moneyCode), color: '#db2777' },
          { label: 'Driver Total Order', value: formatCount(row?.driverTotalOrders) },
          { label: 'Driver Delivered Order', value: formatCount(row?.driverDeliveredOrders) },
          { label: 'Driver Cancelled Order', value: formatCount(row?.driverCancelledOrders) },
        ]}
      />

      <BreakdownRow
        title="Online"
        accent="#0f766e"
        fields={[
          { label: 'Online Total Amount', value: formatMoney(row?.onlineOrderAmount, moneyCode), color: '#0f766e' },
          { label: 'Online Delivered Amount', value: formatMoney(row?.onlineOrderDeliveredAmount, moneyCode), color: '#0f766e' },
          { label: 'Online Total Orders', value: formatCount(row?.onlineTotalOrders) },
          { label: 'Online Paid Orders', value: formatCount(row?.onlinePaidOrders) },
          { label: 'Online Delivered Orders', value: formatCount(row?.onlineDeliveredOrders) },
          { label: 'Online Cancelled Orders', value: formatCount(row?.onlineCancelledOrders) },
        ]}
      />
    </div>
  )
}

export default function TotalAmounts() {
  const [loading, setLoading] = useState(true)
  const [closingBusy, setClosingBusy] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(currentMonthKey())
  const [monthLabel, setMonthLabel] = useState(formatMonthLabel(currentMonthKey()))
  const [source, setSource] = useState('live')
  const [closing, setClosing] = useState(null)
  const [useLive, setUseLive] = useState(false)
  const [note, setNote] = useState(`Closing of ${formatMonthLabel(currentMonthKey())}`)

  async function load({ keepLive = useLive, selectedMonth = month } = {}) {
    setLoading(true)
    try {
      const res = await apiGet(`/api/users/total-amounts?month=${encodeURIComponent(selectedMonth)}${keepLive ? '&live=1' : ''}`)
      setRows(Array.isArray(res?.countries) ? res.countries : [])
      setSummary(res?.summary || null)
      setHistory(Array.isArray(res?.history) ? res.history : [])
      setMonth(String(res?.monthKey || selectedMonth || currentMonthKey()))
      setMonthLabel(String(res?.monthLabel || formatMonthLabel(selectedMonth)))
      setSource(String(res?.source || 'live'))
      setClosing(res?.closing || null)
      setError('')
    } catch (err) {
      setRows([])
      setSummary(null)
      setHistory([])
      setClosing(null)
      setError(err?.message || 'Failed to load total amounts')
    } finally {
      setLoading(false)
    }
  }

  async function closeMonth() {
    setClosingBusy(true)
    try {
      const res = await apiPost('/api/users/total-amounts/close-month', {
        month,
        note: note || `Closing of ${monthLabel}`,
      })
      setRows(Array.isArray(res?.countries) ? res.countries : [])
      setSummary(res?.summary || null)
      setHistory(Array.isArray(res?.history) ? res.history : [])
      setMonth(String(res?.monthKey || month))
      setMonthLabel(String(res?.monthLabel || formatMonthLabel(month)))
      setSource(String(res?.source || 'closed'))
      setClosing(res?.closing || null)
      setUseLive(false)
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to close month')
    } finally {
      setClosingBusy(false)
    }
  }

  useEffect(() => {
    load({ keepLive: useLive, selectedMonth: month })
  }, [month, useLive])

  useEffect(() => {
    setNote(`Closing of ${formatMonthLabel(month)}`)
  }, [month])

  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => String(row?.country || '').toLowerCase().includes(q))
  }, [rows, query])

  const cards = useMemo(() => {
    const src = summary || {
      totalAmount: 0,
      deliveredAmount: 0,
      totalOrders: 0,
      cancelledOrders: 0,
      agentAmount: 0,
      onlineTotalOrders: 0,
    }
    return [
      { label: 'All Countries Total', value: formatMoney(src.totalAmount, 'AED'), tone: 'blue' },
      { label: 'Delivered Amount', value: formatMoney(src.deliveredAmount, 'AED'), tone: 'green' },
      { label: 'Total Orders', value: formatCount(src.totalOrders), tone: 'amber' },
      { label: 'Cancelled Orders', value: formatCount(src.cancelledOrders), tone: 'violet' },
      { label: 'Agent Amount', value: formatMoney(src.agentAmount, 'AED'), tone: 'pink' },
      { label: 'Online Orders', value: formatCount(src.onlineTotalOrders), tone: 'slate' },
    ]
  }, [summary])

  return (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div className="page-header" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="page-title gradient heading-blue">Total Amount</div>
          <div className="page-subtitle">Monthly country-wise closing for total, agent, dropshipper, driver, and online orders with order counts and history.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" type="button" onClick={() => load({ keepLive: useLive, selectedMonth: month })} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? <div className="card error">{error}</div> : null}

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Month</span>
            <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value || currentMonthKey())} />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Search Country</span>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by country name" />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Closing Note</span>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write closing note" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={`btn ${useLive ? 'secondary' : 'action-btn'}`} type="button" onClick={() => setUseLive(false)}>
            Closed / Latest Saved
          </button>
          <button className={`btn ${useLive ? 'action-btn' : 'secondary'}`} type="button" onClick={() => setUseLive(true)}>
            Live Month
          </button>
          <button className="btn action-btn" type="button" onClick={closeMonth} disabled={closingBusy}>
            {closingBusy ? 'Closing...' : `Close ${monthLabel}`}
          </button>
          <span className="chip" style={{ fontWeight: 800 }}>{source === 'closed' ? 'Closed Month View' : 'Live Month View'}</span>
          {closing?.closedAt ? <span className="helper">Closed at {formatDateTime(closing.closedAt)}</span> : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
        {cards.map((item) => (
          <SummaryStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </div>

      {summary ? <CountryBlock row={{ ...summary, country: 'All Countries', currency: 'AED' }} summary /> : null}

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="card-header">
          <div className="card-title">Monthly Closing History</div>
          <div className="helper">{history.length} months saved</div>
        </div>
        {history.length === 0 ? (
          <div className="helper">No month closing history yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {history.map((item) => (
              <div key={item.monthKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{item.monthLabel || item.monthKey}</div>
                  <div className="helper">{item.note || 'Closing saved'}{item.closedAt ? ` • ${formatDateTime(item.closedAt)}` : ''}</div>
                </div>
                <button className="btn secondary" type="button" onClick={() => { setMonth(item.monthKey); setUseLive(false) }}>
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="section">Loading total amounts...</div></div>
      ) : filteredRows.length === 0 ? (
        <div className="card"><div className="section">No country totals found for {monthLabel}.</div></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredRows.map((row) => (
            <CountryBlock key={row.country} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
