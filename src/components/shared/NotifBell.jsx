import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui'

export function NotifBell({ notifs, setNotifs, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: t.text, position: 'relative' }}>
        🔔
        {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: t.accent, color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 300, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: t.shadowLg, zIndex: 999, maxHeight: 360, overflow: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Notifications</span>
            {unread > 0 && <button onClick={() => setNotifs(ns => ns.map(n => ({ ...n, read: true })))} style={{ background: 'none', border: 'none', color: t.accent, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: t.text3, fontSize: 13 }}>No notifications</div>
          ) : notifs.slice(0, 10).map(n => (
            <div key={n.id} onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{ padding: '10px 16px', borderBottom: `1px solid ${t.border}`, cursor: 'pointer', background: n.read ? 'transparent' : t.accent + '08' }}>
              <div style={{ fontSize: 12, color: t.text, fontWeight: n.read ? 500 : 700 }}>{n.msg}</div>
              <div style={{ fontSize: 10, color: t.text4, marginTop: 2 }}>{n.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
