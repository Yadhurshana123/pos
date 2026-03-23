import { useEffect, useRef, useLayoutEffect } from 'react'

const DUMMY_CARD_TYPE = 'VISA'
const DUMMY_MASKED = '**** **** **** 1234'

const AUTH_DELAY_MS = 1800
const DECLINE_CHANCE = 0.25

export function CardAuthorizingFlow({
  phase,
  onAuthorized,
  onDeclined,
  onRetry,
  onChangePaymentMethod,
  t,
}) {
  const open = phase === 'authorizing' || phase === 'failed'
  const authorizedRef = useRef(onAuthorized)
  const declinedRef = useRef(onDeclined)

  useLayoutEffect(() => {
    authorizedRef.current = onAuthorized
    declinedRef.current = onDeclined
  })

  useEffect(() => {
    if (phase !== 'authorizing') return
    const tid = setTimeout(() => {
      if (Math.random() < DECLINE_CHANCE) declinedRef.current?.()
      else authorizedRef.current?.()
    }, AUTH_DELAY_MS)
    return () => clearTimeout(tid)
  }, [phase])

  if (!open) return null

  if (phase === 'failed') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(127, 29, 29, 0.45)',
          zIndex: 5100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: '#450a0a',
            borderRadius: 16,
            maxWidth: 420,
            width: '100%',
            border: '2px solid #f87171',
            boxShadow: '0 25px 60px rgba(185, 28, 28, 0.45)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fecaca', marginBottom: 12 }}>Payment Failed ❌</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fca5a5', marginBottom: 8 }}>Transaction Declined</div>
            <div style={{ fontSize: 12, color: '#fecdd3', lineHeight: 1.5 }}>
              Dummy decline (prototype). Customer can try another card or choose a different payment method.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px 22px', background: 'rgba(0,0,0,0.25)' }}>
            <button
              type="button"
              onClick={onRetry}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #f87171',
                background: '#7f1d1d',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onChangePaymentMethod}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#fff',
                color: '#991b1b',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Change Payment Method
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        zIndex: 5100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: t.card || '#fff',
          borderRadius: 16,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text, marginBottom: 20 }}>Authorizing...</div>

          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              borderRadius: 14,
              padding: '22px 20px',
              marginBottom: 16,
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Card Type</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', letterSpacing: 2 }}>{DUMMY_CARD_TYPE}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Masked Number</span>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 17, fontWeight: 800, color: '#e2e8f0', letterSpacing: 1.5 }}>
              {DUMMY_MASKED}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 18,
                height: 18,
                border: `3px solid ${t.accent}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: 13, color: t.text3, fontWeight: 700 }}>Contacting bank...</span>
          </div>
          <div style={{ fontSize: 11, color: t.text4 }}>Prototype — dummy authorization delay ({AUTH_DELAY_MS}ms)</div>
        </div>
      </div>
    </div>
  )
}
