import { useState, useEffect } from 'react'

let _notif = null
export const notify = (msg, type = 'info', duration = 4000) => _notif && _notif(msg, type, duration)

export function NotificationCenter({ t }) {
  const [ns, setNs] = useState([])
  useEffect(() => {
    _notif = (msg, type, dur = 4000) => {
      const id = Date.now() + Math.random()
      setNs(n => [{ id, msg, type }, ...n.slice(0, 5)])
      setTimeout(() => setNs(n => n.filter(x => x.id !== id)), dur)
    }
  }, [])
  const cfg = {
    success: [t.green, t.greenBg, t.greenBorder, '✓'],
    error: [t.red, t.redBg, t.redBorder, '✕'],
    warning: [t.yellow, t.yellowBg, t.yellowBorder, '⚠'],
    info: [t.blue, t.blueBg, t.blueBorder, 'ℹ']
  }
  return (
    <div style={{ position: 'fixed', top: 60, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 320, pointerEvents: 'none' }}>
      {ns.map(n => {
        const [c, bg, bdr, ic] = cfg[n.type] || cfg.info
        return (
          <div key={n.id} style={{ background: bg, border: `1px solid ${bdr}`, borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', animation: 'slideInRight 0.25s ease', pointerEvents: 'auto' }}>
            <span style={{ color: c, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{ic}</span>
            <span style={{ fontSize: 13, color: t.text, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{n.msg}</span>
            <button onClick={() => setNs(x => x.filter(i => i.id !== n.id))} style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: 14, padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        )
      })}
    </div>
  )
}
