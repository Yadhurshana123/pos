import { CardTerminal } from './CardTerminal'
import { fmt } from '@/lib/utils'

/** Payment methods + Pay — embedded in POS cart panel */
export function POSPaymentForm({
  payMethod, setPayMethod,
  cashGiven, setCashGiven, cashGivenNum, cashChange, cartTotal,
  splitCash, setSplitCash, splitCard, setSplitCard,
  cardNum, setCardNum, setCardExp, setCardCvv,
  checkout, setShowCustDisplay,
  checkoutProcessing, qrPaymentStatus,
  settings, t,
  /** 'complete' = large maroon-style CTA label; default keeps amount in label */
  primaryCta = 'amount',
  /** When false, only method controls + fields (Pay button rendered elsewhere). */
  showPayButton = true,
}) {
  const completeLabel = primaryCta === 'complete'
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))', gap: 8, marginTop: 10 }}>
        {[['Card', '💳'], ['Cash', '💵'], ['QR', '📱'], ['Split', '✂️']].map(([m, ic]) => (
          <div key={m} style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => setPayMethod(m)}
              style={{
                width: '100%', padding: '12px 6px', borderRadius: 10,
                border: `2px solid ${payMethod === m ? t.accent : t.border}`,
                background: payMethod === m ? t.accent + '15' : t.bg3,
                color: payMethod === m ? t.accent : t.text3,
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{ic}</span>
              <span>{m}</span>
            </button>
          </div>
        ))}
      </div>

      {payMethod === 'Card' && <CardTerminal total={cartTotal} onApproved={() => { setCardNum('4242424242424242'); setCardExp('12/26'); setCardCvv('123') }} settings={settings} t={t} />}

      {payMethod === 'Cash' && (
        <div style={{ marginTop: 8 }}>
          <input value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder={`Cash received (${settings?.sym || '£'})`} type="number" style={{ width: '100%', background: t.input, border: `1px solid ${cashGiven && cashGivenNum >= cartTotal ? t.greenBorder : t.border}`, borderRadius: 8, padding: '11px 14px', color: t.text, fontSize: 16, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
          {cashGiven !== '' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {[['Cash Given', fmt(cashGivenNum, settings?.sym), t.text], ['Change Due', cashChange >= 0 ? fmt(cashChange, settings?.sym) : 'Insufficient', cashChange >= 0 ? t.green : t.red]].map(([k, v, c]) => (
                <div key={k} style={{ background: t.bg3, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: t.text4 }}>{k}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {payMethod === 'Split' && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text3, textTransform: 'uppercase' }}>Split Payment (Cash + Card)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: t.text4, marginBottom: 4 }}>💵 Cash Amount</div>
              <input value={splitCash} onChange={e => { setSplitCash(e.target.value); const c = parseFloat(e.target.value) || 0; setSplitCard(String(Math.max(0, Math.round((cartTotal - c) * 100) / 100))) }}
                placeholder="0.00" type="number" style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', color: t.text, fontSize: 15, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.text4, marginBottom: 4 }}>💳 Card Amount</div>
              <input value={splitCard} onChange={e => { setSplitCard(e.target.value); const c = parseFloat(e.target.value) || 0; setSplitCash(String(Math.max(0, Math.round((cartTotal - c) * 100) / 100))) }}
                placeholder="0.00" type="number" style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', color: t.text, fontSize: 15, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          {(parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) > 0 && (
            <div style={{ background: t.bg3, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: t.text3 }}>Total: {fmt((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0), settings?.sym)}</span>
              <span style={{ color: Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) - cartTotal) < 0.01 ? t.green : t.red, fontWeight: 800 }}>
                {Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) - cartTotal) < 0.01 ? '✓ Balanced' : 'Amounts must equal total'}
              </span>
            </div>
          )}
        </div>
      )}

      {showPayButton && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" onClick={checkout} disabled={cartTotal <= 0 || checkoutProcessing}
            style={{ flex: 1, padding: completeLabel ? '18px 16px' : '16px', background: (cartTotal <= 0 || checkoutProcessing) ? t.bg4 : `linear-gradient(135deg,${t.accent},${t.accent2})`, color: (cartTotal <= 0 || checkoutProcessing) ? t.text3 : '#fff', border: 'none', borderRadius: 12, fontSize: completeLabel ? 15 : 16, fontWeight: 900, letterSpacing: completeLabel ? '0.04em' : undefined, textTransform: completeLabel ? 'uppercase' : undefined, cursor: (cartTotal <= 0 || checkoutProcessing) ? 'not-allowed' : 'pointer', boxShadow: (cartTotal > 0 && !checkoutProcessing) ? `0 6px 16px ${t.accent}45` : 'none' }}>
            {checkoutProcessing ? 'Processing...'
              : (qrPaymentStatus === 'processing' ? '⌛ Processing...'
                : qrPaymentStatus === 'received' ? '✓ Payment Received'
                  : completeLabel
                    ? 'Complete payment'
                    : `${payMethod === 'Card' ? '💳' : payMethod === 'Cash' ? '💵' : payMethod === 'Split' ? '✂️' : '📱'} Pay ${fmt(cartTotal, settings?.sym)}`)}
          </button>
          <button type="button" onClick={() => setShowCustDisplay(true)} title="Customer Display" style={{ padding: '16px 14px', background: t.tealBg, border: `1px solid ${t.tealBorder}`, borderRadius: 12, color: t.teal, cursor: 'pointer', fontSize: 20 }}>🖥️</button>
        </div>
      )}
    </>
  )
}
