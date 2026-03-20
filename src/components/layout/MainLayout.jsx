import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '@/context/ThemeContext'
import { useAppStore } from '@/stores/appStore'
import { venuesService } from '@/services'

export function MainLayout() {
  const { t } = useTheme()
  const { sidebarOpen, closeSidebar } = useAppStore()
  const [venues, setVenues] = useState([])

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
      <div className={`sidebar-wrap${sidebarOpen ? ' open' : ''}`}>
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
        className="main-content"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar venues={venues} />
        <div
          style={{
            padding: 'clamp(10px,2vw,24px)',
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
