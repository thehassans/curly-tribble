import React, { useEffect, useMemo, useState } from 'react'
import { apiGet, apiOpenBlob } from '../../api.js'

function formatMoney(value, currency = 'SAR') {
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
  }
}

function panelStyle() {
  return {
    borderRadius: 24,
    border: '1px solid rgba(148,163,184,0.16)',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 18px 48px rgba(15,23,42,0.08)',
    padding: 'clamp(18px, 2.4vw, 24px)',
  }
}

export default function DriverClosings() {
  const [closings, setClosings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openingId, setOpeningId] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await apiGet('/api/finance/drivers/me/closings')
        if (!active) return
        setClosings(Array.isArray(response?.closings) ? response.closings : [])
        setError('')
      } catch (err) {
        if (!active) return
        setClosings([])
        setError(err?.message || 'Failed to load closings')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const totals = useMemo(() => {
    return closings.reduce(
      (acc, item) => {
        acc.count += 1
        acc.total += Number(item?.amount || 0)
        if (!acc.latestPaidAt || new Date(item?.paidAt || 0) > new Date(acc.latestPaidAt || 0)) {
          acc.latestPaidAt = item?.paidAt || acc.latestPaidAt
        }
        return acc
      },
      { count: 0, total: 0, latestPaidAt: '' }
    )
  }, [closings])

  return (
    <div style={pageStyle()}>
      <section style={{ ...panelStyle(), background: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,41,59,0.94))', color: '#f8fafc' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(226,232,240,0.78)', fontWeight: 800 }}>Closings</div>
          <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>Driver closing statements</div>
          <div style={{ color: 'rgba(226,232,240,0.84)', maxWidth: 760, fontSize: 15 }}>
            Review commission closings paid by your owner or partner, with the saved PDF statement for every paid closing.
          </div>
        </div>
      </section>

      <section style={panelStyle()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ borderRadius: 20, padding: 18, border: '1px solid rgba(59,130,246,0.16)', background: 'rgba(59,130,246,0.05)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Paid Closings</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#0f172a' }}>{totals.count}</div>
          </div>
          <div style={{ borderRadius: 20, padding: 18, border: '1px solid rgba(5,150,105,0.16)', background: 'rgba(5,150,105,0.05)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Last Paid At</div>
            <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{formatDateTime(totals.latestPaidAt)}</div>
          </div>
        </div>
      </section>

      <section style={panelStyle()}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Closing history</div>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>Each entry shows who paid the closing, the covered range, and the linked PDF statement.</div>
          </div>

          {loading ? <div style={{ color: '#64748b' }}>Loading closings…</div> : null}
          {!loading && error ? <div style={{ color: '#dc2626' }}>{error}</div> : null}

          {!loading && !error && !closings.length ? (
            <div style={{ borderRadius: 22, border: '1px dashed rgba(148,163,184,0.28)', padding: 24, color: '#64748b', background: 'rgba(248,250,252,0.84)' }}>
              No closing statements are available yet.
            </div>
          ) : null}

          {!loading && !error
            ? closings.map((item) => {
                const payerLabel = item?.source === 'partner' ? 'Partner paid' : 'Owner paid'
                return (
                  <div key={item.id} style={{ borderRadius: 22, border: '1px solid rgba(148,163,184,0.16)', padding: 18, background: '#fff', display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{formatMoney(item?.amount, item?.currency || 'SAR')}</span>
                          <span style={{ borderRadius: 999, padding: '4px 10px', background: 'rgba(5,150,105,0.10)', color: '#047857', fontSize: 12, fontWeight: 800 }}>Paid</span>
                          <span style={{ borderRadius: 999, padding: '4px 10px', background: 'rgba(59,130,246,0.10)', color: '#1d4ed8', fontSize: 12, fontWeight: 800 }}>{payerLabel}</span>
                        </div>
                        <div style={{ color: '#475569', fontSize: 14 }}>Paid at {formatDateTime(item?.paidAt)}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>Range: {formatDateTime(item?.rangeStart)} to {formatDateTime(item?.rangeEnd)}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>Orders included: {Number(item?.orderCount || 0)} • Model: {item?.paymentType === 'salary' ? 'Salary' : 'Per order'}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>Note: {item?.note || '-'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setOpeningId(String(item.id || ''))
                            await apiOpenBlob(`/api/finance/drivers/me/closings/${item.source}/${item.id}/download`)
                          } catch (err) {
                            setError(err?.message || 'Failed to open PDF')
                          } finally {
                            setOpeningId('')
                          }
                        }}
                        disabled={openingId === String(item.id || '')}
                        style={{
                          border: 'none',
                          cursor: openingId === String(item.id || '') ? 'wait' : 'pointer',
                          borderRadius: 16,
                          padding: '11px 16px',
                          background: '#0f172a',
                          color: '#fff',
                          fontWeight: 800,
                        }}
                      >
                        {openingId === String(item.id || '') ? 'Opening...' : 'Open PDF'}
                      </button>
                    </div>
                  </div>
                )
              })
            : null}
        </div>
      </section>
    </div>
  )
}
