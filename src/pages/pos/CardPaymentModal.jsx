import { fmt } from '@/lib/utils'

export function CardPaymentModal({
  open,
  onClose,
  read,
  cartTotal,
  displayAmount,
  settings,
  t,
  onConfirmPayment,
}) {
  if (!open || !read) return null

  const { maskedPan, expiry, authRef, sufficient } = read
  const amountDue = displayAmount != null ? Number(displayAmount) : Number(cartTotal)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: t.card || '#fff',
          borderRadius: 16,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Card payment — cashier
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: t.text, marginTop: 4 }}>Payment details</div>
          <div style={{ fontSize: 12, color: t.text3, marginTop: 6, lineHeight: 1.4 }}>
            Terminal read only. No cardholder name, address, or other personal data is shown.
          </div>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: '#0f172a',
              borderRadius: 12,
              color: '#e2e8f0',
            }}
          >
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Amount due</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#f87171' }}>{fmt(amountDue, settings?.sym)}</span>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>Card (masked)</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.text, letterSpacing: 0.5 }}>{maskedPan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>Expiry</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.text }}>{expiry}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'flex-start', gap: 12 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>Auth / ref #</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.accent, textAlign: 'right', wordBreak: 'break-all' }}>{authRef}</span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${sufficient ? t.green + '60' : t.red + '60'}`,
              background: sufficient ? (t.greenBg || '#ecfdf5') : (t.redBg || '#fef2f2'),
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, color: sufficient ? t.green : t.red }}>
              {sufficient ? '✓ Sufficient balance for this sale' : '✕ Insufficient balance — do not complete'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '16px 22px 20px', borderTop: `1px solid ${t.border}`, background: t.bg3 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.bg,
              color: t.text2,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!sufficient}
            onClick={() => sufficient && onConfirmPayment(read)}
            style={{
              flex: 1.2,
              padding: '12px 14px',
              borderRadius: 10,
              border: 'none',
              background: sufficient ? '#10b981' : '#94a3b8',
              color: '#fff',
              fontWeight: 900,
              fontSize: 13,
              cursor: sufficient ? 'pointer' : 'not-allowed',
            }}
          >
            Payment received — confirm order
          </button>
        </div>
      </div>
    </div>
  )
}

export function generateSimulatedCardRead(cartTotal) {
  const last4 = String(Math.floor(1000 + Math.random() * 9000))
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const year = String((new Date().getFullYear() % 100) + Math.floor(Math.random() * 4) + 1).padStart(2, '0')
  const authRef = `AUTH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const availableBalance = Math.round((Number(cartTotal) + Math.random() * 2500 + 25) * 100) / 100
  const sufficient = availableBalance >= Number(cartTotal) - 0.001
  return {
    last4,
    maskedPan: `•••• •••• •••• ${last4}`,
    expiry: `${month}/${year}`,
    authRef,
    sufficient,
  }
}
