import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '@/context/ThemeContext'
import { useAppStore } from '@/stores/appStore'
import { venuesService } from '@/services'

export function MainLayout() {
  const { t } = useTheme()
  const { sidebarOpen, sidebarCollapsed, sidebarHidden, closeSidebar } = useAppStore()
  const [venues, setVenues] = useState([])
  const location = useLocation()
  const isPosRoute = location.pathname === '/app/pos' || location.pathname.startsWith('/app/pos/')

  useEffect(() => {
    venuesService.fetchVenuesWithSites().then(setVenues)
  }, [])

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        background: t.bg,
        minHeight: '100vh',
        color: t.text,
      }}
    >
      <div className={`sidebar-wrap${sidebarOpen ? ' open' : ''}${sidebarCollapsed ? ' collapsed' : ''}${sidebarHidden ? ' sidebar-hidden' : ''}`}>
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            zIndex: 290,
          }}
        />
      )}
      <div
        className={`main-content${sidebarCollapsed ? ' collapsed' : ''}${sidebarHidden ? ' sidebar-hidden' : ''}`}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar venues={venues} />
        <div
          style={{
            padding: isPosRoute ? 0 : 'clamp(10px,2vw,24px)',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            ...(isPosRoute ? { display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}),
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}
