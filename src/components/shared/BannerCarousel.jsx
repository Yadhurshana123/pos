import { useState, useEffect } from 'react'

export function BannerCarousel({ banners = [], interval = 5000, t, onShopNow, onRegister }) {
  const active = banners.filter(b => b.active)
  const [bIdx, setBIdx] = useState(0)

  useEffect(() => {
    if (active.length < 2) return
    const timer = setInterval(() => setBIdx(i => (i + 1) % active.length), interval)
    return () => clearInterval(timer)
  }, [active.length, interval])

  if (active.length === 0) {
    return (
      <div style={{
        height: 'clamp(320px,55vw,520px)',
        background: t.gradHero || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(26px,5vw,54px)', fontWeight: 900, letterSpacing: -1 }}>SCSTix EPOS</div>
          <div style={{ fontSize: 19, opacity: 0.9, marginTop: 12 }}>Your Merchandise POS Solution</div>
        </div>
      </div>
    )
  }

  const current = active[bIdx]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(320px,55vw,520px)' }}>
      <div key={bIdx} style={{ position: 'absolute', inset: 0, background: current?.grad || t.gradHero }}>
        {current?.image && (
          <img
            src={current.image}
            alt={current.title}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.85 }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,.65) 0%,rgba(0,0,0,.2) 60%,transparent 100%)' }} />
      </div>
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 5%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', maxWidth: 560 }}>
          {current?.offerDiscount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: t.accent, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, marginBottom: 16 }}>
              🔥 {current.offerDiscount}% OFF {current.offerTarget?.toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: 'clamp(26px,5vw,54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: -1, textShadow: '0 2px 20px rgba(0,0,0,.3)' }}>
            {current?.title || 'SCSTix EPOS'}
          </div>
          <div style={{ fontSize: 19, opacity: 0.9, marginBottom: 28, lineHeight: 1.5 }}>{current?.subtitle}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {onShopNow && (
              <button onClick={onShopNow} style={{
                background: '#fff', color: current?.color || t.accent, border: 'none', borderRadius: 12,
                padding: '14px 28px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,.2)',
              }}>Shop Now →</button>
            )}
            {onRegister && (
              <button onClick={onRegister} style={{
                background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.5)',
                borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)',
              }}>Register Free</button>
            )}
          </div>
        </div>
      </div>
      {active.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {active.map((_, i) => (
            <button key={i} onClick={() => setBIdx(i)} style={{
              width: bIdx === i ? 28 : 10, height: 10, borderRadius: 5, border: 'none',
              background: bIdx === i ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer',
              transition: 'width 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
