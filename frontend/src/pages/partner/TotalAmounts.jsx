import React, { useEffect, useState } from 'react'
import { apiGet } from '../../api'
import { formatMoney, heroStyle, pageWrapStyle, panelStyle, sectionTitle, statCardStyle } from './shared.jsx'

export default function PartnerTotalAmounts() {
  const [data, setData] = useState({ summary: null, months: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await apiGet('/api/partners/me/total-amounts')
        if (active) setData({ summary: res?.summary || null, months: Array.isArray(res?.months) ? res.months : [] })
      } catch {
        if (active) setData({ summary: null, months: [] })
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const currency = data?.summary?.currency || 'SAR'
  const purchasing = data?.summary?.purchasing || {}
  const profitLoss = data?.summary?.profitLoss || {}
  const netAccent = profitLoss?.status === 'loss' || Number(profitLoss?.netAmount || 0) < 0 ? '#dc2626' : '#059669'

  return (
    <div style={pageWrapStyle()}>
      <div style={heroStyle()}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.78)' }}>Total amounts</div>
          <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>Country amount intelligence</div>
          <div style={{ color: 'rgba(226,232,240,0.84)', maxWidth: 720, fontSize: 15 }}>Review countrywise order movement, purchasing load, and net profit or loss in one place.</div>
        </div>
      </div>
      <section style={panelStyle()}>
        {sectionTitle('Summary', 'Live totals for your partnership country.')}
        {loading ? <div style={{ color: '#64748b', marginTop: 16 }}>Loading totals…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
            <div style={statCardStyle('#0f172a')}><div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Total Orders</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950 }}>{Number(data?.summary?.totalOrders || 0)}</div></div>
            <div style={statCardStyle('#475569')}><div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Delivered Orders</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#0f172a' }}>{Number(data?.summary?.deliveredOrders || 0)}</div></div>
            <div style={statCardStyle('#dc2626')}><div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>Cancelled Orders</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#991b1b' }}>{Number(data?.summary?.cancelledOrders || 0)}</div></div>
            <div style={statCardStyle('#2563eb')}><div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>Total Amount</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: '#1d4ed8' }}>{formatMoney(data?.summary?.totalAmount, currency)}</div></div>
            <div style={statCardStyle('#059669')}><div style={{ fontSize: 13, color: '#065f46', fontWeight: 700 }}>Delivered Amount</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: '#065f46' }}>{formatMoney(data?.summary?.deliveredAmount, currency)}</div></div>
            <div style={statCardStyle('#dc2626')}><div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>Cancelled Amount</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: '#991b1b' }}>{formatMoney(data?.summary?.cancelledAmount, currency)}</div></div>
          </div>
        )}
      </section>
      <section style={panelStyle()}>
        {sectionTitle('Purchasing', 'Countrywise stock purchasing, remaining stock, and delivered stock view.')}
        {loading ? <div style={{ color: '#64748b', marginTop: 16 }}>Loading purchasing…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
            <div style={statCardStyle('#1d4ed8')}><div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>Total Stock Purchased Amount</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: '#1d4ed8' }}>{formatMoney(purchasing?.totalStockPurchasedAmount, currency)}</div></div>
            <div style={statCardStyle('#0f172a')}><div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Stock Purchase Quantity</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950 }}>{Number(purchasing?.totalStockPurchasedQty || 0)}</div></div>
            <div style={statCardStyle('#7c3aed')}><div style={{ fontSize: 13, color: '#6d28d9', fontWeight: 700 }}>Current Stock Quantity</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#6d28d9' }}>{Number(purchasing?.totalStockQuantity || 0)}</div></div>
            <div style={statCardStyle('#059669')}><div style={{ fontSize: 13, color: '#065f46', fontWeight: 700 }}>Stock Delivered</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#065f46' }}>{Number(purchasing?.stockDeliveredQty || 0)}</div></div>
            <div style={statCardStyle('#475569')}><div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Orders</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950 }}>{Number(purchasing?.totalOrders || 0)}</div></div>
          </div>
        )}
      </section>
      <section style={panelStyle()}>
        {sectionTitle('Net profit or loss', 'Delivered revenue minus agent, driver, dropshipper, purchasing, and expense costs.')}
        {loading ? <div style={{ color: '#64748b', marginTop: 16 }}>Loading profit and loss…</div> : (
          <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div style={statCardStyle('#0f172a')}><div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>Total Order Delivered</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950 }}>{Number(profitLoss?.deliveredOrders || 0)}</div></div>
              <div style={statCardStyle('#dc2626')}><div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>Total Order Cancelled</div><div style={{ marginTop: 10, fontSize: 28, fontWeight: 950, color: '#991b1b' }}>{Number(profitLoss?.cancelledOrders || 0)}</div></div>
              <div style={statCardStyle('#059669')}><div style={{ fontSize: 13, color: '#065f46', fontWeight: 700 }}>Amount of Order Delivered</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: '#065f46' }}>{formatMoney(profitLoss?.deliveredAmount, currency)}</div></div>
              <div style={statCardStyle(netAccent)}><div style={{ fontSize: 13, color: netAccent, fontWeight: 700 }}>{profitLoss?.status === 'loss' || Number(profitLoss?.netAmount || 0) < 0 ? 'Net Loss' : 'Net Profit'}</div><div style={{ marginTop: 10, fontSize: 22, fontWeight: 950, color: netAccent }}>{formatMoney(Math.abs(Number(profitLoss?.netAmount || 0)), currency)}</div></div>
            </div>
            <div style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 22, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Agent Commission</div><div style={{ marginTop: 8, fontWeight: 900, color: '#0f172a' }}>{formatMoney(profitLoss?.agentCommission, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Drivers Commission</div><div style={{ marginTop: 8, fontWeight: 900, color: '#0f172a' }}>{formatMoney(profitLoss?.driverCommission, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Dropshipper Commission</div><div style={{ marginTop: 8, fontWeight: 900, color: '#0f172a' }}>{formatMoney(profitLoss?.dropshipperCommission, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Purchasing</div><div style={{ marginTop: 8, fontWeight: 900, color: '#0f172a' }}>{formatMoney(profitLoss?.purchasing, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Expense</div><div style={{ marginTop: 8, fontWeight: 900, color: '#0f172a' }}>{formatMoney(profitLoss?.expense, currency)}</div></div>
            </div>
          </div>
        )}
      </section>
      <section style={panelStyle()}>
        {sectionTitle('Monthly breakdown', 'A clean view of how totals move month over month.')}
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {data.months.map((row) => (
            <div key={`${row.year}-${row.month}`} style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 18, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Month</div><div style={{ marginTop: 8, color: '#0f172a', fontWeight: 900 }}>{`${String(row.month).padStart(2, '0')}/${row.year}`}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Orders</div><div style={{ marginTop: 8, color: '#0f172a', fontWeight: 900 }}>{Number(row.totalOrders || 0)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Total</div><div style={{ marginTop: 8, color: '#0f172a', fontWeight: 900 }}>{formatMoney(row.totalAmount, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Delivered</div><div style={{ marginTop: 8, color: '#065f46', fontWeight: 900 }}>{formatMoney(row.deliveredAmount, currency)}</div></div>
              <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Cancelled</div><div style={{ marginTop: 8, color: '#991b1b', fontWeight: 900 }}>{formatMoney(row.cancelledAmount, currency)}</div></div>
            </div>
          ))}
          {!data.months.length && !loading ? <div style={{ color: '#64748b' }}>No monthly totals available yet.</div> : null}
        </div>
      </section>
    </div>
  )
}
