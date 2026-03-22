import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../../api.js'
import Modal from '../../components/Modal.jsx'
import { useToast } from '../../ui/Toast.jsx'
import { useCountry } from '../../contexts/CountryContext.jsx'

const COUNTRY_META = [
  { code: 'SA', label: 'KSA', flag: '🇸🇦', currency: 'SAR', expenseCountry: 'KSA', match: ['KSA', 'Saudi Arabia'] },
  { code: 'AE', label: 'UAE', flag: '🇦🇪', currency: 'AED', expenseCountry: 'UAE', match: ['UAE', 'United Arab Emirates'] },
  { code: 'OM', label: 'Oman', flag: '🇴🇲', currency: 'OMR', expenseCountry: 'Oman', match: ['Oman'] },
  { code: 'BH', label: 'Bahrain', flag: '🇧🇭', currency: 'BHD', expenseCountry: 'Bahrain', match: ['Bahrain'] },
  { code: 'KW', label: 'Kuwait', flag: '🇰🇼', currency: 'KWD', expenseCountry: 'Kuwait', match: ['Kuwait'] },
  { code: 'QA', label: 'Qatar', flag: '🇶🇦', currency: 'QAR', expenseCountry: 'Qatar', match: ['Qatar'] },
  { code: 'IN', label: 'India', flag: '🇮🇳', currency: 'INR', expenseCountry: 'India', match: ['India'] },
  { code: 'PK', label: 'Pakistan', flag: '🇵🇰', currency: 'PKR', expenseCountry: 'Pakistan', match: ['Pakistan'] },
  { code: 'JO', label: 'Jordan', flag: '🇯🇴', currency: 'JOD', expenseCountry: 'Jordan', match: ['Jordan'] },
  { code: 'US', label: 'USA', flag: '🇺🇸', currency: 'USD', expenseCountry: 'USA', match: ['USA', 'United States'] },
  { code: 'GB', label: 'UK', flag: '🇬🇧', currency: 'GBP', expenseCountry: 'UK', match: ['UK', 'United Kingdom'] },
  { code: 'CA', label: 'Canada', flag: '🇨🇦', currency: 'CAD', expenseCountry: 'Canada', match: ['Canada'] },
  { code: 'AU', label: 'Australia', flag: '🇦🇺', currency: 'AUD', expenseCountry: 'Australia', match: ['Australia'] },
]

function currentMonth() {
  const now = new Date()
  return now.getMonth() + 1
}

function currentYear() {
  return new Date().getFullYear()
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

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function monthKey(month, year) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function getCountryMetaFromName(name) {
  const lower = String(name || '').trim().toLowerCase()
  return COUNTRY_META.find((item) => item.match.some((value) => String(value).toLowerCase() === lower)) || null
}

function createEmptySummary() {
  return {
    currency: 'AED',
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalAmount: 0,
    deliveredAmount: 0,
    agentAmount: 0,
    agentDeliveredAmount: 0,
    agentTotalOrders: 0,
    agentDeliveredOrders: 0,
    agentCancelledOrders: 0,
    agentTotalCommission: 0,
    agentPaidCommission: 0,
    dropshipperAmount: 0,
    dropshipperDeliveredAmount: 0,
    dropshipperTotalOrders: 0,
    dropshipperDeliveredOrders: 0,
    dropshipperCancelledOrders: 0,
    dropshipperTotalCommission: 0,
    dropshipperPaidCommission: 0,
    driverTotalAmount: 0,
    driverDeliveredAmount: 0,
    driverTotalOrders: 0,
    driverDeliveredOrders: 0,
    driverCancelledOrders: 0,
    driverTotalCommission: 0,
    driverPaidCommission: 0,
    onlineOrderAmount: 0,
    onlineOrderDeliveredAmount: 0,
    onlineTotalOrders: 0,
    onlinePaidOrders: 0,
    onlineDeliveredOrders: 0,
    onlineCancelledOrders: 0,
    totalStockPurchasedAmount: 0,
    totalStockPurchasedQty: 0,
    totalStockQuantity: 0,
    stockDeliveredQty: 0,
    stockDeliveredCostAmount: 0,
    totalExpense: 0,
    totalCostAmount: 0,
    netProfitAmount: 0,
  }
}

function sectionCardStyle() {
  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 28,
    padding: 22,
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.06)',
  }
}

function SummaryCard({ label, value, hint, accent = '#2563eb' }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 20,
        background: '#ffffff',
        border: '1px solid rgba(148,163,184,0.16)',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
        display: 'grid',
        gap: 8,
        minHeight: 122,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: accent, boxShadow: `0 0 0 8px ${accent}14` }} />
      </div>
      <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 950, letterSpacing: '-0.05em', color: '#0f172a', lineHeight: 1.05 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{hint}</div>
    </div>
  )
}

function MetricRail({ title, subtitle, items }) {
  return (
    <section style={sectionCardStyle()}>
      <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>{title}</div>
        <div style={{ fontSize: 14, color: '#475569' }}>{subtitle}</div>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(180px, 1fr))`, gap: 14, minWidth: `${items.length * 180}px` }}>
          {items.map((item) => (
            <div key={item.label} style={{ borderRadius: 22, padding: 18, border: '1px solid rgba(148,163,184,0.14)', background: item.background || '#fff', display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.labelColor || '#64748b' }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: item.valueColor || '#0f172a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CountryPill({ active, label, flag, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderRadius: 999,
        border: active ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(148,163,184,0.2)',
        background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(99,102,241,0.16) 100%)' : 'rgba(255,255,255,0.88)',
        color: active ? '#1d4ed8' : '#334155',
        boxShadow: active ? '0 12px 30px rgba(59, 130, 246, 0.12)' : 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 18 }}>{flag}</span>
      <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  )
}

function ExpenseRow({ item }) {
  return (
    <div style={{ borderRadius: 20, padding: 16, background: '#fff', border: '1px solid rgba(148,163,184,0.14)', display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{item.title || 'Expense'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {item.country || 'Global'} • {item.createdBy?.role === 'manager' ? 'Manager' : 'Owner'} • {formatDate(item.incurredAt || item.createdAt)}
          </div>
        </div>
        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{formatMoney(item.amount, item.currency)}</div>
      </div>
      {item.notes ? <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{item.notes}</div> : null}
    </div>
  )
}

export default function DashboardPremium() {
  const navigate = useNavigate()
  const toast = useToast()
  const { setCountry } = useCountry()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [selectedYear, setSelectedYear] = useState(currentYear())
  const [selectedCountryCode, setSelectedCountryCode] = useState('all')
  const [report, setReport] = useState({ summary: createEmptySummary(), countries: [], periodLabel: '' })
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    country: 'UAE',
    currency: 'AED',
    notes: '',
    incurredAt: '',
  })

  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear() - index), [])
  const monthNames = useMemo(() => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const [reportRes, expenseRes] = await Promise.all([
        apiGet(`/api/users/total-amounts/report?periodType=monthly&periodKey=${encodeURIComponent(monthKey(selectedMonth, selectedYear))}`),
        apiGet('/api/finance/expenses'),
      ])
      setReport({
        summary: reportRes?.summary || createEmptySummary(),
        countries: Array.isArray(reportRes?.countries) ? reportRes.countries : [],
        periodLabel: reportRes?.periodLabel || `${monthNames[selectedMonth - 1]} ${selectedYear}`,
      })
      setExpenses(Array.isArray(expenseRes?.expenses) ? expenseRes.expenses : [])
    } catch (error) {
      toast.show(error?.message || 'Failed to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [selectedMonth, selectedYear])

  const activeRow = useMemo(() => {
    if (selectedCountryCode === 'all') return report.summary || createEmptySummary()
    return report.countries.find((row) => getCountryMetaFromName(row?.country)?.code === selectedCountryCode) || createEmptySummary()
  }, [report, selectedCountryCode])

  const activeMeta = useMemo(() => COUNTRY_META.find((item) => item.code === selectedCountryCode) || null, [selectedCountryCode])
  const activeCurrency = activeRow?.currency || activeMeta?.currency || report.summary?.currency || 'AED'
  const approvedAdExpenses = useMemo(() => expenses.filter((item) => item.type === 'advertisement' && item.status === 'approved'), [expenses])
  const filteredExpenses = useMemo(() => {
    if (selectedCountryCode === 'all') return approvedAdExpenses
    const meta = COUNTRY_META.find((item) => item.code === selectedCountryCode)
    if (!meta) return approvedAdExpenses
    const accepted = new Set(meta.match.concat(meta.expenseCountry).map((value) => String(value).toLowerCase()))
    return approvedAdExpenses.filter((item) => accepted.has(String(item.country || '').toLowerCase()))
  }, [approvedAdExpenses, selectedCountryCode])
  const recentExpenses = useMemo(() => filteredExpenses.slice(0, 6), [filteredExpenses])
  const pendingManagerExpenses = useMemo(() => {
    const pending = expenses.filter((item) => item.status === 'pending' && item.createdBy?.role === 'manager')
    if (selectedCountryCode === 'all') return pending.slice(0, 4)
    const meta = COUNTRY_META.find((item) => item.code === selectedCountryCode)
    if (!meta) return pending.slice(0, 4)
    const accepted = new Set(meta.match.concat(meta.expenseCountry).map((value) => String(value).toLowerCase()))
    return pending.filter((item) => accepted.has(String(item.country || '').toLowerCase())).slice(0, 4)
  }, [expenses, selectedCountryCode])

  const overviewCards = useMemo(() => {
    const label = selectedCountryCode === 'all' ? 'all markets' : `${activeMeta?.label || 'selected market'} only`
    return [
      { label: 'Total Orders', value: formatCount(activeRow?.totalOrders), hint: `Across ${label}`, accent: '#2563eb' },
      { label: 'Delivered Orders', value: formatCount(activeRow?.deliveredOrders), hint: 'Agent + dropshipper + online', accent: '#059669' },
      { label: 'Cancelled Orders', value: formatCount(activeRow?.cancelledOrders), hint: 'All cancelled and returned flow', accent: '#dc2626' },
      { label: 'Total Order Amount', value: formatMoney(activeRow?.totalAmount, activeCurrency), hint: 'All orders combined', accent: '#7c3aed' },
      { label: 'Delivered Order Amount', value: formatMoney(activeRow?.deliveredAmount, activeCurrency), hint: 'Delivered value only', accent: '#0f766e' },
    ]
  }, [activeCurrency, activeMeta, activeRow, selectedCountryCode])

  const agentItems = useMemo(() => ([
    { label: 'Agent Total Amount', value: formatMoney(activeRow?.agentAmount, activeCurrency), background: 'rgba(59,130,246,0.05)' },
    { label: 'Agent Delivered Amount', value: formatMoney(activeRow?.agentDeliveredAmount, activeCurrency), background: 'rgba(16,185,129,0.05)' },
    { label: 'Agent Total Order', value: formatCount(activeRow?.agentTotalOrders) },
    { label: 'Agent Delivered Order', value: formatCount(activeRow?.agentDeliveredOrders) },
    { label: 'Agent Cancelled Order', value: formatCount(activeRow?.agentCancelledOrders) },
    { label: 'Agent Commission Earned', value: formatMoney(activeRow?.agentTotalCommission, activeCurrency), valueColor: '#1d4ed8' },
    { label: 'Agent Commission Paid', value: formatMoney(activeRow?.agentPaidCommission, activeCurrency), valueColor: '#0f766e' },
  ]), [activeCurrency, activeRow])

  const dropshipperItems = useMemo(() => ([
    { label: 'Dropshipper Total Amount', value: formatMoney(activeRow?.dropshipperAmount, activeCurrency), background: 'rgba(249,115,22,0.06)' },
    { label: 'Dropshipper Delivered Amount', value: formatMoney(activeRow?.dropshipperDeliveredAmount, activeCurrency), background: 'rgba(16,185,129,0.05)' },
    { label: 'Dropshipper Total Order', value: formatCount(activeRow?.dropshipperTotalOrders) },
    { label: 'Dropshipper Delivered Order', value: formatCount(activeRow?.dropshipperDeliveredOrders) },
    { label: 'Dropshipper Cancelled Order', value: formatCount(activeRow?.dropshipperCancelledOrders) },
    { label: 'Dropshipper Commission Earned', value: formatMoney(activeRow?.dropshipperTotalCommission, activeCurrency), valueColor: '#ea580c' },
    { label: 'Dropshipper Commission Paid', value: formatMoney(activeRow?.dropshipperPaidCommission, activeCurrency), valueColor: '#0f766e' },
  ]), [activeCurrency, activeRow])

  const driverItems = useMemo(() => ([
    { label: 'Driver Total Order', value: formatCount(activeRow?.driverTotalOrders) },
    { label: 'Driver Delivered Order', value: formatCount(activeRow?.driverDeliveredOrders) },
    { label: 'Driver Cancelled Order', value: formatCount(activeRow?.driverCancelledOrders) },
    { label: 'Driver Commission Earned', value: formatMoney(activeRow?.driverTotalCommission, activeCurrency), valueColor: '#7c3aed' },
    { label: 'Driver Commission Paid', value: formatMoney(activeRow?.driverPaidCommission, activeCurrency), valueColor: '#0f766e' },
  ]), [activeCurrency, activeRow])

  const onlineItems = useMemo(() => ([
    { label: 'Online Total Amount', value: formatMoney(activeRow?.onlineOrderAmount, activeCurrency), background: 'rgba(14,165,233,0.06)' },
    { label: 'Online Delivered Amount', value: formatMoney(activeRow?.onlineOrderDeliveredAmount, activeCurrency), background: 'rgba(16,185,129,0.05)' },
    { label: 'Online Total Orders', value: formatCount(activeRow?.onlineTotalOrders) },
    { label: 'Online Paid Orders', value: formatCount(activeRow?.onlinePaidOrders) },
    { label: 'Online Delivered Orders', value: formatCount(activeRow?.onlineDeliveredOrders) },
    { label: 'Online Cancelled Orders', value: formatCount(activeRow?.onlineCancelledOrders) },
  ]), [activeCurrency, activeRow])

  const purchasingItems = useMemo(() => ([
    { label: 'Stock Purchased Amount', value: formatMoney(activeRow?.totalStockPurchasedAmount, activeCurrency), background: 'rgba(99,102,241,0.06)' },
    { label: 'Stock Purchase Quantity', value: formatCount(activeRow?.totalStockPurchasedQty) },
    { label: 'Current Stock Quantity', value: formatCount(activeRow?.totalStockQuantity) },
    { label: 'Stock Delivered Quantity', value: formatCount(activeRow?.stockDeliveredQty) },
    { label: 'Delivered Stock Cost', value: formatMoney(activeRow?.stockDeliveredCostAmount, activeCurrency), valueColor: '#7c2d12' },
  ]), [activeCurrency, activeRow])

  function handleCountrySelect(code) {
    setSelectedCountryCode(code)
    if (code !== 'all') setCountry(code)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'country') {
        const meta = COUNTRY_META.find((item) => item.expenseCountry === value)
        next.currency = meta?.currency || current.currency
      }
      return next
    })
  }

  async function submitExpense() {
    if (!form.title || !form.amount || !form.country) {
      toast.show('Please complete the expense form', 'error')
      return
    }
    setSavingExpense(true)
    try {
      await apiPost('/api/finance/expenses', {
        title: form.title,
        type: 'advertisement',
        amount: Number(form.amount || 0),
        country: form.country,
        currency: form.currency,
        notes: form.notes,
        incurredAt: form.incurredAt,
      })
      setExpenseOpen(false)
      setForm({ title: '', amount: '', country: 'UAE', currency: 'AED', notes: '', incurredAt: '' })
      toast.show('Expense added successfully', 'success')
      await loadDashboard()
    } catch (error) {
      toast.show(error?.message || 'Failed to add expense', 'error')
    } finally {
      setSavingExpense(false)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at top right, rgba(168,85,247,0.08), transparent 24%), #f8fafc' }}>
      <div style={{ maxWidth: 1680, margin: '0 auto', padding: 'clamp(14px, 2vw, 28px)', display: 'grid', gap: 22 }}>
        <section style={{ ...sectionCardStyle(), padding: 'clamp(18px, 2.2vw, 30px)', background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #f8fafc 100%)' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>User dashboard</div>
                <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 950, letterSpacing: '-0.06em', color: '#0f172a', lineHeight: 1 }}>Ultra premium business command center</div>
                <div style={{ color: '#475569', fontSize: 15, maxWidth: 820 }}>Track all orders, commissions, online sales, purchasing, and expenses in one premium minimalist dashboard with country-first controls.</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.24)', background: '#fff', padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                  {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.24)', background: '#fff', padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <button type="button" onClick={loadDashboard} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: '#fff', padding: '12px 16px', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" onClick={() => navigate('/user/orders')} style={{ borderRadius: 999, border: '1px solid rgba(37,99,235,0.18)', background: 'rgba(37,99,235,0.08)', color: '#1d4ed8', padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>Orders</button>
              <button type="button" onClick={() => navigate('/user/total-amounts')} style={{ borderRadius: 999, border: '1px solid rgba(124,58,237,0.18)', background: 'rgba(124,58,237,0.08)', color: '#6d28d9', padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>Closing Reports</button>
              <button type="button" onClick={() => setExpenseOpen(true)} style={{ borderRadius: 999, border: '1px solid rgba(5,150,105,0.18)', background: 'rgba(5,150,105,0.08)', color: '#047857', padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>Add Expense</button>
              <button type="button" onClick={() => navigate('/user/expense')} style={{ borderRadius: 999, border: '1px solid rgba(249,115,22,0.18)', background: 'rgba(249,115,22,0.08)', color: '#ea580c', padding: '10px 16px', fontWeight: 800, cursor: 'pointer' }}>Expense Management</button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Country flags</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                <CountryPill active={selectedCountryCode === 'all'} label="All Countries" flag="🌐" onClick={() => handleCountrySelect('all')} />
                {COUNTRY_META.map((item) => (
                  <CountryPill key={item.code} active={selectedCountryCode === item.code} label={item.label} flag={item.flag} onClick={() => handleCountrySelect(item.code)} />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {overviewCards.map((card) => <SummaryCard key={card.label} {...card} />)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 18 }}>{selectedCountryCode === 'all' ? 'Global view' : `${activeMeta?.flag || ''} ${activeMeta?.label || 'Selected country'} view`}</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>{loading ? 'Loading dashboard data...' : report.periodLabel || `${monthNames[selectedMonth - 1]} ${selectedYear}`}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ borderRadius: 18, padding: '12px 16px', background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Profit / Loss</div>
                  <div style={{ fontWeight: 950, fontSize: 20, color: Number(activeRow?.netProfitAmount || 0) < 0 ? '#dc2626' : '#059669' }}>{formatMoney(Math.abs(Number(activeRow?.netProfitAmount || 0)), activeCurrency)}</div>
                </div>
                <div style={{ borderRadius: 18, padding: '12px 16px', background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(148,163,184,0.12)' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Expense</div>
                  <div style={{ fontWeight: 950, fontSize: 20, color: '#0f172a' }}>{formatMoney(activeRow?.totalExpense, activeCurrency)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MetricRail title="Agent" subtitle="Agent total amount, delivered amount, orders, cancellations, and commission status in one premium row." items={agentItems} />
        <MetricRail title="Dropshipper" subtitle="Dropshipper sales and earned/paid commission breakdown for the selected scope." items={dropshipperItems} />
        <MetricRail title="Driver" subtitle="Driver order volume with earned and paid commission metrics." items={driverItems} />
        <MetricRail title="Online" subtitle="Paid and delivered online order performance for the selected scope." items={onlineItems} />
        <MetricRail title="Purchasing" subtitle="Stock purchase, quantity, live stock, and delivered stock cost at a glance." items={purchasingItems} />

        <section style={sectionCardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>Expense</div>
              <div style={{ fontSize: 14, color: '#475569' }}>Integrated advertising expense view with direct expense creation and recent activity.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setExpenseOpen(true)} style={{ borderRadius: 16, border: 'none', background: '#111827', color: '#fff', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>Add Expense</button>
              <button type="button" onClick={() => navigate('/user/expense')} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: '#fff', color: '#0f172a', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>Open Expense Management</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
            <SummaryCard label="Expense Total" value={formatMoney(activeRow?.totalExpense, activeCurrency)} hint="Approved expense total in selected scope" accent="#dc2626" />
            <SummaryCard label="Recent Expenses" value={formatCount(filteredExpenses.length)} hint="Approved advertising entries" accent="#7c3aed" />
            <SummaryCard label="Pending Approvals" value={formatCount(pendingManagerExpenses.length)} hint="Manager submissions waiting review" accent="#f59e0b" />
          </div>

          {pendingManagerExpenses.length ? (
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>Pending manager expense requests</div>
              {pendingManagerExpenses.map((item) => <ExpenseRow key={item._id} item={item} />)}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>Recent approved expense activity</div>
            {recentExpenses.length ? recentExpenses.map((item) => <ExpenseRow key={item._id} item={item} />) : (
              <div style={{ borderRadius: 22, border: '1px dashed rgba(148,163,184,0.28)', padding: 24, color: '#64748b', background: 'rgba(255,255,255,0.72)' }}>
                No approved advertising expense entries found for this dashboard scope yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        title="Add Expense"
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        footer={(
          <>
            <button className="btn secondary" type="button" onClick={() => setExpenseOpen(false)} disabled={savingExpense}>Cancel</button>
            <button className="btn" type="button" onClick={submitExpense} disabled={savingExpense}>{savingExpense ? 'Saving...' : 'Save Expense'}</button>
          </>
        )}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <input className="input" name="title" value={form.title} onChange={handleFormChange} placeholder="Campaign / expense title" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <select className="input" name="country" value={form.country} onChange={handleFormChange}>
              {COUNTRY_META.map((item) => (
                <option key={item.code} value={item.expenseCountry}>{item.flag} {item.label}</option>
              ))}
            </select>
            <input className="input" name="currency" value={form.currency} readOnly />
          </div>
          <input className="input" type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={handleFormChange} placeholder="Amount" />
          <input className="input" type="date" name="incurredAt" value={form.incurredAt} onChange={handleFormChange} />
          <textarea className="input" name="notes" value={form.notes} onChange={handleFormChange} rows={4} placeholder="Notes (optional)" style={{ resize: 'vertical', minHeight: 120 }} />
        </div>
      </Modal>
    </div>
  )
}
