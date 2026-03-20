import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { fmt } from '@/lib/utils'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { ImgWithFallback } from '@/components/shared'

export function GuestHomePage({ products = [], banners = [], settings = {} }) {
  const { t } = useTheme()
  const navigate = useNavigate()
  const [bIdx, setBIdx] = useState(0)

  const active = banners.filter(b => b.active)
  const allActiveOffers = banners.filter(b => b.active && b.offerType === 'category')
  const getGuestDisc = (p) => {
    const o = allActiveOffers.find(b => b.offerTarget === p.category)
    return Math.max(o ? o.offerDiscount : 0, p.discount || 0)
  }
  const featured = products.filter(p => p.featured && p.stock > 0)
  const currentBanner = active[bIdx]

  useEffect(() => {
    if (active.length < 2) return
    const i = setInterval(() => setBIdx(x => (x + 1) % active.length), 4500)
    return () => clearInterval(i)
  }, [active.length])

  const goToProductDetail = (p) => {
    navigate(`/product/${p.id}`, { state: { product: p } })
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg }}>
      {/* HERO BANNER */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(320px,55vw,520px)' }}>
        {active.length > 0 ? (
          <>
            <div key={bIdx} style={{ position: 'absolute', inset: 0, background: currentBanner?.grad || t.gradHero }}>
              {currentBanner?.image && <img src={currentBanner.image} alt={currentBanner.title} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.85 }} onError={e => { e.target.style.display = 'none' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,.65) 0%,rgba(0,0,0,.2) 60%,transparent 100%)' }} />
            </div>
            <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 5%', height: '100%', display: 'flex', alignItems: 'center' }}>
              <div style={{ color: '#fff', maxWidth: 560 }}>
                {currentBanner?.offerDiscount > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: t.accent, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, marginBottom: 16 }}>🔥 {currentBanner.offerDiscount}% OFF {currentBanner.offerTarget?.toUpperCase()}</div>}
                <div style={{ fontSize: 'clamp(26px,5.5vw,54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: -1, textShadow: '0 2px 20px rgba(0,0,0,.3)' }}>{currentBanner?.title || 'SCSTix EPOS'}</div>
                <div style={{ fontSize: 'clamp(15px,2vw,19px)', opacity: 0.9, marginBottom: 28, lineHeight: 1.5 }}>{currentBanner?.subtitle}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => navigate('/shop')} style={{ background: '#fff', color: currentBanner?.color || t.accent, border: 'none', borderRadius: 12, padding: 'clamp(10px,2vw,14px) 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,.2)', width: 'fit-content' }}>Shop Now →</button>
                  <button onClick={() => navigate('/register')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.5)', borderRadius: 12, padding: 'clamp(10px,2vw,14px) 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)', width: 'fit-content' }}>Register Free</button>
                </div>
              </div>
            </div>
            {active.length > 1 && <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>{active.map((_, i) => <div key={i} onClick={() => setBIdx(i)} style={{ width: i === bIdx ? 28 : 8, height: 8, borderRadius: 4, background: `rgba(255,255,255,${i === bIdx ? 1 : 0.4})`, cursor: 'pointer', transition: 'all .3s' }} />)}</div>}
          </>
        ) : (
          <div style={{ background: t.gradHero, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 80, marginBottom: 20, width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, margin: '0 auto' }}>S</div>
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2 }}>SCSTix EPOS</div>
              <div style={{ fontSize: 18, opacity: 0.8, marginTop: 10, marginBottom: 28 }}>Official Merchandise &amp; Collectibles</div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                <button onClick={() => navigate('/shop')} style={{ background: '#fff', color: '#dc2626', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Shop Now →</button>
                <button onClick={() => navigate('/register')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.5)', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Register</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PERKS BAR */}
      <div style={{ background: t.accent, padding: '16px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[['🚚', 'Free Delivery', `Orders over ${settings?.sym || '£'}100`], ['🔄', '30-Day Returns', 'Hassle-free'], ['⭐', 'Loyalty Rewards', 'Earn on every purchase'], ['🔒', 'Secure Checkout', '100% protected']].map(([ic, t1, t2]) => (
            <div key={t1} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
              <span style={{ fontSize: 22 }}>{ic}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{t1}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{t2}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROMOTIONS STRIP */}
      {active.filter(b => b.offerDiscount > 0).length > 0 && (
        <div style={{ background: t.yellowBg, borderBottom: `1px solid ${t.yellowBorder}`, padding: '12px 5%', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: t.yellow, whiteSpace: 'nowrap' }}>🏷️ TODAY&apos;S OFFERS:</span>
            {active.filter(b => b.offerDiscount > 0).map(b => (
              <span key={b.id} style={{ background: t.accent, color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{b.offerDiscount}% off {b.offerTarget}</span>
            ))}
          </div>
        </div>
      )}

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <div style={{ background: t.bg2, padding: '48px 5%' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
              <div><div style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: -0.5 }}>⭐ Featured Items</div><div style={{ fontSize: 14, color: t.text3, marginTop: 4 }}>Handpicked for true fans</div></div>
              <button onClick={() => navigate('/shop')} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 9, padding: '8px 18px', color: t.text2, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>View All →</button>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
              {featured.slice(0, 6).map(p => {
                const disc = getGuestDisc(p)
                return (
                  <div key={p.id} style={{ flexShrink: 0, width: 220, background: t.card, border: `1px solid ${disc > 0 ? t.accent : t.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: t.shadowMd, transition: 'transform .2s,box-shadow .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = t.shadowLg }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = t.shadowMd }}>
                    <div style={{ height: 190, background: t.bg3, overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => goToProductDetail(p)}>
                      <ImgWithFallback src={p.image_url || p.image || PRODUCT_IMAGES[p.name]} alt={p.name} emoji={p.emoji} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 10, left: 10, background: t.accent, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 900 }}>FEATURED</div>
                      {disc > 0 && <div style={{ position: 'absolute', top: 10, right: 10, background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 900 }}>-{disc}% OFF</div>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: t.text3, marginBottom: 3 }}>{p.category}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 8, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div>
                          {disc > 0 ? <><div style={{ fontSize: 11, color: t.text4, textDecoration: 'line-through' }}>{fmt(p.price, settings?.sym)}</div><div style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>{fmt(p.price * (1 - disc / 100), settings?.sym)}</div></> : <span style={{ fontSize: 18, fontWeight: 900, color: t.green }}>{fmt(p.price, settings?.sym)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => goToProductDetail(p)} style={{ background: t.bg3, color: t.text2, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Details</button>
                          <button onClick={() => p.sizes?.length > 1 ? goToProductDetail(p) : undefined} style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Add</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
