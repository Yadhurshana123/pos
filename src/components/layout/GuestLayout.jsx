import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { Btn } from '@/components/ui'

export function GuestLayout() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isProducts = location.pathname.startsWith('/shop')
  const isOnlineStore = location.pathname === '/online-store'
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navTo = (path) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: t.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          background: 'rgba(255,255,255,.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
          padding: '0 5%',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 20px rgba(0,0,0,.06)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg,${t.accent},${t.accent2})`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
              boxShadow: `0 4px 12px ${t.accent}40`,
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: t.text, letterSpacing: -0.5 }}>
              SCSTix EPOS
            </div>
            <div
              style={{
                fontSize: 10,
                color: t.text3,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Merchandise Store
            </div>
          </div>
        </div>
        <div className="mob-hide" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => navTo('/')}
            style={{
              padding: '8px 22px',
              borderRadius: 10,
              border: `2px solid ${isHome ? t.accent : 'transparent'}`,
              background: isHome ? t.accent + '15' : 'transparent',
              color: isHome ? t.accent : t.text2,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Home
          </button>
          <button
            onClick={() => navTo('/shop')}
            style={{
              padding: '8px 22px',
              borderRadius: 10,
              border: `2px solid ${isProducts ? t.accent : 'transparent'}`,
              background: isProducts ? t.accent + '15' : 'transparent',
              color: isProducts ? t.accent : t.text2,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Products
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="mob-hide" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn t={t} variant="ghost" size="sm" onClick={() => navTo('/register')}>
              Register
            </Btn>
            <Btn
              t={t}
              size="sm"
              onClick={() => navTo('/login')}
              style={{ boxShadow: `0 4px 14px ${t.accent}40` }}
            >
              Sign In →
            </Btn>
          </div>
          
          <div className="mob-show hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: isMenuOpen ? 0 : 1 }}></span>
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mob-show nav-menu-mobile ${isMenuOpen ? 'open' : ''}`}>
        <button onClick={() => navTo('/')} style={{ padding: '12px', textAlign: 'left', background: isHome ? t.bg2 : 'none', border: 'none', borderRadius: 8, color: isHome ? t.accent : t.text, fontWeight: 700, fontSize: 16 }}>Home</button>
        <button onClick={() => navTo('/shop')} style={{ padding: '12px', textAlign: 'left', background: isProducts ? t.bg2 : 'none', border: 'none', borderRadius: 8, color: isProducts ? t.accent : t.text, fontWeight: 700, fontSize: 16 }}>Products</button>
        <div style={{ height: 1, background: t.border, margin: '4px 0' }} />
        <button onClick={() => navTo('/register')} style={{ padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: t.text, fontWeight: 700, fontSize: 16 }}>Register</button>
        <Btn t={t} fullWidth onClick={() => navTo('/login')}>Sign In →</Btn>
      </div>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      {/* FOOTER */}
      <div
        style={{
          background: '#0f172a',
          color: '#94a3b8',
          padding: '40px 5% 24px',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg,#dc2626,#7f1d1d)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              S
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>SCSTix EPOS</div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 340, marginBottom: 20 }}>
            Your merchandise destination - browse products, accessories, equipment and collectibles.
          </div>
          <div
            style={{
              borderTop: '1px solid #1e293b',
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
            }}
          >
            <span>© 2025 SCSTix EPOS. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service', 'Returns'].map((l) => (
                <span key={l} style={{ cursor: 'pointer' }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
