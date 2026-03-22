import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import { apiGet, apiPatch, apiPost } from '../../api'
import { formatMoney, heroStyle, inputStyle, metricGridStyle, pageWrapStyle, panelStyle, primaryButtonStyle, secondaryButtonStyle, sectionTitle } from './shared.jsx'

export default function PartnerDriverAmounts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState('')
  const [payAmount, setPayAmount] = useState({})
  const [payModal, setPayModal] = useState(null)
  const [payPreview, setPayPreview] = useState(null)
  const [payPreviewLoading, setPayPreviewLoading] = useState(false)
  const [payPreviewError, setPayPreviewError] = useState('')
  const [editingPayCommissions, setEditingPayCommissions] = useState({})

  async function loadRows() {
    setLoading(true)
    try {
      const res = await apiGet('/api/partners/me/driver-amounts')
      setRows(Array.isArray(res?.drivers) ? res.drivers : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRows() }, [])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.drivers += 1
        acc.delivered += Number(row?.totalDelivered || 0)
        acc.earned += Number(row?.paymentModel === 'salary' ? row?.salaryAmount || 0 : row?.earnedAmount || 0)
        acc.paid += Number(row?.paidAmount || 0)
        acc.pending += Number(row?.pendingPayment || 0)
        return acc
      },
      { drivers: 0, delivered: 0, earned: 0, paid: 0, pending: 0 }
    )
  }, [rows])

  const closePayModal = () => {
    setPayModal(null)
    setPayPreview(null)
    setPayPreviewError('')
    setEditingPayCommissions({})
    setPayPreviewLoading(false)
  }

  const openPayModal = async (row) => {
    const id = String(row?.id || row?._id || '')
    if (!id) return
    setPayModal(row)
    setPayPreview(null)
    setPayPreviewError('')
    setEditingPayCommissions({})
    if (row?.paymentModel === 'salary') return
    setPayPreviewLoading(true)
    try {
      const response = await apiGet(`/api/partners/me/drivers/${id}/commission-preview`)
      const preview = response?.preview || null
      setPayPreview(preview)
      const initial = {}
      ;(preview?.orders || []).forEach((order) => {
        if (order?.id) initial[order.id] = Number(order?.commission || 0)
      })
      setEditingPayCommissions(initial)
    } catch (e) {
      setPayPreviewError(e?.message || 'Failed to load commission preview')
    } finally {
      setPayPreviewLoading(false)
    }
  }

  const getPayCommissionValue = (order) => {
    return Math.max(0, Number(editingPayCommissions?.[order?.id] ?? order?.commission ?? 0) || 0)
  }

  const calculatedAmount = useMemo(() => {
    return (payPreview?.orders || []).reduce((sum, order) => sum + getPayCommissionValue(order), 0)
  }, [payPreview, editingPayCommissions])

  async function confirmPay() {
    const row = payModal
    const id = String(row?.id || row?._id || '')
    if (!id) return
    setPayingId(id)
    try {
      if (row?.paymentModel === 'salary') {
        await apiPost(`/api/partners/me/drivers/${id}/pay`, {
          amount: Number(payAmount[id] || row?.pendingPayment || 0),
        })
      } else {
        const changedOrders = (payPreview?.orders || []).filter(
          (order) => order?.id && Number(getPayCommissionValue(order)) !== Number(order?.commission || 0)
        )
        for (const order of changedOrders) {
          await apiPatch(`/api/partners/me/orders/${order.id}`, {
            driverCommission: getPayCommissionValue(order),
          })
        }
        const refreshed = await apiGet(`/api/partners/me/drivers/${id}/commission-preview`)
        const latestPreview = refreshed?.preview || payPreview
        setPayPreview(latestPreview)
        const latestAmount = (latestPreview?.orders || []).reduce(
          (sum, order) => sum + Math.max(0, Number(order?.commission || 0) || 0),
          0
        )
        if (!latestAmount || latestAmount <= 0) {
          throw new Error('No delivered commission is available to pay')
        }
        await apiPost(`/api/partners/me/drivers/${id}/pay`, { amount: latestAmount })
      }
      closePayModal()
      await loadRows()
    } catch (e) {
      setPayPreviewError(e?.message || 'Failed to complete payout')
    } finally {
      setPayingId('')
    }
  }

  return (
    <div style={pageWrapStyle()}>
      <div style={heroStyle()}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.78)' }}>Driver amounts</div>
          <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 950, letterSpacing: '-0.05em' }}>Driver payout control</div>
          <div style={{ color: 'rgba(226,232,240,0.84)', maxWidth: 720, fontSize: 15 }}>Review assigned, delivered, cancelled, earned, and pending payout amounts per driver.</div>
        </div>
      </div>
      <section style={{ ...panelStyle(), display: 'grid', gap: 14 }}>
        {sectionTitle('Payout summary', 'Track unpaid closings and paid driver commissions across your country scope.')}
        <div style={metricGridStyle()}>
          <div style={{ border: '1px solid rgba(59,130,246,0.16)', borderRadius: 22, padding: 18, background: 'rgba(59,130,246,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Drivers</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 28 }}>{summary.drivers}</div>
          </div>
          <div style={{ border: '1px solid rgba(5,150,105,0.16)', borderRadius: 22, padding: 18, background: 'rgba(5,150,105,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Delivered Orders</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 28, color: '#065f46' }}>{summary.delivered}</div>
          </div>
          <div style={{ border: '1px solid rgba(124,58,237,0.16)', borderRadius: 22, padding: 18, background: 'rgba(124,58,237,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Earned</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 22, color: '#6d28d9' }}>{formatMoney(summary.earned, rows[0]?.currency || 'SAR')}</div>
          </div>
          <div style={{ border: '1px solid rgba(14,165,233,0.16)', borderRadius: 22, padding: 18, background: 'rgba(14,165,233,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Paid</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 22, color: '#0369a1' }}>{formatMoney(summary.paid, rows[0]?.currency || 'SAR')}</div>
          </div>
          <div style={{ border: '1px solid rgba(29,78,216,0.16)', borderRadius: 22, padding: 18, background: 'rgba(29,78,216,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Pending</div>
            <div style={{ marginTop: 8, fontWeight: 950, fontSize: 22, color: '#1d4ed8' }}>{formatMoney(summary.pending, rows[0]?.currency || 'SAR')}</div>
          </div>
        </div>
      </section>
      <section style={{ ...panelStyle(), display: 'grid', gap: 12 }}>
        {sectionTitle('Driver performance', 'Review per-order closings before payout, or send salary payments directly.')}
        {loading ? <div style={{ color: '#64748b' }}>Loading driver amounts…</div> : null}
        {!loading && !rows.length ? <div style={{ color: '#64748b' }}>No driver amounts available yet.</div> : null}
        {rows.map((row) => {
          const id = String(row?.id || row?._id || '')
          const isPerOrder = row?.paymentModel !== 'salary'
          return (
            <div key={id} style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 22, padding: 16, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{row?.name || 'Driver'}</div>
                  <div style={{ color: '#64748b', fontSize: 14 }}>{row?.phone || '-'} · {row?.country || '-'}</div>
                </div>
                <div style={{ borderRadius: 999, background: 'rgba(15,23,42,0.06)', color: '#0f172a', padding: '8px 12px', fontSize: 12, fontWeight: 800 }}>{row?.paymentModel === 'salary' ? 'Salary' : 'Per Order'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Assigned</div><div style={{ marginTop: 6, fontWeight: 900 }}>{Number(row?.totalAssigned || 0)}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Delivered</div><div style={{ marginTop: 6, fontWeight: 900, color: '#065f46' }}>{Number(row?.totalDelivered || 0)}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Cancelled</div><div style={{ marginTop: 6, fontWeight: 900, color: '#991b1b' }}>{Number(row?.cancelledOrders || 0)}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Total Amount</div><div style={{ marginTop: 6, fontWeight: 900 }}>{formatMoney(row?.totalAmount, row?.currency || 'SAR')}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Delivered Amount</div><div style={{ marginTop: 6, fontWeight: 900, color: '#065f46' }}>{formatMoney(row?.deliveredAmount, row?.currency || 'SAR')}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{row?.paymentModel === 'salary' ? 'Salary Amount' : 'Commission Per Order'}</div><div style={{ marginTop: 6, fontWeight: 900 }}>{formatMoney(row?.paymentModel === 'salary' ? row?.salaryAmount : row?.commissionPerOrder, row?.currency || 'SAR')}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{row?.paymentModel === 'salary' ? 'Current Salary Due' : 'Earned Amount'}</div><div style={{ marginTop: 6, fontWeight: 900, color: row?.paymentModel === 'salary' ? '#0f172a' : '#7c3aed' }}>{formatMoney(row?.paymentModel === 'salary' ? row?.salaryAmount : row?.earnedAmount, row?.currency || 'SAR')}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Paid</div><div style={{ marginTop: 6, fontWeight: 900 }}>{formatMoney(row?.paidAmount, row?.currency || 'SAR')}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Pending</div><div style={{ marginTop: 6, fontWeight: 900, color: '#1d4ed8' }}>{formatMoney(row?.pendingPayment, row?.currency || 'SAR')}</div></div>
              </div>
              {isPerOrder ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ color: '#475569', fontSize: 13 }}>Per-order drivers use the delivered-order closing preview before payout.</div>
                  <button className="btn" style={primaryButtonStyle()} disabled={payingId === id || Number(row?.pendingPayment || 0) <= 0} onClick={() => openPayModal(row)}>{payingId === id ? 'Preparing…' : 'Review & Pay Closing'}</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 220px) auto', gap: 12, alignItems: 'end' }}>
                  <input className="input" style={inputStyle()} value={payAmount[id] ?? row?.pendingPayment ?? ''} onChange={(e) => setPayAmount((prev) => ({ ...prev, [id]: e.target.value }))} placeholder="Payment amount" />
                  <button className="btn" style={primaryButtonStyle()} disabled={payingId === id || Number(row?.pendingPayment || 0) <= 0} onClick={() => openPayModal(row)}>{payingId === id ? 'Paying…' : 'Accept Pending Payment'}</button>
                </div>
              )}
            </div>
          )
        })}
      </section>
      <Modal
        title={payModal?.paymentModel === 'salary' ? 'Pay Driver Salary' : 'Pay Driver Commission'}
        open={!!payModal}
        onClose={closePayModal}
        className="driver-commission-pay-modal"
        style={{ width: 'min(1120px, calc(100vw - 32px))', maxWidth: '1120px' }}
        footer={
          <>
            <button className="btn" style={secondaryButtonStyle()} onClick={closePayModal} disabled={!!payingId}>Cancel</button>
            <button className="btn" style={primaryButtonStyle()} disabled={!!payingId || (payModal?.paymentModel !== 'salary' && (!payPreview || payPreviewLoading))} onClick={confirmPay}>
              {payingId ? 'Processing…' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        {payModal ? (
          <div style={{ display: 'grid', gap: 16, paddingTop: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{payModal?.name || 'Driver'}</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>{payModal?.phone || '-'} · {payModal?.country || '-'}</div>
            </div>

            {payModal?.paymentModel === 'salary' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ color: '#475569', fontSize: 14 }}>Confirm the salary amount you want to pay for this driver.</div>
                <input
                  className="input"
                  style={inputStyle()}
                  value={payAmount[String(payModal?.id || payModal?._id || '')] ?? payModal?.pendingPayment ?? ''}
                  onChange={(e) => {
                    const id = String(payModal?.id || payModal?._id || '')
                    setPayAmount((prev) => ({ ...prev, [id]: e.target.value }))
                  }}
                  placeholder="Payment amount"
                />
                <div style={{ borderRadius: 18, padding: 14, background: 'rgba(15,23,42,0.04)', color: '#0f172a', fontWeight: 800 }}>
                  Pending salary: {formatMoney(payModal?.pendingPayment, payModal?.currency || 'SAR')}
                </div>
              </div>
            ) : (
              <>
                {payPreviewLoading ? <div style={{ color: '#64748b' }}>Loading commission preview…</div> : null}
                {!payPreviewLoading && payPreviewError ? <div style={{ color: '#dc2626' }}>{payPreviewError}</div> : null}
                {!payPreviewLoading && payPreview ? (
                  <>
                    <div style={metricGridStyle()}>
                      <div style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 18, padding: 14 }}><div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>Total Orders</div><div style={{ marginTop: 6, fontSize: 22, fontWeight: 900 }}>{Number(payPreview?.totalSubmitted || 0)}</div></div>
                      <div style={{ border: '1px solid rgba(16,185,129,0.16)', borderRadius: 18, padding: 14 }}><div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>Delivered</div><div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: '#065f46' }}>{Number(payPreview?.totalDelivered || 0)}</div></div>
                      <div style={{ border: '1px solid rgba(239,68,68,0.16)', borderRadius: 18, padding: 14 }}><div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>Cancelled</div><div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: '#991b1b' }}>{Number(payPreview?.totalCancelled || 0)}</div></div>
                      <div style={{ border: '1px solid rgba(29,78,216,0.16)', borderRadius: 18, padding: 14 }}><div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>Commission To Pay</div><div style={{ marginTop: 6, fontSize: 20, fontWeight: 900, color: '#1d4ed8' }}>{formatMoney(calculatedAmount, payModal?.currency || 'SAR')}</div></div>
                    </div>
                    <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                      {(payPreview?.orders || []).map((order) => (
                        <div key={order.id || order.orderId} style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 18, padding: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: 12, alignItems: 'center' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{order.orderId}</div>
                            <div style={{ color: '#64748b', fontSize: 13 }}>{order.productName || '-'}</div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>{formatMoney(order.amount, order.priceCurrency || payModal?.currency || 'SAR')}</div>
                          </div>
                          <div>
                            <input
                              className="input"
                              style={{ ...inputStyle(), textAlign: 'right', fontWeight: 800 }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingPayCommissions?.[order.id] ?? order.commission ?? 0}
                              onChange={(e) => {
                                const value = Math.max(0, Number(e.target.value) || 0)
                                setEditingPayCommissions((prev) => ({ ...prev, [order.id]: value }))
                              }}
                            />
                            <div style={{ marginTop: 6, color: '#64748b', fontSize: 12, textAlign: 'right' }}>{order.commissionCurrency || payModal?.currency || 'SAR'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
