import { useState } from 'react'
import { fmt } from '@/lib/utils'

export const CardTerminal = ({ total, onApproved, settings, t }) => {
  const [status, setStatus] = useState('idle')
  const tap = () => {
    if (status !== 'idle') return
    setStatus('processing')
    setTimeout(() => { setStatus('approved'); onApproved() }, 1500)
  }
  return (
    <div style={{ marginTop: 4, background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 9, color: t.text4, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Card Terminal</div>
      {status === 'idle' && (
        <div onClick={tap} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#0a0f1e', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', border: '1px dashed #334155' }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>TAP / INSERT / SWIPE</span>
        </div>
      )}
      {status === 'processing' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
          <div style={{ width: 14, height: 14, border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: t.text3, fontWeight: 700 }}>Processing...</span>
        </div>
      )}
      {status === 'approved' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: t.green }}>APPROVED — {fmt(total, settings?.sym)}</span>
        </div>
      )}
    </div>
  )
}
