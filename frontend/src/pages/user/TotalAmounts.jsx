import React, { useEffect, useMemo, useRef, useState } from 'react'
import { apiGet } from '../../api'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function currentDayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatMonthLabel(monthKey) {
  const safe = `${monthKey || currentMonthKey()}-01T00:00:00Z`
  const date = new Date(safe)
  if (Number.isNaN(date.getTime())) return monthKey || ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function formatDayLabel(dayKey) {
  const date = new Date(`${dayKey || currentDayKey()}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return dayKey || ''
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
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

function SummaryStat({ label, value }) {
  return (
    <div className="card" style={{ padding: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.7)', display: 'grid', gap: 6, boxShadow: 'none' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function ReportLine({ title, fields }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(148,163,184,0.14)', padding: '12px 0', display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {fields.map((field) => (
          <div key={field.label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>{field.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', overflowWrap: 'anywhere' }}>{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonBlock({ row, type = 'agent' }) {
  const moneyCode = row?.currency || 'AED'
  const roleLabel = type === 'driver' ? 'Driver' : 'Agent'
  const showOnline = type === 'driver' || Number(row?.onlineTotalOrders || 0) > 0 || Number(row?.onlineOrderAmount || 0) > 0 || Number(row?.onlineOrderDeliveredAmount || 0) > 0
  return (
    <div className="card" style={{ display: 'grid', gap: 2, padding: 18, borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>{row?.name || roleLabel}</div>
          <div className="helper">{roleLabel} detail • {row?.country || 'Other'} • {moneyCode}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="helper">Delivered Amount</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{formatMoney(row?.deliveredAmount, moneyCode)}</div>
        </div>
      </div>

      <ReportLine
        title={`${roleLabel} Orders`}
        fields={[
          { label: 'Total Amount', value: formatMoney(row?.totalAmount, moneyCode) },
          { label: 'Delivered Amount', value: formatMoney(row?.deliveredAmount, moneyCode) },
          { label: 'Total Orders', value: formatCount(row?.totalOrders) },
          { label: 'Delivered Orders', value: formatCount(row?.deliveredOrders) },
          { label: 'Cancelled Orders', value: formatCount(row?.cancelledOrders) },
        ]}
      />

      {showOnline ? (
      <ReportLine
        title="Online Orders"
        fields={[
          { label: 'Online Total Amount', value: formatMoney(row?.onlineOrderAmount, moneyCode) },
          { label: 'Online Delivered Amount', value: formatMoney(row?.onlineOrderDeliveredAmount, moneyCode) },
          { label: 'Online Total Orders', value: formatCount(row?.onlineTotalOrders) },
          { label: 'Online Paid Orders', value: formatCount(row?.onlinePaidOrders) },
          { label: 'Online Delivered Orders', value: formatCount(row?.onlineDeliveredOrders) },
          { label: 'Online Cancelled Orders', value: formatCount(row?.onlineCancelledOrders) },
        ]}
      />
      ) : null}

      <ReportLine
        title="Commission"
        fields={[
          { label: `${roleLabel} Commission Earned`, value: formatMoney(row?.totalCommission, moneyCode) },
          { label: `${roleLabel} Commission Paid`, value: formatMoney(row?.paidCommission, moneyCode) },
        ]}
      />
    </div>
  )
}

function slugifyText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report'
}

function buildSummaryCardsForTotals(src, periodType = 'monthly', currencyOverride) {
  const base = src || {}
  const moneyCode = currencyOverride || base.currency || 'AED'
  const netProfit = Number(base.netProfitAmount || 0)
  const cards = [
    { label: 'Total Orders', value: formatCount(base.totalOrders) },
    { label: 'Delivered Orders', value: formatCount(base.deliveredOrders) },
    { label: 'Cancelled Orders', value: formatCount(base.cancelledOrders) },
    { label: 'Total Amount', value: formatMoney(base.totalAmount, moneyCode) },
    { label: 'Delivered Amount', value: formatMoney(base.deliveredAmount, moneyCode) },
    { label: 'Online Orders', value: formatCount(base.onlineTotalOrders) },
    { label: 'Online Delivered Orders', value: formatCount(base.onlineDeliveredOrders) },
    { label: 'Online Amount', value: formatMoney(base.onlineOrderAmount, moneyCode) },
    { label: 'Agent Commission', value: formatMoney(base.agentTotalCommission, moneyCode) },
    { label: 'Dropshipper Commission', value: formatMoney(base.dropshipperTotalCommission, moneyCode) },
    { label: 'Driver Commission', value: formatMoney(base.driverTotalCommission, moneyCode) },
    { label: 'Purchasing', value: formatMoney(base.totalStockPurchasedAmount, moneyCode) },
    { label: 'Total Cost', value: formatMoney(base.totalCostAmount, moneyCode) },
    { label: netProfit < 0 ? 'Net Loss' : 'Net Profit', value: formatMoney(Math.abs(netProfit), moneyCode) },
  ]
  if (periodType === 'monthly') cards.splice(11, 0, { label: 'Total Expense', value: formatMoney(base.totalExpense, moneyCode) })
  return cards
}

function buildSummaryCardsForPerson(src, type = 'agent', currencyOverride) {
  const base = src || {}
  const roleLabel = type === 'driver' ? 'Driver' : 'Agent'
  const moneyCode = currencyOverride || base.currency || 'AED'
  const cards = [
    { label: 'Total Orders', value: formatCount(base.totalOrders) },
    { label: 'Delivered Orders', value: formatCount(base.deliveredOrders) },
    { label: 'Cancelled Orders', value: formatCount(base.cancelledOrders) },
    { label: 'Total Amount', value: formatMoney(base.totalAmount, moneyCode) },
    { label: 'Delivered Amount', value: formatMoney(base.deliveredAmount, moneyCode) },
  ]
  if (type === 'driver' || Number(base.onlineTotalOrders || 0) > 0 || Number(base.onlineOrderAmount || 0) > 0 || Number(base.onlineOrderDeliveredAmount || 0) > 0) {
    cards.push(
      { label: 'Online Orders', value: formatCount(base.onlineTotalOrders) },
      { label: 'Online Delivered Orders', value: formatCount(base.onlineDeliveredOrders) },
      { label: 'Online Amount', value: formatMoney(base.onlineOrderAmount, moneyCode) },
    )
  }
  cards.push(
    { label: `${roleLabel} Commission Earned`, value: formatMoney(base.totalCommission, moneyCode) },
    { label: `${roleLabel} Commission Paid`, value: formatMoney(base.paidCommission, moneyCode) },
  )
  return cards
}

function CountryBlock({ row, summary = false, periodType = 'monthly' }) {
  const moneyCode = row?.currency || 'AED'
  const netProfit = Number(row?.netProfitAmount || 0)
  const totalCost = Number(row?.totalCostAmount || 0)
  const isLoss = netProfit < 0
  return (
    <div className="card" style={{ display: 'grid', gap: 2, padding: 18, borderRadius: 18, border: summary ? '1px solid rgba(15,23,42,0.18)' : '1px solid rgba(148,163,184,0.18)', background: '#ffffff', boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>{row?.country || 'Other'}</div>
          <div className="helper">{summary ? `${periodType === 'daily' ? 'Daily' : 'Monthly'} summary` : 'Country summary'} • {moneyCode}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="helper">Total Amount</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{formatMoney(row?.totalAmount, moneyCode)}</div>
        </div>
      </div>

      <ReportLine
        title="All Orders"
        fields={[
          { label: 'Total Amount', value: formatMoney(row?.totalAmount, moneyCode) },
          { label: 'Delivered Amount', value: formatMoney(row?.deliveredAmount, moneyCode) },
          { label: 'Total Orders', value: formatCount(row?.totalOrders) },
          { label: 'Delivered Orders', value: formatCount(row?.deliveredOrders) },
          { label: 'Cancelled Orders', value: formatCount(row?.cancelledOrders) },
        ]}
      />

      <ReportLine
        title="Agent"
        fields={[
          { label: 'Agent Total Amount', value: formatMoney(row?.agentAmount, moneyCode) },
          { label: 'Agent Delivered Amount', value: formatMoney(row?.agentDeliveredAmount, moneyCode) },
          { label: 'Agent Total Order', value: formatCount(row?.agentTotalOrders) },
          { label: 'Agent Delivered Order', value: formatCount(row?.agentDeliveredOrders) },
          { label: 'Agent Cancelled Order', value: formatCount(row?.agentCancelledOrders) },
          { label: 'Agent Commission Earned', value: formatMoney(row?.agentTotalCommission, moneyCode) },
          { label: 'Agent Commission Paid', value: formatMoney(row?.agentPaidCommission, moneyCode) },
        ]}
      />

      <ReportLine
        title="Dropshipper"
        fields={[
          { label: 'Dropshipper Total Amount', value: formatMoney(row?.dropshipperAmount, moneyCode) },
          { label: 'Dropshipper Delivered Amount', value: formatMoney(row?.dropshipperDeliveredAmount, moneyCode) },
          { label: 'Dropshipper Total Order', value: formatCount(row?.dropshipperTotalOrders) },
          { label: 'Dropshipper Delivered Order', value: formatCount(row?.dropshipperDeliveredOrders) },
          { label: 'Dropshipper Cancelled Order', value: formatCount(row?.dropshipperCancelledOrders) },
          { label: 'Dropshipper Commission Earned', value: formatMoney(row?.dropshipperTotalCommission, moneyCode) },
          { label: 'Dropshipper Commission Paid', value: formatMoney(row?.dropshipperPaidCommission, moneyCode) },
        ]}
      />

      <ReportLine
        title="Driver"
        fields={[
          { label: 'Driver Total Amount', value: formatMoney(row?.driverTotalAmount, moneyCode) },
          { label: 'Driver Delivered Amount', value: formatMoney(row?.driverDeliveredAmount, moneyCode) },
          { label: 'Driver Total Order', value: formatCount(row?.driverTotalOrders) },
          { label: 'Driver Delivered Order', value: formatCount(row?.driverDeliveredOrders) },
          { label: 'Driver Cancelled Order', value: formatCount(row?.driverCancelledOrders) },
          { label: 'Driver Commission Earned', value: formatMoney(row?.driverTotalCommission, moneyCode) },
          { label: 'Driver Commission Paid', value: formatMoney(row?.driverPaidCommission, moneyCode) },
        ]}
      />

      <ReportLine
        title="Online"
        fields={[
          { label: 'Online Total Amount', value: formatMoney(row?.onlineOrderAmount, moneyCode) },
          { label: 'Online Delivered Amount', value: formatMoney(row?.onlineOrderDeliveredAmount, moneyCode) },
          { label: 'Online Total Orders', value: formatCount(row?.onlineTotalOrders) },
          { label: 'Online Paid Orders', value: formatCount(row?.onlinePaidOrders) },
          { label: 'Online Delivered Orders', value: formatCount(row?.onlineDeliveredOrders) },
          { label: 'Online Cancelled Orders', value: formatCount(row?.onlineCancelledOrders) },
        ]}
      />

      {periodType === 'monthly' ? (
      <ReportLine
        title="Expense"
        fields={[
          { label: 'Total Expense', value: formatMoney(row?.totalExpense, moneyCode) },
        ]}
      />
      ) : null}

      <ReportLine
        title="Purchasing"
        fields={[
          { label: 'Stock Purchased Amount', value: formatMoney(row?.totalStockPurchasedAmount, moneyCode) },
          { label: 'Stock Purchase Quantity', value: formatCount(row?.totalStockPurchasedQty) },
          { label: 'Current Stock Quantity', value: formatCount(row?.totalStockQuantity) },
          { label: 'Stock Delivered Quantity', value: formatCount(row?.stockDeliveredQty) },
          { label: 'Delivered Stock Cost', value: formatMoney(row?.stockDeliveredCostAmount, moneyCode) },
        ]}
      />

      <ReportLine
        title="Net Profit / Loss"
        fields={[
          { label: 'Delivered Amount', value: formatMoney(row?.deliveredAmount, moneyCode) },
          { label: 'Total Cost', value: formatMoney(totalCost, moneyCode) },
          { label: isLoss ? 'Net Loss' : 'Net Profit', value: formatMoney(Math.abs(netProfit), moneyCode) },
        ]}
      />
    </div>
  )
}

export default function TotalAmounts() {
  const reportRef = useRef(null)
  const exportRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [details, setDetails] = useState({ agents: [], drivers: [] })
  const [query, setQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [periodType, setPeriodType] = useState('monthly')
  const [month, setMonth] = useState(currentMonthKey())
  const [day, setDay] = useState(currentDayKey())
  const [periodLabel, setPeriodLabel] = useState(formatMonthLabel(currentMonthKey()))
  const [exportOpen, setExportOpen] = useState(false)
  const [exportScope, setExportScope] = useState('all')
  const [exportCountry, setExportCountry] = useState('all')
  const [exportAgentId, setExportAgentId] = useState('')
  const [exportDriverId, setExportDriverId] = useState('')
  const [exportGeneratedAt, setExportGeneratedAt] = useState('')

  async function load({ nextPeriodType = periodType, nextMonth = month, nextDay = day } = {}) {
    setLoading(true)
    try {
      const nextPeriodKey = nextPeriodType === 'daily' ? nextDay : nextMonth
      const res = await apiGet(`/api/users/total-amounts/report?periodType=${encodeURIComponent(nextPeriodType)}&periodKey=${encodeURIComponent(nextPeriodKey)}`)
      setRows(Array.isArray(res?.countries) ? res.countries : [])
      setSummary(res?.summary || null)
      setDetails({
        agents: Array.isArray(res?.details?.agents) ? res.details.agents : [],
        drivers: Array.isArray(res?.details?.drivers) ? res.details.drivers : [],
      })
      setPeriodType(String(res?.periodType || nextPeriodType || 'monthly'))
      setMonth(String(res?.monthKey || nextMonth || currentMonthKey()))
      setDay(String(res?.periodType === 'daily' ? res?.periodKey || nextDay || currentDayKey() : nextDay || currentDayKey()))
      setPeriodLabel(String(res?.periodLabel || (nextPeriodType === 'daily' ? formatDayLabel(nextDay) : formatMonthLabel(nextMonth))))
      setError('')
    } catch (err) {
      setRows([])
      setSummary(null)
      setDetails({ agents: [], drivers: [] })
      setError(err?.message || 'Failed to load closing report')
    } finally {
      setLoading(false)
    }
  }

  function openExportModal() {
    const nextScope = countryFilter !== 'all' ? 'country' : 'all'
    setExportScope(nextScope)
    setExportCountry(countryFilter !== 'all' ? countryFilter : 'all')
    setExportOpen(true)
  }

  async function downloadPDF() {
    if (!exportRef.current || !exportDocument) return
    setGenerating(true)
    try {
      const stamp = new Date().toISOString()
      setExportGeneratedAt(stamp)
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      await new Promise((resolve) => window.requestAnimationFrame(() => setTimeout(resolve, 80)))
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: exportRef.current.scrollWidth,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const renderWidth = pdfWidth - margin * 2
      const renderHeight = (canvas.height * renderWidth) / canvas.width
      let heightLeft = renderHeight
      let position = margin
      pdf.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
      heightLeft -= (pdfHeight - margin * 2)
      while (heightLeft > 0) {
        position = heightLeft - renderHeight + margin
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, renderWidth, renderHeight)
        heightLeft -= (pdfHeight - margin * 2)
      }
      pdf.save(exportDocument.fileName)
      setExportOpen(false)
    } catch (err) {
      setError(err?.message || 'Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    load({ nextPeriodType: periodType, nextMonth: month, nextDay: day })
  }, [periodType, month, day])

  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    return rows.filter((row) => {
      const country = String(row?.country || '')
      const matchesQuery = !q || country.toLowerCase().includes(q)
      const matchesCountry = countryFilter === 'all' || country === countryFilter
      return matchesQuery && matchesCountry
    })
  }, [rows, query, countryFilter])

  const countryOptions = useMemo(() => {
    const set = new Set(rows.map((row) => String(row?.country || '')).filter(Boolean))
    return Array.from(set)
  }, [rows])

  const agentOptions = useMemo(() => Array.isArray(details?.agents) ? details.agents : [], [details])
  const driverOptions = useMemo(() => Array.isArray(details?.drivers) ? details.drivers : [], [details])

  const cards = useMemo(() => {
    return buildSummaryCardsForTotals(summary || {}, periodType)
  }, [summary, periodType])

  const exportDocument = useMemo(() => {
    const selectedCountryRow = rows.find((row) => row?.country === exportCountry) || null
    const selectedAgent = agentOptions.find((row) => String(row?.id || '') === String(exportAgentId || '')) || null
    const selectedDriver = driverOptions.find((row) => String(row?.id || '') === String(exportDriverId || '')) || null
    const periodKey = periodType === 'daily' ? day : month

    if (exportScope === 'country') {
      if (!selectedCountryRow) return null
      return {
        title: `${periodType === 'daily' ? 'Daily' : 'Monthly'} Closing Report`,
        subtitle: `${periodLabel} • Country Detail • ${selectedCountryRow.country}`,
        fileName: `Magnetic-E-Commerce-${periodType}-closing-country-${slugifyText(selectedCountryRow.country)}-${periodKey}.pdf`,
        cards: buildSummaryCardsForTotals(selectedCountryRow, periodType, selectedCountryRow.currency),
        countryRows: [],
        agentRows: agentOptions.filter((row) => row?.country === selectedCountryRow.country),
        driverRows: driverOptions.filter((row) => row?.country === selectedCountryRow.country),
        focus: { kind: 'country', row: selectedCountryRow },
      }
    }

    if (exportScope === 'agent') {
      if (!selectedAgent) return null
      return {
        title: `${periodType === 'daily' ? 'Daily' : 'Monthly'} Closing Report`,
        subtitle: `${periodLabel} • Agent Detail • ${selectedAgent.name}`,
        fileName: `Magnetic-E-Commerce-${periodType}-closing-agent-${slugifyText(selectedAgent.name)}-${periodKey}.pdf`,
        cards: buildSummaryCardsForPerson(selectedAgent, 'agent', selectedAgent.currency),
        countryRows: [],
        agentRows: [selectedAgent],
        driverRows: [],
        focus: { kind: 'agent', row: selectedAgent },
      }
    }

    if (exportScope === 'driver') {
      if (!selectedDriver) return null
      return {
        title: `${periodType === 'daily' ? 'Daily' : 'Monthly'} Closing Report`,
        subtitle: `${periodLabel} • Driver Detail • ${selectedDriver.name}`,
        fileName: `Magnetic-E-Commerce-${periodType}-closing-driver-${slugifyText(selectedDriver.name)}-${periodKey}.pdf`,
        cards: buildSummaryCardsForPerson(selectedDriver, 'driver', selectedDriver.currency),
        countryRows: [],
        agentRows: [],
        driverRows: [selectedDriver],
        focus: { kind: 'driver', row: selectedDriver },
      }
    }

    return {
      title: `${periodType === 'daily' ? 'Daily' : 'Monthly'} Closing Report`,
      subtitle: `${periodLabel} • All Detail`,
      fileName: `Magnetic-E-Commerce-${periodType}-closing-all-detail-${periodKey}.pdf`,
      cards: buildSummaryCardsForTotals(summary || {}, periodType),
      countryRows: rows,
      agentRows: agentOptions,
      driverRows: driverOptions,
      focus: { kind: 'all', row: summary || null },
    }
  }, [agentOptions, day, driverOptions, exportAgentId, exportCountry, exportDriverId, exportScope, month, periodLabel, periodType, rows, summary])

  useEffect(() => {
    if (exportCountry !== 'all' && !countryOptions.includes(exportCountry)) setExportCountry('all')
  }, [countryOptions, exportCountry])

  useEffect(() => {
    if (exportAgentId && !agentOptions.some((row) => String(row?.id || '') === String(exportAgentId))) setExportAgentId('')
  }, [agentOptions, exportAgentId])

  useEffect(() => {
    if (exportDriverId && !driverOptions.some((row) => String(row?.id || '') === String(exportDriverId))) setExportDriverId('')
  }, [driverOptions, exportDriverId])

  return (
    <div className="section" style={{ display: 'grid', gap: 12 }}>
      <div className="page-header" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="page-title gradient heading-blue">Closing Reports</div>
          <div className="page-subtitle">Automatic daily and monthly financial closing reports with delivered amount, commissions, purchasing, expenses, and net profit.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" type="button" onClick={() => load({ nextPeriodType: periodType, nextMonth: month, nextDay: day })} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn" type="button" onClick={openExportModal} disabled={loading || generating} style={{ background: '#1d4ed8', border: 'none', color: '#fff' }}>
            {generating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {error ? <div className="card error">{error}</div> : null}

      {exportOpen ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 1000 }}>
          <div className="card" style={{ width: 'min(760px, 100%)', display: 'grid', gap: 14, padding: 18, borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Download Closing Report PDF</div>
                <div className="helper">Choose exactly what detail you want to export for {periodLabel}.</div>
              </div>
              <button className="btn secondary" type="button" onClick={() => setExportOpen(false)} disabled={generating}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span className="helper">Export Detail</span>
                <select className="input" value={exportScope} onChange={(e) => setExportScope(String(e.target.value || 'all'))}>
                  <option value="all">All Detail</option>
                  <option value="country">Specific Country</option>
                  <option value="agent">Specific Agent</option>
                  <option value="driver">Specific Driver</option>
                </select>
              </label>

              {exportScope === 'country' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span className="helper">Country</span>
                  <select className="input" value={exportCountry} onChange={(e) => setExportCountry(String(e.target.value || 'all'))}>
                    <option value="all">Select country</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {exportScope === 'agent' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span className="helper">Agent</span>
                  <select className="input" value={exportAgentId} onChange={(e) => setExportAgentId(String(e.target.value || ''))}>
                    <option value="">Select agent</option>
                    {agentOptions.map((row) => (
                      <option key={row.id} value={row.id}>{row.name} {row.country ? `• ${row.country}` : ''}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {exportScope === 'driver' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span className="helper">Driver</span>
                  <select className="input" value={exportDriverId} onChange={(e) => setExportDriverId(String(e.target.value || ''))}>
                    <option value="">Select driver</option>
                    {driverOptions.map((row) => (
                      <option key={row.id} value={row.id}>{row.name} {row.country ? `• ${row.country}` : ''}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="helper">
              {exportScope === 'all' ? 'All Detail includes overall summary, all country blocks, all agent detail, and all driver detail.' : null}
              {exportScope === 'country' ? 'Country export includes the selected country summary plus agent and driver detail for that country.' : null}
              {exportScope === 'agent' ? 'Agent export includes the selected agent detail with delivered amounts and commissions.' : null}
              {exportScope === 'driver' ? 'Driver export includes the selected driver detail with online orders and commissions.' : null}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn secondary" type="button" onClick={() => setExportOpen(false)} disabled={generating}>Cancel</button>
              <button className="btn" type="button" onClick={downloadPDF} disabled={generating || !exportDocument} style={{ background: '#1d4ed8', border: 'none', color: '#fff' }}>
                {generating ? 'Generating PDF...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ display: 'grid', gap: 12, padding: 16, borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', boxShadow: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Report Type</span>
            <select className="input" value={periodType} onChange={(e) => setPeriodType(e.target.value === 'daily' ? 'daily' : 'monthly')}>
              <option value="monthly">Monthly Report</option>
              <option value="daily">Daily Report</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">{periodType === 'daily' ? 'Day' : 'Month'}</span>
            {periodType === 'daily' ? (
              <input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value || currentDayKey())} />
            ) : (
              <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value || currentMonthKey())} />
            )}
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Country Filter</span>
            <select className="input" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value || 'all')}>
              <option value="all">All Countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="helper">Search Country</span>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by country name" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="chip" style={{ fontWeight: 800 }}>{periodType === 'daily' ? 'Daily Report' : 'Monthly Report'}</span>
          <span className="helper">{periodLabel}</span>
          {periodType === 'monthly' ? <span className="helper">Includes expenses for the selected month.</span> : null}
        </div>
      </div>

      <div ref={reportRef} style={{ display: 'grid', gap: 12 }}>
        <div className="card" style={{ display: 'grid', gap: 6, padding: 18, borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{periodType === 'daily' ? 'Daily Closing Report' : 'Monthly Closing Report'}</div>
              <div className="helper">{periodLabel}</div>
            </div>
            <div className="helper">Generated {formatDateTime(new Date())}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {cards.map((item) => (
            <SummaryStat key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        {summary ? <CountryBlock row={{ ...summary, country: 'All Countries', currency: 'AED' }} summary periodType={periodType} /> : null}

        {loading ? (
          <div className="card"><div className="section">Loading closing report...</div></div>
        ) : filteredRows.length === 0 ? (
          <div className="card"><div className="section">No country totals found for {periodLabel}.</div></div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredRows.map((row) => (
              <CountryBlock key={row.country} row={row} periodType={periodType} />
            ))}
          </div>
        )}
      </div>

      {(exportOpen || generating) && exportDocument ? (
        <div style={{ position: 'fixed', left: -20000, top: 0, width: 1120, padding: 24, background: '#ffffff', zIndex: -1 }}>
          <div ref={exportRef} style={{ display: 'grid', gap: 14, background: '#ffffff' }}>
            <div style={{ display: 'grid', gap: 6, paddingBottom: 10, borderBottom: '2px solid rgba(148,163,184,0.18)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{exportDocument.title}</div>
              <div className="helper">{exportDocument.subtitle}</div>
              <div className="helper">Generated {formatDateTime(exportGeneratedAt || new Date())}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {exportDocument.cards.map((item) => (
                <SummaryStat key={item.label} label={item.label} value={item.value} />
              ))}
            </div>

            {exportDocument.focus?.kind === 'country' && exportDocument.focus?.row ? (
              <CountryBlock row={exportDocument.focus.row} summary periodType={periodType} />
            ) : null}

            {exportDocument.focus?.kind === 'agent' && exportDocument.focus?.row ? (
              <PersonBlock row={exportDocument.focus.row} type="agent" />
            ) : null}

            {exportDocument.focus?.kind === 'driver' && exportDocument.focus?.row ? (
              <PersonBlock row={exportDocument.focus.row} type="driver" />
            ) : null}

            {exportDocument.focus?.kind === 'all' && summary ? (
              <CountryBlock row={{ ...summary, country: 'All Countries', currency: 'AED' }} summary periodType={periodType} />
            ) : null}

            {exportDocument.countryRows.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Country Detail</div>
                {exportDocument.countryRows.map((row) => (
                  <CountryBlock key={`export-country-${row.country}`} row={row} periodType={periodType} />
                ))}
              </div>
            ) : null}

            {exportDocument.agentRows.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Agent Detail</div>
                {exportDocument.agentRows.map((row) => (
                  <PersonBlock key={`export-agent-${row.id}`} row={row} type="agent" />
                ))}
              </div>
            ) : null}

            {exportDocument.driverRows.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Driver Detail</div>
                {exportDocument.driverRows.map((row) => (
                  <PersonBlock key={`export-driver-${row.id}`} row={row} type="driver" />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
