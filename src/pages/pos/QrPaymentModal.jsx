import { fmt } from '@/lib/utils'

/**
 * Cashier confirmation after QR scan. No personal / wallet account identifiers — refs are simulated.
 */
export function QrPaymentModal({
  open,
  onClose,
  read,
  cartTotal,
  settings,
  t,
  onConfirmPayment,
}) {
  if (!open || !read) return null

  const { txnRef, provider, amount, statusLabel } = read

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
            QR payment — cashier
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: t.text, marginTop: 4 }}>Payment details</div>
          <div style={{ fontSize: 12, color: t.text3, marginTop: 6, lineHeight: 1.4 }}>
            After customer scan. Confirm here only when funds show as received on your side. No personal data shown.
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
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Amount</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#f87171' }}>{fmt(amount ?? cartTotal, settings?.sym)}</span>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>Amount Transfer</span>
              <span style={{ fontWeight: 800, color: t.text }}>Verified</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'flex-start', gap: 12 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>QR Reference</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.accent, textAlign: 'right', wordBreak: 'break-all' }}>{txnRef}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: t.text3, fontWeight: 700 }}>Status</span>
              <span style={{ fontWeight: 900, color: t.green }}>{statusLabel}</span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${t.green}60`,
              background: t.greenBg || '#ecfdf5',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: t.green }}>
              ✓ Scan completed — verify amount matches, then confirm payment received
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
            Back (scan again)
          </button>
          <button
            type="button"
            onClick={() => onConfirmPayment()}
            style={{
              flex: 1.2,
              padding: '12px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Received
          </button>
        </div>
      </div>
    </div>
  )
}

export function generateSimulatedQrRead(cartTotal) {
  const txnRef = `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  return {
    txnRef,
    provider: 'QR / wallet (simulated)',
    amount: Number(cartTotal),
    statusLabel: 'Authorised',
  }
}
