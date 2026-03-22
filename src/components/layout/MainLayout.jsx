import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '@/context/ThemeContext'
import { useAppStore } from '@/stores/appStore'
import { venuesService } from '@/services'

export function MainLayout() {
  const { t } = useTheme()
  const { sidebarOpen, sidebarCollapsed, closeSidebar, toggleSidebarCollapsed } = useAppStore()
  const [venues, setVenues] = useState([])
  const location = useLocation()
  const isPosRoute = location.pathname === '/app/pos'

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
      <div className={`sidebar-wrap${sidebarOpen ? ' open' : ''}${sidebarCollapsed ? ' collapsed' : ''}`}>
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
      {!isPosRoute && <Topbar venues={venues} />}
      <div
        className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 0,
          paddingTop: isPosRoute ? 0 : 48,
        }}
      >
        <div
          style={{
            padding: isPosRoute ? 0 : '24px 30px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}
