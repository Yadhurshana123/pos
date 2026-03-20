import { useState } from 'react'
import { THEMES } from '@/lib/theme'
import { fmt } from '@/lib/utils'
import { PRODUCT_IMAGES } from '@/lib/seed-data'

export const ProductCard = ({ p, onAdd, showAdd = true, t, compact = false, settings }) => {
  const theme = t || THEMES.light
  const img = p.image_url || p.image || PRODUCT_IMAGES[p.name] || `https://via.placeholder.com/300x200/e2e8f0/64748b?text=${encodeURIComponent(p.emoji)}`
  const [imgErr, setImgErr] = useState(false)
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden", boxShadow: theme.shadow, transition: "all 0.15s", cursor: "pointer", opacity: p.stock === 0 ? 0.5 : 1 }}
      onClick={() => showAdd && p.stock > 0 && onAdd && onAdd(p)}>
      <div style={{ position: "relative", background: theme.bg3, height: compact ? 80 : 120, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgErr
          ? <span style={{ fontSize: compact ? 32 : 44 }}>{p.emoji}</span>
          : <img src={img} alt={p.name} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        }
        {p.stock === 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>OUT OF STOCK</div>}
        {p.stock > 0 && p.stock <= 5 && <div style={{ position: "absolute", top: 6, right: 6, background: theme.red, color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800 }}>Only {p.stock} left!</div>}
      </div>
      <div style={{ padding: compact ? "8px 10px" : "10px 12px" }}>
        <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: theme.text, lineHeight: 1.3, marginBottom: 4 }}>{p.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: compact ? 12 : 14, fontWeight: 900, color: theme.green }}>{fmt(p.price, settings?.sym)}</span>
          {showAdd && p.stock > 0 && <span style={{ width: 22, height: 22, borderRadius: "50%", background: theme.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>+</span>}
        </div>
      </div>
    </div>
  )
}
