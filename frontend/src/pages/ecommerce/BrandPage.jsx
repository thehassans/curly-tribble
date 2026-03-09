import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiGet, mediaUrl } from '../../api'
import Header from '../../components/layout/Header'
import MobileBottomNav from '../../components/ecommerce/MobileBottomNav'
import PremiumFooter from '../../components/layout/PremiumFooter'
import FormattedPrice from '../../components/ui/FormattedPrice'
import { getCurrencyConfig, convert as fxConvert, formatMoney } from '../../util/currency'

const COUNTRY_TO_CURRENCY = {
  AE: 'AED', OM: 'OMR', SA: 'SAR', BH: 'BHD', IN: 'INR',
  KW: 'KWD', QA: 'QAR', PK: 'PKR', JO: 'JOD', US: 'USD',
  GB: 'GBP', CA: 'CAD', AU: 'AUD',
}

export default function BrandPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState('newest')
  const [ccyCfg, setCcyCfg] = useState(null)
  const [selectedCountry] = useState(() => {
    try { return localStorage.getItem('selected_country') || 'GB' } catch { return 'GB' }
  })

  const dispCcy = COUNTRY_TO_CURRENCY[selectedCountry] || 'SAR'

  useEffect(() => {
    getCurrencyConfig().then(setCcyCfg).catch(() => {})
  }, [])

  const convertPrice = useCallback((val, from) =>
    fxConvert(val, from || 'SAR', dispCcy, ccyCfg), [dispCcy, ccyCfg])

  // Load brand info
  useEffect(() => {
    if (!slug) return
    let alive = true
    ;(async () => {
      try {
        const res = await apiGet('/api/brands/public')
        if (!alive) return
        const list = Array.isArray(res?.brands) ? res.brands : []
        const found = list.find(b => (b.slug || b.name?.toLowerCase().replace(/\s+/g, '-')) === slug)
        setBrand(found || null)
      } catch { setBrand(null) }
    })()
    return () => { alive = false }
  }, [slug])

  // Load products
  const loadProducts = useCallback(async (pageNum = 1, newSort = sort, replace = true) => {
    if (!brand?.name) return
    const fn = replace ? setProducts : (prev => [...prev, ...[]]) // placeholder
    replace ? setLoading(true) : setLoadingMore(true)
    try {
      const res = await apiGet(
        `/api/products/public?brand=${encodeURIComponent(brand.name)}&page=${pageNum}&limit=24&sort=${newSort}&country=${encodeURIComponent(selectedCountry)}`
      )
      const items = Array.isArray(res?.products) ? res.products : []
      if (replace) {
        setProducts(items)
      } else {
        setProducts(prev => [...prev, ...items])
      }
      setHasMore(items.length === 24)
      setPage(pageNum)
    } catch {
      if (replace) setProducts([])
    } finally {
      replace ? setLoading(false) : setLoadingMore(false)
    }
  }, [brand?.name, selectedCountry, sort])

  useEffect(() => {
    if (brand) loadProducts(1, sort, true)
  }, [brand, sort])

  const handleSortChange = (newSort) => {
    setSort(newSort)
    loadProducts(1, newSort, true)
  }

  const resolveImg = (u) => {
    if (!u) return '/placeholder-product.svg'
    if (u.startsWith('http')) return u
    return mediaUrl(u) || '/placeholder-product.svg'
  }

  const brandLogoUrl = brand?.logo ? (brand.logo.startsWith('http') ? brand.logo : mediaUrl(brand.logo)) : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f4f4' }}>
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile Back Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center gap-3 px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-bold text-gray-900 text-base">{brand?.name || 'Brand'}</span>
      </div>

      {/* ── Brand Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          minHeight: 160,
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14 flex flex-col lg:flex-row items-center gap-6">
          {/* Logo */}
          <div
            className="flex-shrink-0 w-24 h-24 lg:w-32 lg:h-32 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brand.name} className="w-16 h-16 lg:w-24 lg:h-24 object-contain" />
            ) : (
              <span className="text-4xl lg:text-5xl font-black text-orange-400">
                {brand?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              Official Brand
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-white mb-2 tracking-tight">{brand?.name || slug}</h1>
            <p className="text-white/50 text-sm lg:text-base">
              {loading ? '...' : `${products.length}${hasMore ? '+' : ''} products available`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 lg:top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-500 hidden sm:block">
            {loading ? 'Loading...' : `${products.length}${hasMore ? '+' : ''} Results`}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400 font-medium">Sort:</span>
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'popular', label: 'Popular' },
              { value: 'price_asc', label: 'Price ↑' },
              { value: 'price_desc', label: 'Price ↓' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => handleSortChange(s.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  sort === s.value
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div className="max-w-7xl mx-auto px-3 lg:px-8 py-6 pb-28 lg:pb-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-4 bg-gray-100 rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">No products found</h3>
            <p className="text-gray-400 text-sm mb-6">This brand has no products available yet.</p>
            <Link to="/catalog" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {products.map(p => {
                const basePrice = Number(p.price) || 0
                const salePrice = Number(p.salePrice) || 0
                const hasDisc = salePrice > 0 && salePrice < basePrice
                const displayPrice = hasDisc ? salePrice : basePrice
                const discPct = hasDisc ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0
                const img = resolveImg((Array.isArray(p.images) && p.images[0]) || p.imagePath)
                const converted = convertPrice(displayPrice, p.baseCurrency)
                const link = p.slug ? `/products/${p.slug}` : `/product/${p._id}`
                return (
                  <Link
                    key={p._id}
                    to={link}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={e => { e.target.src = '/placeholder-product.svg' }}
                      />
                      {hasDisc && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          -{discPct}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">{p.name}</p>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <FormattedPrice
                          amount={converted}
                          currency={dispCcy}
                          size={11}
                          className="text-orange-600 font-black text-sm"
                        />
                        {hasDisc && (
                          <FormattedPrice
                            amount={convertPrice(basePrice, p.baseCurrency)}
                            currency={dispCcy}
                            size={9}
                            className="text-gray-300 text-xs line-through"
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => {
                    const next = page + 1
                    setLoadingMore(true)
                    apiGet(`/api/products/public?brand=${encodeURIComponent(brand.name)}&page=${next}&limit=24&sort=${sort}&country=${encodeURIComponent(selectedCountry)}`)
                      .then(res => {
                        const items = Array.isArray(res?.products) ? res.products : []
                        setProducts(prev => [...prev, ...items])
                        setHasMore(items.length === 24)
                        setPage(next)
                      })
                      .catch(() => {})
                      .finally(() => setLoadingMore(false))
                  }}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Loading...</>
                  ) : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <PremiumFooter />
      <MobileBottomNav />
    </div>
  )
}
