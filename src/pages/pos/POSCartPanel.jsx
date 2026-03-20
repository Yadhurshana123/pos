import { useState, useEffect } from 'react'
import { ImgWithFallback } from '@/components/shared'
import { Toggle, Select } from '@/components/ui'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { fmt } from '@/lib/utils'
import { CardTerminal } from './CardTerminal'

const REASON_OPTIONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'changed_mind', label: 'Changed mind' },
  { value: 'other', label: 'Other' },
]

const QtyInput = ({ qty, onChange, t }) => {
  const [val, setVal] = useState(qty);
  useEffect(() => setVal(qty), [qty]);
  return (
    <input
      type="number"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => {
        let n = parseInt(val, 10);
        if (isNaN(n) || n < 1) n = 1;
        setVal(n);
        if (n !== qty) onChange(n);
      }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
      onFocus={e => e.target.select()}
      style={{
        width: 36, height: 22, textAlign: 'center',
        border: `1px solid ${t.border}`, borderRadius: 4,
        background: t.bg, fontSize: 13, fontWeight: 900, color: t.text, outline: 'none',
        MozAppearance: 'textfield', padding: 0, margin: 0
      }}
    />
  )
}

export function POSCartPanel({
  cart, updateQty, setCart,
  removeFromCart, removeMode, setRemoveMode, cartSearch, setCartSearch,
  selCust, setSelCust, custSearch, setCustSearch, lookupCustomer, setShowNewCust,
  loyaltyRedeem, setLoyaltyRedeem,
  appliedCoupon, setAppliedCoupon, couponCode, setCouponCode, applyCoupon,
  cartSubtotal, cartTax, couponDiscount, loyaltyDiscount, manualDiscountPct, setManualDiscountPct, manualDiscountAmount,
  cartTotal, pointsEarned,
  payMethod, setPayMethod,
  cashGiven, setCashGiven, cashGivenNum, cashChange,
  cardNum, setCardNum, setCardExp, setCardCvv,
  splitCash, setSplitCash, splitCard, setSplitCard,
  checkout, setShowCustDisplay,
  updateCartItemPrice, user,
  checkoutProcessing,
  qrPaymentStatus,
  settings, t,
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
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [editPriceVal, setEditPriceVal] = useState('')
  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const showExchangeSections = loadedOrderForReturn && returnProcessMode === 'exchange'
  const returnItems = loadedOrderForReturn ? cart.filter(i => i.orderItemId) : []
  const replacementItems = loadedOrderForReturn ? cart.filter(i => !i.orderItemId) : []
  const filteredReturn = cartSearch.trim() ? returnItems.filter(i => i.name.toLowerCase().includes(cartSearch.toLowerCase())) : returnItems
  const filteredReplacement = cartSearch.trim() ? replacementItems.filter(i => i.name.toLowerCase().includes(cartSearch.toLowerCase())) : replacementItems
  const filteredCart = cartSearch.trim()
    ? cart.filter(i => i.name.toLowerCase().includes(cartSearch.toLowerCase()))
    : cart
  const returnTotal = returnItems.reduce((s, i) => s + (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1), 0)
  const replacementTotal = replacementItems.reduce((s, i) => s + (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1), 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: t.posRight, borderLeft: `1px solid ${t.border}` }} className="pos-right">
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7 }}>Customer</div>
        {selCust ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>👤 {selCust.name}</div>
              <div style={{ fontSize: 11, color: t.yellow }}>⭐ {selCust.loyaltyPoints} pts · {selCust.tier}</div>
            </div>
            <button onClick={() => { setSelCust(null); setLoyaltyRedeem(false) }} style={{ background: t.redBg, border: `1px solid ${t.redBorder}`, color: t.red, borderRadius: 7, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupCustomer()} placeholder="Phone / Name / Email..." style={{ flex: '1 1 180px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 10px', color: t.text, fontSize: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 6, flex: '1 1 120px' }}>
              <button onClick={lookupCustomer} style={{ flex: 1, background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Find</button>
              <button onClick={() => setShowNewCust(true)} style={{ flex: 1, background: t.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New</button>
            </div>
          </div>
        )}
      </div>

      {/* In-Store Transaction bar + cart search + remove toggle */}
      <div style={{ padding: '6px 10px 6px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>🏪</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: t.green, flexShrink: 0, marginRight: 4 }}>In-Store</span>
        {/* Cart search bar */}
        <input
          value={cartSearch}
          onChange={e => setCartSearch(e.target.value)}
          placeholder="Search cart…"
          style={{
            flex: 1, minWidth: 0, background: t.input, border: `1px solid ${t.border}`,
            borderRadius: 7, padding: '4px 8px', color: t.text, fontSize: 11, outline: 'none',
          }}
        />
        {/* Remove mode toggle */}
        <button
          onClick={() => setRemoveMode(r => !r)}
          title={removeMode ? 'Remove mode ON — click to disable' : 'Enable remove mode'}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 800,
            border: `1.5px solid ${removeMode ? '#ef4444' : t.border}`,
            background: removeMode ? '#ef444418' : t.bg3,
            color: removeMode ? '#ef4444' : t.text3,
            transition: 'all 0.18s ease',
            boxShadow: removeMode ? '0 0 8px #ef444440' : 'none',
          }}
        >
          {/* Radio dot */}
          <span style={{
            width: 9, height: 9, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
            border: `2px solid ${removeMode ? '#ef4444' : t.text4}`,
            background: removeMode ? '#ef4444' : 'transparent',
            transition: 'all 0.18s ease',
          }} />
          Remove
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', WebkitOverflowScrolling: 'touch' }}>
        {cart.length === 0
          ? <div style={{ textAlign: 'center', padding: '32px 16px', color: t.text3 }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><div style={{ fontSize: 13, fontWeight: 700 }}>Cart is empty</div><div style={{ fontSize: 12, marginTop: 4, color: t.text4 }}>Tap a product or scan barcode</div></div>
          : showExchangeSections ? (
            <>
              {filteredReturn.length === 0 && filteredReplacement.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: t.text3 }}><div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div><div style={{ fontSize: 12, fontWeight: 700 }}>No match in cart</div></div>
              ) : (
                <>
                  {filteredReturn.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: t.yellow, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>↩️ Returning</div>
                      {filteredReturn.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                            <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: t.green, fontWeight: 800 }}>{fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)} × {item.qty}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: t.text, minWidth: 50, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
                          <button onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 14, flexShrink: 0, color: t.text4 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredReplacement.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: t.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>↔ Replacement</div>
                      {filteredReplacement.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                            <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: t.green, fontWeight: 800 }}>{fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)} × {item.qty}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: t.text, minWidth: 50, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
                          <button onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 14, flexShrink: 0, color: t.text4 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : filteredCart.length === 0
            ? <div style={{ textAlign: 'center', padding: '24px 16px', color: t.text3 }}><div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div><div style={{ fontSize: 12, fontWeight: 700 }}>No match in cart</div></div>
            : filteredCart.map(item => (
            <div
              key={item.id}
              onClick={() => removeMode && removeFromCart(item.originalId || item.id)}
              style={{
                display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0',
                borderBottom: `1px solid ${t.border}`,
                cursor: removeMode ? 'pointer' : 'default',
                borderRadius: removeMode ? 6 : 0,
                background: removeMode ? '#ef444408' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                {editingPriceId === item.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      step={0.01}
                      min={0}
                      value={editPriceVal}
                      onChange={e => setEditPriceVal(e.target.value)}
                      onBlur={() => {
                        const v = parseFloat(editPriceVal)
                        if (!isNaN(v) && v >= 0 && updateCartItemPrice) updateCartItemPrice(item.id, v)
                        setEditingPriceId(null)
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                      autoFocus
                      style={{ width: 70, background: t.input, border: `1px solid ${t.accent}`, borderRadius: 6, padding: '2px 6px', color: t.text, fontSize: 11, fontWeight: 700 }}
                    />
                  </div>
                ) : (
                  <div
                    style={{ fontSize: 10, color: item.discount > 0 ? t.accent : t.green, fontWeight: 800, cursor: isManager ? 'pointer' : 'default' }}
                    onClick={() => isManager && updateCartItemPrice && (setEditingPriceId(item.id), setEditPriceVal(String(item.price ?? 0)))}
                    title={isManager ? 'Click to override price' : ''}
                  >
                    {item.discount > 0 ? `${fmt(item.price * (1 - item.discount / 100), settings?.sym)} (-${item.discount}%)` : fmt(item.price, settings?.sym)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: t.text, minWidth: 50, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
              <button
                onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }}
                style={{
                  background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer',
                  fontSize: 14, flexShrink: 0,
                  color: removeMode ? '#ef4444' : t.text4,
                  transition: 'color 0.18s',
                }}
              >✕</button>
            </div>
          ))}
      </div>

      <div style={{ padding: '8px 14px', borderTop: `1px solid ${t.border}` }}>
        {appliedCoupon
          ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 8, padding: '7px 12px' }}>
            <span style={{ fontSize: 12, color: t.green, fontWeight: 800 }}>🎟️ {appliedCoupon.code} — {appliedCoupon.description}</span>
            <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: t.red, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          : <div style={{ display: 'flex', gap: 6 }}>
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" style={{ flex: 1, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 10px', color: t.text, fontSize: 12, outline: 'none' }} />
            <button onClick={applyCoupon} style={{ background: t.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          </div>}

        {selCust && (selCust.loyaltyPoints || 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 8, padding: '7px 12px' }}>
            <span style={{ fontSize: 12, color: t.yellow, fontWeight: 700 }}>⭐ Redeem {selCust.loyaltyPoints} pts = {fmt(selCust.loyaltyPoints * (settings?.loyaltyValue || 0.01), settings?.sym)}</span>
            <Toggle t={t} value={loyaltyRedeem} onChange={setLoyaltyRedeem} />
          </div>
        )}

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text3 }}>Manual discount %</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={manualDiscountPct ?? 0}
              onChange={e => setManualDiscountPct?.(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              style={{ width: 60, background: t.input, border: `1px solid ${t.border}`, borderRadius: 6, padding: '4px 8px', color: t.text, fontSize: 12, fontWeight: 700 }}
            />
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          {[['Subtotal', fmt(cartSubtotal, settings?.sym)], ['Tax', fmt(cartTax, settings?.sym)], couponDiscount > 0 && [`Coupon (${appliedCoupon?.code})`, `-${fmt(couponDiscount, settings?.sym)}`], loyaltyDiscount > 0 && ['Loyalty Discount', `-${fmt(loyaltyDiscount, settings?.sym)}`], manualDiscountAmount > 0 && [`Manual (${manualDiscountPct ?? 0}%)`, `-${fmt(manualDiscountAmount, settings?.sym)}`]].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: v.startsWith?.('-') ? t.green : t.text3, marginBottom: 4 }}><span>{k}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: t.text, paddingTop: 10, borderTop: `2px solid ${t.border}`, marginTop: 4 }}>
            <span>Total</span><span style={{ color: t.accent }}>{fmt(cartTotal, settings?.sym)}</span>
          </div>
          {selCust && pointsEarned > 0 && <div style={{ fontSize: 11, color: t.yellow, textAlign: 'right', marginTop: 3 }}>+{pointsEarned} loyalty pts will be earned</div>}
        </div>

        {loadedOrderForReturn ? (
          <>
            <div style={{ marginTop: 10, padding: 10, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: t.yellow, marginBottom: 8, textTransform: 'uppercase' }}>↩️ Return / Exchange</div>
              <Select t={t} label="Reason" value={returnReasonCode} onChange={setReturnReasonCode} options={REASON_OPTIONS.map(r => ({ value: r.value, label: r.label }))} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => setReturnProcessMode('return')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'return' ? t.accent : t.border}`, background: returnProcessMode === 'return' ? t.accent + '15' : t.bg3, color: returnProcessMode === 'return' ? t.accent : t.text3, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Return</button>
                <button onClick={() => setReturnProcessMode('exchange')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'exchange' ? t.accent : t.border}`, background: returnProcessMode === 'exchange' ? t.accent + '15' : t.bg3, color: returnProcessMode === 'exchange' ? t.accent : t.text3, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Exchange</button>
              </div>
              {returnProcessMode === 'return' && (
                <Select t={t} label="Refund" value={returnRefundMethod} onChange={setReturnRefundMethod} options={[{ value: 'original', label: 'Original payment' }, { value: 'store_credit', label: 'Store credit' }]} />
              )}
            </div>
            {returnProcessMode === 'exchange' && showExchangeSections && (
              <div style={{ marginTop: 8, fontSize: 11, color: t.text3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Return:</span><span style={{ fontWeight: 700 }}>{fmt(returnTotal, settings?.sym)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Replacement:</span><span style={{ fontWeight: 700, color: t.green }}>{fmt(replacementTotal, settings?.sym)}</span></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                onClick={processReturnFromCart}
                disabled={checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)}
                style={{ flex: 1, padding: '13px', background: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.bg4 : t.green, color: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.text3 : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? 'not-allowed' : 'pointer' }}
              >
                {checkoutProcessing ? 'Processing...' : returnProcessMode === 'exchange'
                  ? (replacementItems.length === 0 ? 'Add replacement items' : `↔ Exchange (Return: ${returnItems.length}, Replace: ${replacementItems.length})`)
                  : `↩️ Refund ${fmt(returnTotal || cartTotal, settings?.sym)}`}
              </button>
              <button onClick={clearReturnMode} style={{ padding: '13px 14px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✕ Cancel</button>
            </div>
          </>
        ) : (
          <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: 6, marginTop: 10 }}>
          {[['Card', '💳'], ['Cash', '💵'], ['QR', '📱'], ['Split', '✂️']].map(([m, ic]) => (
            <div key={m} style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                onClick={() => setPayMethod(m)} 
                style={{ 
                  width: '100%', padding: '10px 4px', borderRadius: 10, 
                  border: `2px solid ${payMethod === m ? t.accent : t.border}`, 
                  background: payMethod === m ? t.accent + '15' : t.bg3, 
                  color: payMethod === m ? t.accent : t.text3, 
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                }}
              >
                <span style={{ fontSize: 18 }}>{ic}</span>
                <span>{m}</span>
              </button>
            </div>
          ))}
        </div>

        {payMethod === 'Card' && <CardTerminal total={cartTotal} onApproved={() => { setCardNum('4242424242424242'); setCardExp('12/26'); setCardCvv('123') }} settings={settings} t={t} />}

        {payMethod === 'Cash' && (
          <div style={{ marginTop: 8 }}>
            <input value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder={`Cash received (${settings?.sym || '£'})`} type="number" style={{ width: '100%', background: t.input, border: `1px solid ${cashGiven && cashGivenNum >= cartTotal ? t.greenBorder : t.border}`, borderRadius: 8, padding: '9px 12px', color: t.text, fontSize: 14, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
            {cashGiven !== '' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                {[['Cash Given', fmt(cashGivenNum, settings?.sym), t.text], ['Change Due', cashChange >= 0 ? fmt(cashChange, settings?.sym) : 'Insufficient', cashChange >= 0 ? t.green : t.red]].map(([k, v, c]) => (
                  <div key={k} style={{ background: t.bg3, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: t.text4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {payMethod === 'Split' && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.text3, textTransform: 'uppercase' }}>Split Payment (Cash + Card)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: t.text4, marginBottom: 3 }}>💵 Cash Amount</div>
                <input value={splitCash} onChange={e => { setSplitCash(e.target.value); const c = parseFloat(e.target.value) || 0; setSplitCard(String(Math.max(0, Math.round((cartTotal - c) * 100) / 100))) }}
                  placeholder="0.00" type="number" style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 10px', color: t.text, fontSize: 13, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.text4, marginBottom: 3 }}>💳 Card Amount</div>
                <input value={splitCard} onChange={e => { setSplitCard(e.target.value); const c = parseFloat(e.target.value) || 0; setSplitCash(String(Math.max(0, Math.round((cartTotal - c) * 100) / 100))) }}
                  placeholder="0.00" type="number" style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 10px', color: t.text, fontSize: 13, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            {(parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) > 0 && (
              <div style={{ background: t.bg3, borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: t.text3 }}>Total: {fmt((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0), settings?.sym)}</span>
                <span style={{ color: Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) - cartTotal) < 0.01 ? t.green : t.red, fontWeight: 800 }}>
                  {Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) - cartTotal) < 0.01 ? '✓ Balanced' : 'Amounts must equal total'}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={checkout} disabled={cart.length === 0 || checkoutProcessing}
            style={{ flex: 1, padding: '13px', background: (cart.length === 0 || checkoutProcessing) ? t.bg4 : `linear-gradient(135deg,${t.accent},${t.accent2})`, color: (cart.length === 0 || checkoutProcessing) ? t.text3 : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: (cart.length === 0 || checkoutProcessing) ? 'not-allowed' : 'pointer', boxShadow: (cart.length > 0 && !checkoutProcessing) ? `0 4px 14px ${t.accent}40` : 'none' }}>
            {cart.length === 0 ? 'Add items to cart' : 
             checkoutProcessing ? 'Processing...' : 
             (qrPaymentStatus === 'processing' ? '⌛ Processing...' : 
              qrPaymentStatus === 'received' ? '✓ Payment Received' : 
              `${payMethod === 'Card' ? '💳' : payMethod === 'Cash' ? '💵' : payMethod === 'Split' ? '✂️' : '📱'} Pay ${fmt(cartTotal, settings?.sym)}`)}
          </button>
          <button onClick={() => setShowCustDisplay(true)} title="Customer Display" style={{ padding: '13px 12px', background: t.tealBg, border: `1px solid ${t.tealBorder}`, borderRadius: 10, color: t.teal, cursor: 'pointer', fontSize: 16 }}>🖥️</button>
        </div>
        {cart.length > 0 && !loadedOrderForReturn && <button onClick={() => { setCart([]); setManualDiscountPct?.(0) }} style={{ width: '100%', padding: '6px', marginTop: 5, background: 'transparent', color: t.text4, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>🗑️ Clear Cart</button>}
          </>
        )}
      </div>
    </div>
  )
}
