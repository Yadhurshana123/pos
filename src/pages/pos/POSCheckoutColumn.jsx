import { Toggle, Select } from '@/components/ui'
import { fmt } from '@/lib/utils'
import { POSPaymentForm } from './POSPaymentForm'

const REASON_OPTIONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'changed_mind', label: 'Changed mind' },
  { value: 'other', label: 'Other' },
]

/** Right column: quick tiles + promo + totals + payment (Terminal Precision layout). */
export function POSCheckoutColumn({
  quickAccessProducts,
  onQuickAdd,
  cart,
  setCart,
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
  loadedOrderForReturn,
  processReturnFromCart,
  clearReturnMode,
  returnReasonCode,
  setReturnReasonCode,
  returnProcessMode,
  setReturnProcessMode,
  returnRefundMethod,
  setReturnRefundMethod,
}) {
  const returnItems = loadedOrderForReturn ? cart.filter((i) => i.orderItemId) : []
  const replacementItems = loadedOrderForReturn ? cart.filter((i) => !i.orderItemId) : []
  const returnTotal = returnItems.reduce((s, i) => s + (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1), 0)
  const replacementTotal = replacementItems.reduce((s, i) => s + (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1), 0)

  return (
    <aside
      className="pos-precision-checkout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        width: '100%',
        background: t.posRight,
        borderLeft: `1px solid ${t.border}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px', WebkitOverflowScrolling: 'touch' }}>
        {quickAccessProducts?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.08, marginBottom: 12 }}>
              Quick access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickAccessProducts.map((p) => {
                const disabled = (p.stock ?? 0) === 0
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onQuickAdd?.(p)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.card,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minHeight: 72,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 800, color: t.text, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                    <span style={{ fontSize: 17, fontWeight: 900, color: t.accent }}>{fmt(p.price, settings?.sym)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ padding: 14, background: t.bg2, borderRadius: 12, border: `1px solid ${t.border}` }}>
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
                placeholder="Promo or coupon code"
                style={{ flex: 1, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '11px 12px', color: t.text, fontSize: 14, outline: 'none' }}
              />
              <button type="button" onClick={applyCoupon} style={{ flexShrink: 0, minWidth: 44, background: t.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 22, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }} title="Apply">+</button>
            </div>
          )}

          {selCust && (selCust.loyaltyPoints || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 8, padding: '9px 14px' }}>
              <span style={{ fontSize: 14, color: t.yellow, fontWeight: 700 }}>Redeem {selCust.loyaltyPoints} pts = {fmt(selCust.loyaltyPoints * (settings?.loyaltyValue || 0.01), settings?.sym)}</span>
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

          <div style={{ marginTop: 14 }}>
            {[
              ['Subtotal', fmt(cartSubtotal, settings?.sym)],
              ['Tax', fmt(cartTax, settings?.sym)],
              couponDiscount > 0 && [`Discount (${appliedCoupon?.code})`, `-${fmt(couponDiscount, settings?.sym)}`],
              loyaltyDiscount > 0 && ['Loyalty discount', `-${fmt(loyaltyDiscount, settings?.sym)}`],
              manualDiscountAmount > 0 && [`Manual (${manualDiscountPct ?? 0}%)`, `-${fmt(manualDiscountAmount, settings?.sym)}`],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: String(v).startsWith('-') ? t.green : t.text3, marginBottom: 5 }}>
                <span>{k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 14, marginTop: 10, borderTop: `2px solid ${t.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: t.text3, letterSpacing: 0.1, textTransform: 'uppercase' }}>Grand total</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: t.text, lineHeight: 1.1 }}>{fmt(cartTotal, settings?.sym)}</span>
            </div>
            {selCust && pointsEarned > 0 && <div style={{ fontSize: 13, color: t.yellow, textAlign: 'right', marginTop: 4 }}>+{pointsEarned} loyalty pts will be earned</div>}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 16px 18px', borderTop: `1px solid ${t.border}`, background: t.bg2 }}>
        {loadedOrderForReturn ? (
          <>
            <div style={{ marginBottom: 12, padding: 12, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.yellow, marginBottom: 8, textTransform: 'uppercase' }}>Return / exchange</div>
              <Select t={t} label="Reason" value={returnReasonCode} onChange={setReturnReasonCode} options={REASON_OPTIONS.map((r) => ({ value: r.value, label: r.label }))} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button type="button" onClick={() => setReturnProcessMode('return')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'return' ? t.accent : t.border}`, background: returnProcessMode === 'return' ? `${t.accent}15` : t.bg3, color: returnProcessMode === 'return' ? t.accent : t.text3, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Return</button>
                <button type="button" onClick={() => setReturnProcessMode('exchange')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'exchange' ? t.accent : t.border}`, background: returnProcessMode === 'exchange' ? `${t.accent}15` : t.bg3, color: returnProcessMode === 'exchange' ? t.accent : t.text3, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Exchange</button>
              </div>
              {returnProcessMode === 'return' && (
                <Select t={t} label="Refund" value={returnRefundMethod} onChange={setReturnRefundMethod} options={[{ value: 'original', label: 'Original payment' }, { value: 'store_credit', label: 'Store credit' }]} />
              )}
            </div>
            {returnProcessMode === 'exchange' && loadedOrderForReturn && (
              <div style={{ marginBottom: 8, fontSize: 13, color: t.text3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Return:</span><span style={{ fontWeight: 700 }}>{fmt(returnTotal, settings?.sym)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Replacement:</span><span style={{ fontWeight: 700, color: t.green }}>{fmt(replacementTotal, settings?.sym)}</span></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={processReturnFromCart}
                disabled={checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.bg4 : t.green,
                  color: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.text3 : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? 'not-allowed' : 'pointer',
                }}
              >
                {checkoutProcessing ? 'Processing...' : returnProcessMode === 'exchange'
                  ? (replacementItems.length === 0 ? 'Add replacement items' : `Exchange (${returnItems.length} / ${replacementItems.length})`)
                  : `Refund ${fmt(returnTotal || cartTotal, settings?.sym)}`}
              </button>
              <button type="button" onClick={clearReturnMode} style={{ padding: '14px 16px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text2, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {!loadedOrderForReturn && cart.length > 0 && (
              <div style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Payment</div>
                <div style={{ padding: 14, background: t.bg3, borderRadius: 12, border: `1px solid ${t.border}` }}>
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
                    primaryCta="complete"
                  />
                </div>
              </div>
            )}
            {!loadedOrderForReturn && cart.length > 0 && (
              <button type="button" onClick={() => { setCart([]); setManualDiscountPct?.(0) }} style={{ width: '100%', padding: '10px', marginTop: 10, background: 'transparent', color: t.text4, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Clear cart
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
