import { useEffect } from 'react'
import { THEMES } from '@/lib/theme'

export const Modal = ({ title, onClose, children, t, width = 580, subtitle }) => {
  const theme = t || THEMES.light
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onClose])
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "clamp(0px,2vw,20px)" }} onClick={e => { if (e.target === e.currentTarget) onClose() }} data-modal-overlay="true">
      <style>{"@media(min-width:600px){[data-modal-overlay=true]{align-items:center!important;}}"}</style>
      <div style={{ background: theme.bg2, border: `1px solid ${theme.border}`, borderRadius: "clamp(10px,2vw,18px)", width: "100%", maxWidth: width, maxHeight: "92vh", overflow: "auto", boxShadow: "0 25px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, background: theme.bg2, zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: theme.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: theme.text3, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: theme.bg3, border: `1px solid ${theme.border}`, color: theme.text3, cursor: "pointer", padding: "6px 10px", borderRadius: 8, fontSize: 14, fontWeight: 700, marginLeft: 16 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}
