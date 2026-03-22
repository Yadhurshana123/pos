import { useState } from 'react'
import { Toggle } from '@/components/ui'
import { fmt } from '@/lib/utils'
import { POSPaymentForm } from './POSPaymentForm'

/**
 * Totals, optional promo (collapsible), loyalty, and primary PAY CTA for POS checkout column.
 */
export function BillingPanel({
  appliedCoupon,
  setAppliedCoupon,
  couponCode,
  setCouponCode,
  applyCoupon,
  cartSubtotal,
  cartTax,
  couponDiscount,
  loyaltyDiscount,
  manualDiscountPct,
  setManualDiscountPct,
  manualDiscountAmount,
  cartTotal,
  pointsEarned,
  selCust,
  loyaltyRedeem,
  setLoyaltyRedeem,
  user,
  checkoutProcessing,
  payMethod,
  setPayMethod,
  cashGiven,
  setCashGiven,
  cashGivenNum,
  cashChange,
  splitCash,
  setSplitCash,
  splitCard,
  setSplitCard,
  cardNum,
  setCardNum,
  setCardExp,
  setCardCvv,
  checkout,
  setShowCustDisplay,
  qrPaymentStatus,
  settings,
  t,
  cartLength,
  loadedOrderForReturn = false,
}) {
  const [promoOpen, setPromoOpen] = useState(false)
  const sym = settings?.sym || '£'

  const summaryRow = (label, value, { emphasize = false, discount = false } = {}) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: emphasize ? 16 : 14,
        fontWeight: emphasize ? 900 : 600,
        color: discount ? t.green : emphasize ? t.text : t.text3,
        marginBottom: emphasize ? 10 : 6,
        padding: emphasize ? '10px 12px' : 0,
        borderRadius: emphasize ? 10 : 0,
        background: emphasize ? t.bg3 : 'transparent',
        boxShadow: emphasize ? `inset 0 0 0 1px ${t.border}` : 'none',
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px dashed ${t.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: t.text4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bill summary</div>
      </div>
      {summaryRow('Subtotal', fmt(cartSubtotal, sym), { emphasize: true })}
      {summaryRow('Tax', fmt(cartTax, sym), { emphasize: true })}
      {couponDiscount > 0 && summaryRow(`Discount (${appliedCoupon?.code || 'Coupon'})`, `−${fmt(couponDiscount, sym)}`, { discount: true })}
      {loyaltyDiscount > 0 && summaryRow('Loyalty', `−${fmt(loyaltyDiscount, sym)}`, { discount: true })}
      {manualDiscountAmount > 0 && summaryRow(`Manual (${manualDiscountPct ?? 0}%)`, `−${fmt(manualDiscountAmount, sym)}`, { discount: true })}

      <div style={{ marginTop: 14, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setPromoOpen(o => !o)}
          aria-expanded={promoOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.bg3,
            color: t.text2,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 1px 6px rgba(15,23,42,0.05)',
          }}
        >
          <span>Promo code & adjustments</span>
          <span style={{ color: t.text4 }}>{promoOpen ? '▴' : '▾'}</span>
        </button>
        {promoOpen && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: t.bg2, boxShadow: `0 2px 12px rgba(15,23,42,0.06)` }}>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 8, padding: '9px 14px' }}>
                <span style={{ fontSize: 14, color: t.green, fontWeight: 800 }}>{appliedCoupon.code} — {appliedCoupon.description}</span>
                <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: t.red, cursor: 'pointer', fontSize: 17 }} aria-label="Remove coupon">✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  style={{ flex: 1, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '11px 12px', color: t.text, fontSize: 14, outline: 'none' }}
                />
                <button type="button" onClick={applyCoupon} style={{ flexShrink: 0, padding: '0 16px', background: t.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                  Apply
                </button>
              </div>
            )}

            {selCust && (selCust.loyaltyPoints || 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 8, padding: '9px 14px' }}>
                <span style={{ fontSize: 14, color: t.yellow, fontWeight: 700 }}>Redeem {selCust.loyaltyPoints} pts = {fmt(selCust.loyaltyPoints * (settings?.loyaltyValue || 0.01), sym)}</span>
                <Toggle t={t} value={loyaltyRedeem} onChange={setLoyaltyRedeem} />
              </div>
            )}

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text3 }}>Manual discount %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={manualDiscountPct ?? 0}
                  onChange={(e) => setManualDiscountPct?.(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  style={{ width: 68, background: t.input, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 10px', color: t.text, fontSize: 14, fontWeight: 700 }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 0 8px', borderTop: `2px solid ${t.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.08, marginBottom: 4 }}>Amount due</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: t.text, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{fmt(cartTotal, sym)}</div>
        {selCust && pointsEarned > 0 && (
          <div style={{ fontSize: 13, color: t.yellow, marginTop: 4 }}>+{pointsEarned} loyalty pts on this sale</div>
        )}
      </div>

      {cartLength > 0 && !loadedOrderForReturn && (
        <>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 8 }}>Payment method</div>
            <POSPaymentForm
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              cashGiven={cashGiven}
              setCashGiven={setCashGiven}
              cashGivenNum={cashGivenNum}
              cashChange={cashChange}
              cartTotal={cartTotal}
              splitCash={splitCash}
              setSplitCash={setSplitCash}
              splitCard={splitCard}
              setSplitCard={setSplitCard}
              cardNum={cardNum}
              setCardNum={setCardNum}
              setCardExp={setCardExp}
              setCardCvv={setCardCvv}
              checkout={checkout}
              setShowCustDisplay={setShowCustDisplay}
              checkoutProcessing={checkoutProcessing}
              qrPaymentStatus={qrPaymentStatus}
              settings={settings}
              t={t}
              showPayButton={false}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={checkout}
              disabled={cartTotal <= 0 || checkoutProcessing}
              style={{
                flex: 1,
                minHeight: 54,
                padding: '14px 16px',
                background: (cartTotal <= 0 || checkoutProcessing) ? t.bg4 : `linear-gradient(180deg, ${t.green}, ${t.green})`,
                color: (cartTotal <= 0 || checkoutProcessing) ? t.text3 : '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 18,
                fontWeight: 900,
                cursor: (cartTotal <= 0 || checkoutProcessing) ? 'not-allowed' : 'pointer',
                boxShadow: (cartTotal > 0 && !checkoutProcessing) ? '0 8px 24px rgba(22, 163, 74, 0.35)' : 'none',
              }}
            >
              {checkoutProcessing ? 'Processing…'
                : qrPaymentStatus === 'processing' ? 'Waiting for QR…'
                  : qrPaymentStatus === 'received' ? 'Confirm payment'
                    : `PAY ${fmt(cartTotal, sym)}`}
            </button>
            <button
              type="button"
              onClick={() => setShowCustDisplay(true)}
              title="Customer display"
              style={{ padding: '14px 16px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 14, color: t.text2, cursor: 'pointer', fontSize: 20, minWidth: 56 }}
            >
              🖥️
            </button>
          </div>
        </>
      )}
    </div>
  )
}
