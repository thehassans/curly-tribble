import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiGet, mediaUrl } from '../../api'
import MobileBottomNav from '../../components/ecommerce/MobileBottomNav'
import Header from '../../components/layout/Header'
import PremiumFooter from '../../components/layout/PremiumFooter'

const SORT_OPTIONS = [
  { value: 'newest', label: 'New' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: '↑ Price' },
  { value: 'price_desc', label: '↓ Price' },
]

function resolveImg(u) {
  if (!u) return null
  if (u.startsWith('http')) return u
  return mediaUrl(u) || null
}

function PriceDisplay({ amount, currency }) {
  if (!amount) return null
  const sym = { SAR: '﷼', AED: 'د.إ', USD: '$', GBP: '£', EUR: '€' }[currency] || currency + ' '
  return <span>{sym}{Number(amount).toFixed(2)}</span>
}

export default function BrandPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [brand, setBrand] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [selectedCountry] = useState(() => {
    try { return localStorage.getItem('selected_country') || 'GB' } catch { return 'GB' }
  })
  const currency = { AE: 'AED', OM: 'OMR', SA: 'SAR', BH: 'BHD', IN: 'INR', KW: 'KWD', QA: 'QAR', PK: 'PKR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD' }[selectedCountry] || 'SAR'

  // 1. Load brand info
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await apiGet('/api/brands/public')
        if (!alive) return
        const list = Array.isArray(res?.brands) ? res.brands : []
        const found = list.find(b => {
          const bSlug = b.slug || b.name?.toLowerCase().replace(/\s+/g, '-')
          return bSlug === slug || b.name?.toLowerCase() === slug?.toLowerCase()
        })
        setBrand(found || null)
      } catch { setBrand(null) }
    })()
    return () => { alive = false }
  }, [slug])

  // 2. Load products filtered strictly to this brand
  const loadPage = useCallback(async (pageNum, sortVal, replace) => {
    if (!brand?.name) return
    replace ? setLoading(true) : setLoadingMore(true)
    try {
      // Fetch a bigger page so we can filter client-side too
      const res = await apiGet(
        `/api/products/public?brand=${encodeURIComponent(brand.name)}&page=${pageNum}&limit=24&sort=${sortVal}&country=${encodeURIComponent(selectedCountry)}`
      )
      const raw = Array.isArray(res?.products) ? res.products : []
      // Extra safety: keep only products whose brand matches
      const filtered = raw.filter(p => {
        const pBrand = (p.brand || p.brandName || '').toLowerCase().trim()
        const bName = brand.name.toLowerCase().trim()
        return !pBrand || pBrand === bName
      })
      if (replace) {
        setAllProducts(filtered)
      } else {
        setAllProducts(prev => [...prev, ...filtered])
      }
      setHasMore(raw.length === 24)
      setPage(pageNum)
    } catch {
      if (replace) setAllProducts([])
      setHasMore(false)
    } finally {
      replace ? setLoading(false) : setLoadingMore(false)
    }
  }, [brand?.name, selectedCountry])

  useEffect(() => {
    if (brand) loadPage(1, sort, true)
  }, [brand, sort])

  const brandLogo = brand?.logo ? resolveImg(brand.logo) : null
  const displayedCount = allProducts.length

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Desktop header */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* ── Mobile top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      }} className="lg:hidden">
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#f4f4f4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <svg width="18" height="18" fill="none" stroke="#111" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#111', flex: 1 }}>{brand?.name || slug}</span>
      </div>

      {/* ── Brand Hero — ultra-minimalist ── */}
      <div style={{
        background: '#0a0a0a',
        padding: '40px 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Logo circle */}
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {brandLogo ? (
            <img src={brandLogo} alt={brand.name} style={{ width: 64, height: 64, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 36, fontWeight: 900, color: '#f97316' }}>
              {brand?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            {brand?.name || slug}
          </h1>
          {!loading && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666' }}>
              {displayedCount}{hasMore ? '+' : ''} products
            </p>
          )}
        </div>
      </div>

      {/* ── Sort bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        position: 'sticky',
        top: 61,
        zIndex: 40,
      }} className="lg:static">
        <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap', fontWeight: 500 }}>Sort:</span>
        {SORT_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              background: sort === s.value ? '#0a0a0a' : '#f4f4f4',
              color: sort === s.value ? '#fff' : '#555',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Products ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 12px 120px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1', background: '#f0f0f0' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 12, background: '#f0f0f0', borderRadius: 6, width: '75%', marginBottom: 8 }} />
                  <div style={{ height: 14, background: '#f0f0f0', borderRadius: 6, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#111' }}>No products yet</h3>
            <p style={{ color: '#999', margin: '8px 0 20px', fontSize: 14 }}>This brand has no products available right now.</p>
            <Link to="/catalog" style={{ padding: '12px 24px', background: '#0a0a0a', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }} className="sm:!grid-cols-3 lg:!grid-cols-4 xl:!grid-cols-5">
              {allProducts.map(p => {
                const base = Number(p.price) || 0
                const sale = Number(p.salePrice) || 0
                const hasDisc = sale > 0 && sale < base
                const display = hasDisc ? sale : base
                const discPct = hasDisc ? Math.round(((base - sale) / base) * 100) : 0
                const imgs = Array.isArray(p.images) ? p.images : []
                const imgSrc = resolveImg(imgs[0] || p.imagePath)
                const link = p.slug ? `/products/${p.slug}` : `/product/${p._id}`
                return (
                  <Link
                    key={p._id}
                    to={link}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{
                      background: '#fff',
                      borderRadius: 16,
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
                    >
                      {/* Image */}
                      <div style={{ position: 'relative', aspectRatio: '1', background: '#f8f8f8', overflow: 'hidden' }}>
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                            loading="lazy"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 32, opacity: 0.2 }}>📦</span>
                          </div>
                        )}
                        {hasDisc && (
                          <span style={{
                            position: 'absolute', top: 8, left: 8,
                            background: '#ef4444', color: '#fff',
                            fontSize: 10, fontWeight: 800,
                            padding: '2px 6px', borderRadius: 20,
                          }}>-{discPct}%</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '10px 12px 12px' }}>
                        <p style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#111',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: 8,
                        }}>
                          {p.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#f97316' }}>
                            <PriceDisplay amount={display} currency={currency} />
                          </span>
                          {hasDisc && (
                            <span style={{ fontSize: 11, color: '#ccc', textDecoration: 'line-through' }}>
                              <PriceDisplay amount={base} currency={currency} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                <button
                  onClick={() => loadPage(page + 1, sort, false)}
                  disabled={loadingMore}
                  style={{
                    padding: '14px 40px', background: '#0a0a0a', color: '#fff',
                    border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14,
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {loadingMore && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg) }}`}</style>
          </>
        )}
      </div>

      <div className="hidden lg:block">
        <PremiumFooter />
      </div>
      <MobileBottomNav />
    </div>
  )
}
