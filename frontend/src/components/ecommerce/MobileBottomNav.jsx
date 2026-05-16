import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react'
import { readWishlistIds } from '../../util/wishlist'
import { readCartItems } from '../../utils/cartStorage'

const checkLoggedIn = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token || token === 'null') return false
    const me = JSON.parse(localStorage.getItem('me') || 'null')
    return !!me && me.role === 'customer'
  } catch { return false }
}

export default function MobileBottomNav({ onCartClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(() => checkLoggedIn())

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = readCartItems()
        setCartCount(cart.reduce((s, i) => s + (i.quantity || 1), 0))
      } catch {}
    }
    const updateWishlist = () => {
      try { setWishlistCount(readWishlistIds().length) } catch { setWishlistCount(0) }
    }
    const updateAuth = () => setLoggedIn(checkLoggedIn())

    updateCart()
    updateWishlist()

    window.addEventListener('cartUpdated', updateCart)
    window.addEventListener('wishlistUpdated', updateWishlist)
    window.addEventListener('storage', updateCart)
    window.addEventListener('storage', updateWishlist)
    window.addEventListener('storage', updateAuth)

    return () => {
      window.removeEventListener('cartUpdated', updateCart)
      window.removeEventListener('wishlistUpdated', updateWishlist)
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('storage', updateWishlist)
      window.removeEventListener('storage', updateAuth)
    }
  }, [])

  const navItems = [
    { id: 'home',     label: 'Home',    icon: Home,         path: '/' },
    { id: 'discover', label: 'Discover', icon: Search,       path: '/catalog' },
    { id: 'cart',     label: 'Cart',    icon: ShoppingCart,  path: '/cart',              badge: cartCount },
    ...(loggedIn ? [{ id: 'wishlist', label: 'Saved', icon: Heart, path: '/customer/wishlist', badge: wishlistCount }] : []),
    { id: 'profile',  label: 'Profile', icon: User,          action: 'profile' },
  ]

  const isActive = (item) => {
    if (item.id === 'profile') return location.pathname.startsWith('/customer')
    if (item.path === '/') return location.pathname === '/'
    if (!item.path) return false
    return location.pathname.startsWith(item.path)
  }

  const handleNavClick = (item) => {
    if (item.action === 'profile') {
      navigate(loggedIn ? '/customer' : '/customer/login')
    } else if (item.id === 'cart') {
      if (onCartClick) onCartClick()
      else navigate('/cart')
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const NavContent = (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 6,
      }}
      className="md:hidden"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 9999,
          padding: '6px 4px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 14px',
                borderRadius: 9999,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.55)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Active glow blob */}
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(99,102,241,0.25)',
                    filter: 'blur(14px)',
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                <Icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{ color: active ? '#111827' : 'rgba(107,114,128,0.85)', display: 'block', transition: 'color 0.2s' }}
                />
                {item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -9,
                      background: '#f97316',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 9999,
                      minWidth: 14,
                      height: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      lineHeight: 1,
                      zIndex: 2,
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#111827' : 'rgba(107,114,128,0.85)',
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 1,
                  transition: 'color 0.2s, font-weight 0.2s',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      <div className="h-24 md:hidden" />
      {typeof document !== 'undefined' && document.body
        ? createPortal(NavContent, document.body)
        : NavContent}
    </>
  )
}
