import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE, apiGet, apiPatch, apiPost } from '../../api'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../ui/Toast.jsx'
import Modal from '../../components/Modal.jsx'

export default function ManagerDriverAmounts(){
  const navigate = useNavigate()
  const toast = useToast()
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024))
  useEffect(() => {
    const onResize = () => {
      try {
        setVw(window.innerWidth || 1024)
      } catch {}
    }
    try {
      window.addEventListener('resize', onResize)
    } catch {}
    return () => {
      try {
        window.removeEventListener('resize', onResize)
      } catch {}
    }
  }, [])
  const isMobileView = vw <= 768
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [countryOptions, setCountryOptions] = useState([])
  const [country, setCountry] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [payingDriver, setPayingDriver] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payPreview, setPayPreview] = useState(null)
  const [payPreviewLoading, setPayPreviewLoading] = useState(false)
  const [payPreviewError, setPayPreviewError] = useState('')
  const [editingPayCommissions, setEditingPayCommissions] = useState({})
  const [historyModal, setHistoryModal] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load country options
  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet('/api/orders/options')
        const arr = Array.isArray(r?.countries) ? r.countries : []
        const map = new Map()
        for (const c of arr){
          const raw = String(c||'').trim()
          const key = raw.toLowerCase()
          if (!map.has(key)) map.set(key, raw.toUpperCase() === 'UAE' ? 'UAE' : raw)
        }
        setCountryOptions(Array.from(map.values()))
      } catch { setCountryOptions([]) }
    })()
  }, [])

  // Load drivers
  const loadDrivers = async () => {
    try {
      setLoading(true)
      const r = await apiGet('/api/finance/drivers/summary?limit=100')
      setDrivers(Array.isArray(r?.drivers) ? r.drivers : [])
      setErr('')
    } catch (e) {
      setErr(e?.message || 'Failed to load driver amounts')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  function num(n){ return Number(n||0).toLocaleString(undefined, { maximumFractionDigits: 2 }) }

  const filteredDrivers = useMemo(()=>{
    let result = drivers
    if (country) {
      result = result.filter(d => String(d?.country||'').trim().toLowerCase() === String(country).trim().toLowerCase())
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(d => 
        String(d.name||'').toLowerCase().includes(term) ||
        String(d.phone||'').toLowerCase().includes(term)
      )
    }
    return result
  }, [drivers, country, searchTerm])

  const totals = useMemo(()=>{
    let totalDelivered = 0, totalCollected = 0, totalCommission = 0, totalSentComm = 0, totalPendingComm = 0
    for (const d of filteredDrivers){
      totalDelivered += Number(d.deliveredCount||0)
      totalCollected += Number(d.collected||0)
      totalCommission += Number(d.driverCommission||0)
      totalSentComm += Number(d.paidCommission||0)
      totalPendingComm += Number(d.pendingCommission||0)
    }
    return { totalDelivered, totalCollected, totalCommission, totalSentComm, totalPendingComm }
  }, [filteredDrivers])

  // Get currency for display
  const displayCurrency = useMemo(()=>{
    if (!filteredDrivers.length) return ''
    return filteredDrivers[0]?.currency || 'SAR'
  }, [filteredDrivers])

  // Load commission history for a driver
  const loadCommissionHistory = async (driverId) => {
    try {
      setLoadingHistory(true)
      const r = await apiGet(`/api/finance/drivers/${driverId}/commission-history`)
      setPaymentHistory(Array.isArray(r?.history) ? r.history : [])
    } catch (e) {
      toast.error(e?.message || 'Failed to load commission history')
      setPaymentHistory([])
    } finally { setLoadingHistory(false) }
  }

  const openHistoryModal = async (driver) => {
    setHistoryModal(driver)
    await loadCommissionHistory(driver.id)
  }

  const closePayModal = () => {
    setPayModal(null)
    setPayPreview(null)
    setPayPreviewError('')
    setEditingPayCommissions({})
    setPayPreviewLoading(false)
  }

  const openPayModal = async (driver) => {
    setPayModal({ driver })
    setPayPreview(null)
    setPayPreviewError('')
    setEditingPayCommissions({})
    setPayPreviewLoading(true)
    try {
      const response = await apiGet(`/api/finance/drivers/${driver.id}/commission-preview`)
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

  const handlePayCommission = async () => {
    if (!payModal?.driver || !payPreview) {
      toast.error('Commission preview is not ready yet')
      return
    }
    if (!calculatedAmount || calculatedAmount <= 0) {
      toast.error('No delivered commission is available to pay')
      return
    }
    setPayingDriver(payModal.driver.id)
    try {
      const changedOrders = (payPreview?.orders || []).filter(
        (order) => order?.id && Number(getPayCommissionValue(order)) !== Number(order?.commission || 0)
      )
      for (const order of changedOrders) {
        await apiPatch(`/api/orders/${order.id}`, {
          driverCommission: getPayCommissionValue(order),
        })
      }

      const refreshed = await apiGet(`/api/finance/drivers/${payModal.driver.id}/commission-preview`)
      const latestPreview = refreshed?.preview || payPreview
      setPayPreview(latestPreview)
      const latestAmount = (latestPreview?.orders || []).reduce(
        (sum, order) => sum + Math.max(0, Number(order?.commission || 0) || 0),
        0
      )
      if (!latestAmount || latestAmount <= 0) {
        throw new Error('No delivered commission is available to pay')
      }

      await apiPost(`/api/finance/drivers/${payModal.driver.id}/pay-commission`, {
        amount: latestAmount,
      })
      toast.success('Commission payment sent for approval')
      closePayModal()
      await loadDrivers()
    } catch (e) {
      toast.error(e?.message || 'Failed to send payment')
    } finally {
      setPayingDriver(null)
    }
  }

  function DriverCard({ d }) {
    const canPay = Number(d.pendingCommission || 0) > 0
    const ccy = d.currency || displayCurrency || 'SAR'
    const perOrderSet = d.commissionPerOrder && Number(d.commissionPerOrder) > 0
    return (
      <div
        className="card"
        style={{
          padding: 14,
          display: 'grid',
          gap: 10,
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.18)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.00))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: '#8b5cf6', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {d.name || 'Unnamed'}
            </div>
            <div className="helper" style={{ marginTop: 4 }}>{d.phone || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="badge" style={{ fontSize: 11, fontWeight: 800 }}>{d.country || '-'}</span>
            <span className="chip" style={{ fontSize: 11, fontWeight: 800 }}>{ccy}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 14, padding: 10, background: 'rgba(59, 130, 246, 0.07)' }}>
            <div className="helper">Assigned</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#3b82f6' }}>{num(d.assigned || 0)}</div>
          </div>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 14, padding: 10, background: 'rgba(16, 185, 129, 0.07)' }}>
            <div className="helper">Delivered</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#10b981' }}>{num(d.deliveredCount || 0)}</div>
          </div>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 14, padding: 10, background: 'rgba(34, 197, 94, 0.06)' }}>
            <div className="helper">Collected</div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#22c55e' }}>{ccy} {num(d.collected || 0)}</div>
          </div>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 14, padding: 10, background: 'rgba(245, 158, 11, 0.07)' }}>
            <div className="helper">Pending Commission</div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#f59e0b' }}>{ccy} {num(d.pendingCommission || 0)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ fontSize: 11, fontWeight: 800, background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.22)' }}>
              Total {ccy} {num(d.driverCommission || 0)}
            </span>
            {perOrderSet ? (
              <span className="chip" style={{ fontSize: 11, fontWeight: 800 }}>
                /Order {d.commissionCurrency || ccy} {num(d.commissionPerOrder)}
              </span>
            ) : (
              <span className="badge" style={{ fontSize: 11, fontWeight: 800, background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.22)', color: '#ef4444' }}>
                Commission Not Set
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canPay ? (
              <button
                className="btn success"
                style={{ fontSize: 12, padding: '8px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}
                disabled={payingDriver === d.id}
                onClick={() => openPayModal(d)}
              >
                {payingDriver === d.id ? 'Sending…' : 'Pay'}
              </button>
            ) : null}
            <button
              className="btn secondary"
              style={{ fontSize: 12, padding: '8px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}
              onClick={() => openHistoryModal(d)}
            >
              History
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div className="page-header" style={isMobileView ? { flexDirection: 'column', alignItems: 'stretch', gap: 10 } : undefined}>
        <div>
          <div className="page-title gradient heading-blue">Driver Commission Management</div>
          <div className="page-subtitle">Monitor driver deliveries and manage commission payments</div>
        </div>
      </div>
      {err && <div className="error">{err}</div>}

      {/* Filters */}
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="card-header"><div className="card-title">Filters</div></div>
        <div className="section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          <select className="input" value={country} onChange={(e)=> setCountry(e.target.value)}>
            <option value="">All Countries</option>
            {countryOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input 
            className="input" 
            type="text" 
            placeholder="Search by driver name or phone..." 
            value={searchTerm} 
            onChange={(e)=> setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:12 }}>
        <div className="card" style={{background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color:'#fff'}}>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:14, opacity:0.9}}>Total Delivered Orders</div>
            <div style={{fontSize:28, fontWeight:800}}>{num(totals.totalDelivered)}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:4}}>Successfully delivered</div>
          </div>
        </div>
        <div className="card" style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', color:'#fff'}}>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:14, opacity:0.9}}>Total Collected</div>
            <div style={{fontSize:28, fontWeight:800}}>{displayCurrency} {num(totals.totalCollected)}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:4}}>Cash on delivery</div>
          </div>
        </div>
        <div className="card" style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', color:'#fff'}}>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:14, opacity:0.9}}>Total Commission</div>
            <div style={{fontSize:28, fontWeight:800}}>{displayCurrency} {num(totals.totalCommission)}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:4}}>Earned from delivered orders</div>
          </div>
        </div>
        <div className="card" style={{background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color:'#fff'}}>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:14, opacity:0.9}}>Commission Pending</div>
            <div style={{fontSize:28, fontWeight:800}}>{displayCurrency} {num(totals.totalPendingComm)}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:4}}>Available to pay</div>
          </div>
        </div>
        <div className="card" style={{background:'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color:'#fff'}}>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:14, opacity:0.9}}>Commission Sent</div>
            <div style={{fontSize:28, fontWeight:800}}>{displayCurrency} {num(totals.totalSentComm)}</div>
            <div style={{fontSize:12, opacity:0.8, marginTop:4}}>Already paid to drivers</div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontWeight: 700 }}>Driver Delivery & Commission Summary</div>
          <div className="helper">{filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: isMobileView ? 'grid' : 'none', gap: 12 }}>
          {loading ? (
            <div className="helper">Loading…</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="helper">No drivers found</div>
          ) : (
            filteredDrivers.map((d) => <DriverCard key={String(d.id)} d={d} />)
          )}
        </div>
        <div style={{ overflowX: 'auto', display: isMobileView ? 'none' : 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', textAlign:'left', borderRight:'1px solid var(--border)', color:'#8b5cf6' }}>Driver</th>
                <th style={{ padding: '10px 12px', textAlign:'left', borderRight:'1px solid var(--border)', color:'#6366f1' }}>Country</th>
                <th style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)', color:'#3b82f6' }}>Assigned</th>
                <th style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)', color:'#10b981' }}>Delivered</th>
                <th style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)', color:'#22c55e' }}>Collected</th>
                <th style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)', color:'#a855f7' }}>Commission/Order</th>
                <th style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)', color:'#ec4899' }}>Extra</th>
                <th style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)', color:'#06b6d4' }}>Total Commission</th>
                <th style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)', color:'#f59e0b' }}>Pending</th>
                <th style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)', color:'#14b8a6' }}>Sent</th>
                <th style={{ padding: '10px 12px', textAlign:'center', color:'#8b5cf6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i)=> (
                  <tr key={`sk${i}`}>
                    <td colSpan={11} style={{ padding:'10px 12px' }}>
                      <div style={{ height:14, background:'var(--panel-2)', borderRadius:6, animation:'pulse 1.2s ease-in-out infinite' }} />
                    </td>
                  </tr>
                ))
              ) : filteredDrivers.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '10px 12px', opacity: 0.7, textAlign:'center' }}>No drivers found</td></tr>
              ) : (
                filteredDrivers.map((d, idx) => (
                  <tr key={String(d.id)} style={{ borderTop: '1px solid var(--border)', background: idx % 2 ? 'transparent' : 'var(--panel)' }}>
                    <td style={{ padding: '10px 12px', borderRight:'1px solid var(--border)' }}>
                      <div style={{fontWeight:700, color:'#8b5cf6'}}>{d.name || 'Unnamed'}</div>
                      <div className="helper">{d.phone || ''}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#6366f1', fontWeight:700}}>{d.country || '-'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#3b82f6', fontWeight:700}}>{num(d.assigned)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#10b981', fontWeight:800}}>{num(d.deliveredCount)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#22c55e', fontWeight:800}}>{d.currency} {num(d.collected)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                      {d.commissionPerOrder && d.commissionPerOrder > 0 ? (
                        <span style={{color:'#a855f7', fontWeight:700}}>{d.commissionCurrency || d.currency} {num(d.commissionPerOrder)}</span>
                      ) : (
                        <span style={{color:'#ef4444', fontWeight:600, fontSize:12}}>Not Set</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#ec4899', fontWeight:800}}>{d.currency} {num(d.extraCommission||0)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#06b6d4', fontWeight:800}}>{d.currency} {num(d.driverCommission||0)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#f59e0b', fontWeight:800}}>{d.currency} {num(d.pendingCommission||0)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'right', borderRight:'1px solid var(--border)' }}>
                      <span style={{color:'#14b8a6', fontWeight:800}}>{d.currency} {num(d.paidCommission||0)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign:'center' }}>
                      <div style={{display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap'}}>
                        {d.pendingCommission && d.pendingCommission > 0 ? (
                          <button 
                            className="btn success" 
                            style={{fontSize:12, padding:'6px 12px'}}
                            disabled={payingDriver === d.id}
                            onClick={()=> openPayModal(d)}
                          >
                            Pay Commission
                          </button>
                        ) : (
                          <span style={{color:'var(--text-muted)', fontSize:12}}>No pending</span>
                        )}
                        <button 
                          className="btn secondary" 
                          style={{fontSize:12, padding:'6px 12px'}}
                          onClick={()=> openHistoryModal(d)}
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Commission Modal */}
      <Modal
        title="Pay Driver Commission"
        open={!!payModal}
        onClose={closePayModal}
        className="driver-commission-pay-modal"
        style={{ width: 'min(1120px, calc(100vw - 32px))', maxWidth: '1120px' }}
        footer={
          <>
            <button className="btn secondary" onClick={closePayModal} disabled={!!payingDriver}>Cancel</button>
            <button 
              className="btn success" 
              disabled={!!payingDriver || !payPreview || payPreviewLoading}
              onClick={handlePayCommission}
            >
              {payingDriver ? 'Sending...' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        {payModal && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6' }}>{payModal.driver.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{payModal.driver.phone || '-'} · {payModal.driver.country || '-'}</div>
              </div>

              {payPreviewLoading ? <div style={{ color: 'var(--text-muted)' }}>Loading commission preview…</div> : null}
              {!payPreviewLoading && payPreviewError ? <div className="error">{payPreviewError}</div> : null}

              {!payPreviewLoading && payPreview ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Total Orders</div>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>{num(payPreview.totalSubmitted || 0)}</div>
                    </div>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Delivered</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{num(payPreview.totalDelivered || 0)}</div>
                    </div>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Cancelled</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{num(payPreview.totalCancelled || 0)}</div>
                    </div>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Order Amount</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{payModal.driver.currency} {num(payPreview.totalOrderValue || 0)}</div>
                    </div>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Delivered Amount</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{payModal.driver.currency} {num(payPreview.deliveredOrderValue || 0)}</div>
                    </div>
                    <div className="card" style={{ padding: 12 }}>
                      <div className="helper">Commission To Submit</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{payModal.driver.currency} {num(calculatedAmount || 0)}</div>
                    </div>
                  </div>

                  <div className="card" style={{ display: 'grid', gap: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>Delivered order commissions</div>
                    {!(payPreview.orders || []).length ? (
                      <div style={{ color: 'var(--text-muted)' }}>No delivered orders available for this closing.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                        {(payPreview.orders || []).map((order) => (
                          <div key={order.id || order.orderId} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: 12, alignItems: 'center' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700 }}>{order.orderId}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.productName || '-'}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {order.priceCurrency || payModal.driver.currency} {num(order.amount || 0)}
                              </div>
                            </div>
                            <div>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingPayCommissions?.[order.id] ?? order.commission ?? 0}
                                onChange={(e) => {
                                  const value = Math.max(0, Number(e.target.value) || 0)
                                  setEditingPayCommissions((prev) => ({ ...prev, [order.id]: value }))
                                }}
                                style={{ textAlign: 'right', fontWeight: 700 }}
                              />
                              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                                {order.commissionCurrency || payModal.driver.currency}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, fontSize: 13 }}>
                    <strong>Note:</strong> This payment will be sent for owner approval before being disbursed to the driver.
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </Modal>

      {/* Commission History Modal */}
      <Modal
        title={`Commission History - ${historyModal?.name || ''}`}
        open={!!historyModal}
        onClose={()=> { setHistoryModal(null); setPaymentHistory([]) }}
        footer={
          <button className="btn secondary" onClick={()=> { setHistoryModal(null); setPaymentHistory([]) }}>Close</button>
        }
      >
        {historyModal && (
          <div style={{ padding: '16px 0' }}>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading history...</p>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                No commission payments yet
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '12px', textAlign:'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                      <th style={{ padding: '12px', textAlign:'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign:'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '12px', textAlign:'center', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, i) => (
                      <tr key={payment._id || i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px' }}>
                          {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign:'right', fontWeight: 700, color: '#10b981' }}>
                          {payment.currency} {num(payment.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign:'center' }}>
                          <span 
                            className="badge" 
                            style={{
                              fontSize: 11,
                              background: payment.status === 'paid' || payment.status === 'sent' ? '#10b981' : 
                                         payment.status === 'pending' ? '#f59e0b' : '#ef4444',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: 4
                            }}
                          >
                            {String(payment.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign:'center' }}>
                          {payment.status === 'sent' || payment.status === 'paid' ? (
                            <button 
                              className="btn"
                              style={{ fontSize: 12, padding: '4px 10px' }}
                              onClick={async ()=> {
                                try {
                                  const response = await fetch(`${API_BASE}/finance/drivers/${historyModal.id}/commission-pdf?paymentId=${payment._id}`, {
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                  })
                                  if (!response.ok) throw new Error('Download failed')
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `Commission_${historyModal.name}_${new Date(payment.paidAt).toLocaleDateString().replace(/\//g, '-')}.pdf`
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  document.body.removeChild(a)
                                } catch (err) {
                                  alert('Failed to download PDF')
                                }
                              }}
                            >
                              Download
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
