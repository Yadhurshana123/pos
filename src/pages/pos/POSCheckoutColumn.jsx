import { useMemo } from 'react'
import { Select } from '@/components/ui'
import { fmt } from '@/lib/utils'
import { BillingPanel } from './BillingPanel'

const REASON_OPTIONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'changed_mind', label: 'Changed mind' },
  { value: 'other', label: 'Other' },
]

/** Right column: customer (top) + billing + payment. */
export function POSCheckoutColumn({
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
  setSelCust,
  custSearch,
  setCustSearch,
  users = [],
  setShowNewCust,
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

  const customerMatches = useMemo(() => {
    const q = custSearch.trim().toLowerCase()
    if (!q) return []
    return (users || []).filter(u => u.role === 'customer' && (
      (u.phone && String(u.phone).includes(custSearch.trim())) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    )).slice(0, 8)
  }, [users, custSearch])

  return (
    <aside
      className="pos-precision-checkout pos-terminal-pay-column"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        width: '100%',
        background: t.posRight,
        borderLeft: `1px solid ${t.border}`,
        overflow: 'hidden',
        boxShadow: '-6px 0 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="pos-terminal-pay-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: t.bg3, border: `1px solid ${t.border}`, boxShadow: '0 2px 12px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.text4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Step 3 · Customer</div>
          {selCust ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{selCust.name}</div>
                <div style={{ fontSize: 12, color: t.yellow }}>{selCust.loyaltyPoints} pts · {selCust.tier}</div>
              </div>
              <button type="button" onClick={() => { setSelCust(null); setLoyaltyRedeem(false) }} style={{ background: t.redBg, border: `1px solid ${t.redBorder}`, color: t.red, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Clear</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
                <input
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customerMatches[0]) {
                      setSelCust(customerMatches[0])
                      setCustSearch('')
                    }
                  }}
                  placeholder="Phone, name, or email"
                  autoComplete="off"
                  aria-label="Customer search"
                  aria-autocomplete="list"
                  aria-controls="pos-checkout-cust-suggest"
                  style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px', color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                {custSearch.trim() && customerMatches.length > 0 && (
                  <ul id="pos-checkout-cust-suggest" role="listbox" style={{ position: 'absolute', left: 0, right: 0, top: '100%', margin: 0, marginTop: 4, padding: 6, listStyle: 'none', background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, zIndex: 50, maxHeight: 220, overflowY: 'auto', boxShadow: t.shadowMd }}>
                    {customerMatches.map(c => (
                      <li key={c.id} role="option">
                        <button
                          type="button"
                          onClick={() => { setSelCust(c); setCustSearch('') }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 10px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', color: t.text, fontSize: 14 }}
                        >
                          <span style={{ fontWeight: 800 }}>{c.name}</span>
                          <span style={{ display: 'block', fontSize: 12, color: t.text3 }}>{c.phone || c.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="button" onClick={() => setShowNewCust(true)} style={{ flex: '0 0 auto', background: t.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 48 }}>+ New</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.text4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step 4 · Pay</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: t.text, marginTop: 4, letterSpacing: '-0.02em' }}>Payment · totals</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text3, marginTop: 4 }}>Select method, then complete payment</div>
        </div>

        <div style={{ padding: 16, borderRadius: 14, background: t.bg2, boxShadow: '0 2px 16px rgba(15, 23, 42, 0.06)' }}>
          <BillingPanel
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            cartSubtotal={cartSubtotal}
            cartTax={cartTax}
            couponDiscount={couponDiscount}
            loyaltyDiscount={loyaltyDiscount}
            manualDiscountPct={manualDiscountPct}
            setManualDiscountPct={setManualDiscountPct}
            manualDiscountAmount={manualDiscountAmount}
            cartTotal={cartTotal}
            pointsEarned={pointsEarned}
            selCust={selCust}
            loyaltyRedeem={loyaltyRedeem}
            setLoyaltyRedeem={setLoyaltyRedeem}
            user={user}
            checkoutProcessing={checkoutProcessing}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
            cashGiven={cashGiven}
            setCashGiven={setCashGiven}
            cashGivenNum={cashGivenNum}
            cashChange={cashChange}
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
            qrPaymentStatus={qrPaymentStatus}
            settings={settings}
            t={t}
            cartLength={cart.length}
            loadedOrderForReturn={!!loadedOrderForReturn}
          />
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
              <button type="button" onClick={() => { setCart([]); setManualDiscountPct?.(0) }} style={{ width: '100%', padding: '10px', background: 'transparent', color: t.text4, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Clear cart
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
