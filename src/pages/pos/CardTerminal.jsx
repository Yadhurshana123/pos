/**
 * Simulated contactless strip — tap triggers parent flow (authorizing overlay).
 */
export const CardTerminal = ({ onTapComplete, disabled, settings, t }) => {
  const tap = () => {
    if (disabled) return
    onTapComplete?.()
  }

  return (
    <div style={{ marginTop: 4, background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 9, color: t.text4, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Card Terminal</div>
      <div
        onClick={tap}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && tap()}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: disabled ? '#1e293b' : '#0a0f1e',
          borderRadius: 7,
          padding: '6px 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: '1px dashed #334155',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span style={{ fontSize: 16 }}>💳</span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>TAP / INSERT / SWIPE</span>
      </div>
    </div>
  )
}
