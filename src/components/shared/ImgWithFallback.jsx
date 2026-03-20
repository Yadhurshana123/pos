import { useState } from 'react'

export function ImgWithFallback({ src, alt, style }) {
  const [err, setErr] = useState(false)
  const h = typeof style?.height === 'number' ? style.height : parseInt(style?.height)
  const fontSize = !isNaN(h) ? Math.min(12, Math.round(h * 0.15)) : 10
  if (err || !src) {
    return (
      <div style={{ ...style, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', fontSize, background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', flexShrink: 0, color: '#94a3b8', fontWeight: 800, textAlign: 'center', padding: 4 }}>
        PRODUCT
      </div>
    )
  }
  return <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setErr(true)} style={style} />
}
