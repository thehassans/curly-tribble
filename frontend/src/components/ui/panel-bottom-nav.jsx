import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Boxes,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  MapPinned,
  Package,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react'

import LumaBar from '@/components/ui/futuristic-nav'

function matchesPath(pathname, href) {
  if (!href) return false
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

function getPanelItems(pathname) {
  if (pathname.startsWith('/user')) {
    return [
      { id: 'home', to: '/user', label: 'Home', icon: <Home size={22} /> },
      { id: 'orders', to: '/user/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'products', to: '/user/products', label: 'Products', icon: <Package size={22} /> },
      { id: 'alerts', to: '/user/notifications', label: 'Alerts', icon: <Bell size={22} /> },
      { id: 'reports', to: '/user/reports', label: 'Reports', icon: <FileText size={22} /> },
      { id: 'settings', to: '/user/configuration', label: 'Settings', icon: <Settings size={22} /> },
    ]
  }

  if (pathname.startsWith('/manager')) {
    return [
      { id: 'home', to: '/manager', label: 'Home', icon: <LayoutDashboard size={22} /> },
      { id: 'orders', to: '/manager/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'inbox', to: '/manager/inbox/whatsapp', label: 'Inbox', icon: <Bell size={22} /> },
      { id: 'products', to: '/manager/products', label: 'Products', icon: <Package size={22} /> },
      { id: 'stock', to: '/manager/my-stock', label: 'Stock', icon: <Boxes size={22} /> },
      { id: 'profile', to: '/manager/me', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/agent')) {
    return [
      { id: 'home', to: '/agent', label: 'Home', icon: <Home size={22} /> },
      { id: 'orders', to: '/agent/orders', label: 'Orders', icon: <ShoppingCart size={22} /> },
      { id: 'pending', to: '/agent/orders/pending', label: 'Pending', icon: <Search size={22} /> },
      { id: 'delivered', to: '/agent/orders/delivered', label: 'Delivered', icon: <Bookmark size={22} /> },
      { id: 'payout', to: '/agent/payout', label: 'Payout', icon: <Wallet size={22} /> },
      { id: 'profile', to: '/agent/me', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/driver')) {
    return [
      { id: 'home', to: '/driver', label: 'Home', icon: <Home size={22} /> },
      { id: 'deliveries', to: '/driver/panel', label: 'Deliveries', icon: <Truck size={22} /> },
      { id: 'map', to: '/driver/live-map', label: 'Map', icon: <MapPinned size={22} /> },
      { id: 'stock', to: '/driver/my-stock', label: 'Stock', icon: <Boxes size={22} /> },
      { id: 'payout', to: '/driver/payout', label: 'Payout', icon: <Wallet size={22} /> },
      { id: 'profile', to: '/driver/me', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/partner')) {
    return [
      { id: 'home', to: '/partner', label: 'Home', icon: <Home size={22} /> },
      { id: 'orders', to: '/partner/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'amounts', to: '/partner/total-amounts', label: 'Totals', icon: <Wallet size={22} /> },
      { id: 'purchasing', to: '/partner/purchasing', label: 'Buying', icon: <CreditCard size={22} /> },
      { id: 'drivers', to: '/partner/drivers', label: 'Drivers', icon: <Users size={22} /> },
      { id: 'track', to: '/partner/track', label: 'Track', icon: <MapPinned size={22} /> },
    ]
  }

  if (pathname.startsWith('/dropshipper')) {
    return [
      { id: 'home', to: '/dropshipper', label: 'Home', icon: <Home size={22} /> },
      { id: 'products', to: '/dropshipper/products', label: 'Products', icon: <Package size={22} /> },
      { id: 'orders', to: '/dropshipper/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'submit', to: '/dropshipper/submit-order', label: 'Submit', icon: <FileText size={22} /> },
      { id: 'finances', to: '/dropshipper/finances', label: 'Finances', icon: <Wallet size={22} /> },
      { id: 'shopify', to: '/dropshipper/shopify-connect', label: 'Shopify', icon: <Settings size={22} /> },
    ]
  }

  if (pathname.startsWith('/investor')) {
    return [
      { id: 'home', to: '/investor', label: 'Home', icon: <Home size={22} /> },
      { id: 'transactions', to: '/investor/transactions', label: 'Transactions', icon: <Wallet size={22} /> },
      { id: 'profile', to: '/investor/profile', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/commissioner')) {
    return [
      { id: 'home', to: '/commissioner/dashboard', label: 'Home', icon: <LayoutDashboard size={22} /> },
      { id: 'earnings', to: '/commissioner/earnings', label: 'Earnings', icon: <Wallet size={22} /> },
      { id: 'profile', to: '/commissioner/profile', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/confirmer')) {
    return [
      { id: 'home', to: '/confirmer', label: 'Home', icon: <LayoutDashboard size={22} /> },
      { id: 'orders', to: '/confirmer/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'profile', to: '/confirmer/profile', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/customer')) {
    return [
      { id: 'home', to: '/customer', label: 'Home', icon: <Home size={22} /> },
      { id: 'orders', to: '/customer/orders', label: 'Orders', icon: <ShoppingBag size={22} /> },
      { id: 'wishlist', to: '/customer/wishlist', label: 'Saved', icon: <Bookmark size={22} /> },
      { id: 'wallet', to: '/customer/wallet', label: 'Wallet', icon: <Wallet size={22} /> },
      { id: 'profile', to: '/customer/profile', label: 'Profile', icon: <User size={22} /> },
    ]
  }

  if (pathname.startsWith('/admin')) {
    return [
      { id: 'home', to: '/admin', label: 'Home', icon: <LayoutDashboard size={22} /> },
      { id: 'users', to: '/admin/users', label: 'Users', icon: <Users size={22} /> },
      { id: 'settings', to: '/admin/settings', label: 'Settings', icon: <Settings size={22} /> },
    ]
  }

  if (pathname.startsWith('/seo')) {
    return [
      { id: 'home', to: '/seo', label: 'Home', icon: <LayoutDashboard size={22} /> },
      { id: 'traffic', to: '/seo/traffic', label: 'Traffic', icon: <Search size={22} /> },
      { id: 'aeo', to: '/seo/aeo', label: 'AEO', icon: <Bell size={22} /> },
      { id: 'geo', to: '/seo/geo', label: 'GEO', icon: <MapPinned size={22} /> },
      { id: 'optimization', to: '/seo/optimization', label: 'Optimize', icon: <Settings size={22} /> },
    ]
  }

  return []
}

export default function PanelBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = useMemo(() => getPanelItems(location.pathname), [location.pathname])

  const activeIndex = useMemo(() => {
    const matchIndex = items.findIndex((item) => matchesPath(location.pathname, item.to))
    return matchIndex >= 0 ? matchIndex : 0
  }, [items, location.pathname])

  if (!items.length) return null

  return (
    <>
      <style>{`
        @media (max-width: 980px) {
          .mobile-tabs,
          .mobile-bottom-nav,
          .il-bottom-nav,
          .partner-bottom-nav,
          .dropshipper-mobile-tabs,
          .customer-mobile-tabs {
            display: none !important;
          }

          .main,
          .il-main,
          .customer-content,
          .dropshipper-content,
          .container {
            padding-bottom: 112px;
          }
        }

        @media (min-width: 981px) {
          .luma-panel-nav-root {
            display: none;
          }
        }
      `}</style>
      <LumaBar
        className="luma-panel-nav-root"
        items={items}
        active={activeIndex}
        onSelect={(item) => {
          if (item?.to) navigate(item.to)
        }}
      />
    </>
  )
}
