import React, { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../../api'
import { normalizeCurrencyConfig } from '../../util/currency'
import { COUNTRY_LIST } from '../../utils/constants'
import { loadCountryRegistry } from '../../util/countryRegistry'

function deriveCurrencyCodes(cfg, countries = []) {
  return Array.from(new Set([
    'AED',
    ...(Object.keys(cfg?.perAED || {}).map((code) => String(code || '').toUpperCase())),
    ...((cfg?.enabled || []).map((code) => String(code || '').toUpperCase())),
    ...((countries || []).map((country) => String(country?.currency || '').toUpperCase()).filter(Boolean)),
  ])).filter(Boolean)
}

function deriveAnchorRates(perAED = {}, anchor = 'AED', currencyCodes = []) {
  const base = String(anchor || 'AED').toUpperCase()
  const basePerAED = base === 'AED' ? 1 : Number(perAED?.[base]) || 0
  return Object.fromEntries(currencyCodes.map((code) => {
    if (code === base) return [code, 1]
    if (code === 'AED') return [code, basePerAED > 0 ? 1 / basePerAED : '']
    const value = Number(perAED?.[code]) || 0
    return [code, basePerAED > 0 && value > 0 ? value / basePerAED : '']
  }))
}

function derivePerAEDFromAnchorRates(rates = {}, anchor = 'AED', currencyCodes = [], fallback = {}) {
  const base = String(anchor || 'AED').toUpperCase()
  const next = { ...fallback, AED: 1 }
  const basePerAED = base === 'AED'
    ? 1
    : (Number(rates?.AED) > 0 ? 1 / Number(rates.AED) : Number(fallback?.[base]) || 0)

  if (base !== 'AED' && basePerAED > 0) next[base] = basePerAED
  for (const code of currencyCodes) {
    if (code === 'AED') {
      next.AED = 1
      continue
    }
    if (code === base) {
      if (basePerAED > 0) next[code] = basePerAED
      else if (!(code in next)) next[code] = 0
      continue
    }
    const displayValue = Number(rates?.[code])
    if (basePerAED > 0 && Number.isFinite(displayValue) && displayValue > 0) next[code] = displayValue * basePerAED
    else if (!(code in next)) next[code] = 0
  }
  return next
}

export default function CurrencySettings(){
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [cfg, setCfg] = useState({ anchor:'AED', perAED:{}, enabled:[] })
  const [countries, setCountries] = useState(() => [...COUNTRY_LIST])

  useEffect(()=>{ (async()=>{
    setLoading(true)
    try{
      const [res, countryRegistry] = await Promise.all([
        apiGet('/api/settings/currency'),
        loadCountryRegistry(true).catch(() => COUNTRY_LIST),
      ])
      const norm = normalizeCurrencyConfig(res||{})
      setCountries([...(countryRegistry || COUNTRY_LIST)])
      setCfg({
        anchor: norm.anchor || 'AED',
        perAED: { ...(norm.perAED||{}) },
        enabled: Array.isArray(norm.enabled) ? norm.enabled : []
      })
    }catch(e){ setErr(e?.message || 'Failed to load settings') }
    finally{ setLoading(false) }
  })() }, [])

  useEffect(() => {
    function handleCountriesChanged(event) {
      const nextCountries = Array.isArray(event?.detail?.countries) ? event.detail.countries : COUNTRY_LIST
      setCountries([...(nextCountries || [])])
    }
    window.addEventListener('countryRegistryChanged', handleCountriesChanged)
    return () => window.removeEventListener('countryRegistryChanged', handleCountriesChanged)
  }, [])

  const currencyCodes = useMemo(() => deriveCurrencyCodes(cfg, countries), [cfg, countries])
  const anchorRates = useMemo(() => deriveAnchorRates(cfg.perAED, cfg.anchor, currencyCodes), [cfg.anchor, cfg.perAED, currencyCodes])

  useEffect(() => {
    const dynamicCodes = (countries || []).map((country) => String(country?.currency || '').toUpperCase()).filter(Boolean)
    if (!dynamicCodes.length) return
    setCfg((current) => {
      const nextEnabled = Array.from(new Set([...(current.enabled || []), ...dynamicCodes]))
      const nextPerAED = { ...(current.perAED || {}) }
      let changed = nextEnabled.length !== (current.enabled || []).length
      for (const code of dynamicCodes) {
        if (!(code in nextPerAED)) {
          nextPerAED[code] = code === 'AED' ? 1 : 0
          changed = true
        }
      }
      return changed ? { ...current, enabled: nextEnabled, perAED: nextPerAED } : current
    })
  }, [countries])

  function onChangeAnchorRate(code, value){
    const v = Number(value)
    setCfg((current) => {
      const currentCodes = deriveCurrencyCodes(current, countries)
      const currentRates = deriveAnchorRates(current.perAED, current.anchor, currentCodes)
      const nextRates = { ...currentRates, [code]: Number.isFinite(v) && v >= 0 ? v : '' }
      const nextPerAED = derivePerAEDFromAnchorRates(nextRates, current.anchor, currentCodes, current.perAED)
      return { ...current, perAED: nextPerAED }
    })
  }

  async function onSave(){
    setSaving(true)
    setMsg('')
    setErr('')
    try{
      // Derive legacy fields for backward compatibility
      const per = Object.fromEntries(currencyCodes.map(c=>[c, Number(cfg.perAED?.[c]||0)]))
      const sarPerUnit = {}
      const pkrPerUnit = {}
      const perSAR = per.SAR || 1
      const perPKR = per.PKR || 0
      for (const k of currencyCodes){
        const perK = per[k] || 0
        sarPerUnit[k] = (k==='SAR') ? 1 : (perK>0 ? (perSAR / perK) : '')
        pkrPerUnit[k] = (k==='PKR') ? 1 : (perK>0 ? (perPKR / perK) : '')
      }
      const body = {
        anchor: cfg.anchor || 'AED',
        perAED: cfg.perAED,
        enabled: cfg.enabled,
        // legacy fields for older services
        sarPerUnit,
        pkrPerUnit,
      }
      await apiPost('/api/settings/currency', body)
      setMsg('Saved')
      setTimeout(()=> setMsg(''), 1500)
    }catch(e){ setErr(e?.message || 'Failed to save') }
    finally{ setSaving(false) }
  }

  return (
    <div className="section" style={{display:'grid', gap:12}}>
      <div className="page-header" style={{marginBottom:12}}>
        <div>
          <div className="page-title gradient heading-blue">Currency Conversion</div>
          <div className="page-subtitle">Choose a base currency, manage conversion rates, and automatically include currencies from your country registry for dashboards and finance calculations.</div>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="section">Loading…</div></div>
      ) : (
        <div className="card" style={{display:'grid', gap:14}}>
          <div className="section" style={{display:'grid', gap:10}}>
            <div className="label">Base Currency</div>
            <div className="helper">Choose the anchor currency for editing rates. The app still saves a canonical conversion map in the background.</div>
            <select className="input" value={cfg.anchor} onChange={(e)=> setCfg(c => ({ ...c, anchor: String(e.target.value || 'AED').toUpperCase() }))}>
              {currencyCodes.map((ccy) => (
                <option key={ccy} value={ccy}>{ccy}</option>
              ))}
            </select>
          </div>

          <div className="section" style={{display:'grid', gap:10}}>
            <div className="label">Enabled Currencies</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {currencyCodes.map(ccy => (
                <label key={ccy} className="badge" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  <input
                    type="checkbox"
                    checked={cfg.enabled.includes(ccy)}
                    onChange={(e)=> setCfg(c => ({ ...c, enabled: e.target.checked ? Array.from(new Set([...c.enabled, ccy])) : c.enabled.filter(x=>x!==ccy) }))}
                  /> {ccy}
                </label>
              ))}
            </div>
          </div>

          <div className="section" style={{display:'grid', gap:10}}>
            <div className="card-title">Currency per 1 {cfg.anchor}</div>
            <div className="helper">Rates automatically include currencies detected from your country registry. Update the amount of each currency that equals 1 unit of the selected base currency.</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10}}>
              {currencyCodes.map(ccy => (
                <label key={ccy} className="field">
                  <div>{ccy}</div>
                  <input type="number" step="0.0001" min="0" value={anchorRates[ccy] ?? ''} onChange={e=> onChangeAnchorRate(ccy, e.target.value)} />
                </label>
              ))}
            </div>
          </div>

          {/* PKR per unit is derived from perAED and saved for legacy services; no separate edit needed */}

          {(msg || err) && (
            <div className="section" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div className="helper" style={{color: err? '#dc2626' : '#16a34a', fontWeight:700}}>{err || msg}</div>
              <div />
            </div>
          )}

          <div className="section" style={{display:'flex', justifyContent:'flex-end', gap:8}}>
            <button type="button" className="btn" onClick={onSave} disabled={saving}>{saving? 'Saving…' : 'Save Settings'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
