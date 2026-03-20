import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useAppStore } from '@/stores/appStore'
import { useVenueStore } from '@/stores/venueStore'

const sectionLabels = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  customers: 'Customers',
  users: 'User Management',
  staff: 'Staff Management',
  audit: 'Audit Logs',
  banners: 'Banners',
  coupons: 'Coupons',
  'z-report': 'Z-Report',
  settings: 'Settings',
  venues: 'Venues & Sites',
  pos: 'POS Terminal',
  products: 'Products',
  inventory: 'Inventory',
  cashiers: 'Cashiers',
  counters: 'Counters',
  returns: 'Returns',
  reports: 'Reports',
  orders: 'Orders',
  hardware: 'Hardware',
  cash: 'Cash Management',
  shop: 'Shop',
  'my-orders': 'My Orders',
  tracking: 'Order Tracking',
  'staff-dashboard': 'Staff Dashboard',
  pickup: 'Pickup Orders',
  profile: 'My Profile',
}

export function Topbar({ venues = [] }) {
  const { t, darkMode, toggleDark } = useTheme()
  const { currentUser } = useAuth()
  const { toggleSidebar, notifications, markAllRead } = useAppStore()
  const { selectedVenueId, selectedSiteId, setVenue, setSite } = useVenueStore()
  const location = useLocation()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef()
  const isAdmin = currentUser?.role === 'admin'
  const selectedVenue = venues.find(v => v.id === selectedVenueId)

  const segment = location.pathname.split('/app/')[1] || 'dashboard'
  const label = sectionLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div style={{
      height: 48, background: t.topbar, borderBottom: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(10px,2vw,24px)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="mob-menu-btn" onClick={toggleSidebar} style={{
          background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8,
          padding: '4px 10px', cursor: 'pointer', fontSize: 16, color: t.text,
        }}>☰</button>
        <span style={{ color: t.accent, fontWeight: 900, fontSize: 14 }}>S</span>
        <span style={{ color: t.text, fontWeight: 700 }}>SCSTix</span>
        <span style={{ color: t.text4, fontSize: 12, marginLeft: 8 }}>›</span>
        <span style={{ color: t.text2, fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isAdmin && venues.length > 0 && (
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={selectedVenueId || ''}
              onChange={e => { setVenue(e.target.value || null); setSite(null) }}
              style={{
                background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8,
                padding: '4px 8px', fontSize: 11, color: t.text, cursor: 'pointer', maxWidth: 140,
              }}
            >
              <option value="">All Venues</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {selectedVenue?.sites?.length > 0 && (
              <select
                value={selectedSiteId || ''}
                onChange={e => setSite(e.target.value || null)}
                style={{
                  background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8,
                  padding: '4px 8px', fontSize: 11, color: t.text, cursor: 'pointer', maxWidth: 130,
                }}
              >
                <option value="">All Sites</option>
                {selectedVenue.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        )}
        <button onClick={toggleDark} title="Toggle dark mode" style={{
          background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8,
          padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: t.text,
        }}>{darkMode ? '☀️' : '🌙'}</button>

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={() => setBellOpen(o => !o)} style={{
            background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8,
            padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: t.text, position: 'relative',
          }}>
            🔔
            {unread > 0 && <span style={{
              position: 'absolute', top: -4, right: -4, background: t.accent, color: '#fff',
              borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, fontWeight: 900,
            }}>{unread}</span>}
          </button>
          {bellOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 300,
              background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 12,
              boxShadow: t.shadowLg, zIndex: 999, maxHeight: 360, overflow: 'auto',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Notifications</span>
                {unread > 0 && <button onClick={markAllRead} style={{
                  background: 'none', border: 'none', color: t.accent, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                }}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: t.text3, fontSize: 13 }}>No notifications</div>
              ) : notifications.slice(0, 10).map(n => (
                <div key={n.id} style={{
                  padding: '10px 16px', borderBottom: `1px solid ${t.border}`,
                  background: n.read ? 'transparent' : t.accent + '08',
                }}>
                  <div style={{ fontSize: 12, color: t.text, fontWeight: n.read ? 500 : 700 }}>{n.msg}</div>
                  <div style={{ fontSize: 10, color: t.text4, marginTop: 2 }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {currentUser && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: t.bg3, borderRadius: 8, padding: '3px 10px 3px 6px',
            border: `1px solid ${t.border}`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, color: '#fff',
            }}>{currentUser.avatar || currentUser.name?.charAt(0)}</div>
            <span className="hide-mobile" style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{currentUser.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
