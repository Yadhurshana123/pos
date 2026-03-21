import { useState, useEffect } from 'react'
import { ImgWithFallback } from '@/components/shared'
import { Toggle, Select } from '@/components/ui'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { fmt } from '@/lib/utils'
import { POSPaymentForm } from './POSPaymentForm'

/** Preferred order for cart line detail labels (matches common jersey / product fields). */
const LINE_ATTR_ORDER = ['Name', 'Brand', 'Size', 'Color', 'Print name']

function CartLineAttributeDetails({ item, t }) {
  const la = item.lineAttributes
  if (!la || typeof la !== 'object' || Object.keys(la).length === 0) return null
  const keys = Object.keys(la)
  const ordered = [
    ...LINE_ATTR_ORDER.filter(k => keys.includes(k)),
    ...keys.filter(k => !LINE_ATTR_ORDER.includes(k)).sort((a, b) => a.localeCompare(b)),
  ]
  const detailKeys = ordered.filter(k => k !== 'Name')
  return (
    <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px dashed ${t.border}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {detailKeys.map(k => (
        <div key={k} style={{ fontSize: 12, color: t.text3, lineHeight: 1.35 }}>
          <span style={{ fontWeight: 800, color: t.text4 }}>{k}: </span>
          <span style={{ color: t.text2 }}>{la[k]}</span>
        </div>
      ))}
      <div style={{ fontSize: 12, color: t.text3 }}>
        <span style={{ fontWeight: 800, color: t.text4 }}>Quantity: </span>
        <span style={{ color: t.accent, fontWeight: 900 }}>{item.qty}</span>
      </div>
    </div>
  )
}

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
        width: 44, height: 30, textAlign: 'center',
        border: `1px solid ${t.border}`, borderRadius: 6,
        background: t.bg, fontSize: 15, fontWeight: 900, color: t.text, outline: 'none',
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
  updateCartItemPrice, user,
  checkoutProcessing,
  payMethod, setPayMethod,
  cashGiven, setCashGiven, cashGivenNum, cashChange,
  splitCash, setSplitCash, splitCard, setSplitCard,
  cardNum, setCardNum, setCardExp, setCardCvv,
  checkout, setShowCustDisplay, qrPaymentStatus,
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
  className: classNameProp,
  /** When true, promo/totals/payment render in the right checkout column */
  checkoutSplit = false,
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: checkoutSplit ? 1 : undefined, minHeight: checkoutSplit ? 0 : undefined, background: checkoutSplit ? t.bg : t.posRight, borderLeft: checkoutSplit ? 'none' : `1px solid ${t.border}`, borderRight: checkoutSplit ? `1px solid ${t.border}` : 'none' }} className={`${checkoutSplit ? 'pos-cart-precision-main' : 'pos-right'}${classNameProp ? ` ${classNameProp}` : ''}`}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Customer lookup</div>
        {selCust ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{selCust.name}</div>
              <div style={{ fontSize: 13, color: t.yellow }}>{selCust.loyaltyPoints} pts · {selCust.tier}</div>
            </div>
            <button onClick={() => { setSelCust(null); setLoyaltyRedeem(false) }} style={{ background: t.redBg, border: `1px solid ${t.redBorder}`, color: t.red, borderRadius: 8, padding: '5px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupCustomer()} placeholder="Search by phone, name, or email" style={{ flex: '1 1 180px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 12px', color: t.text, fontSize: 14, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 6, flex: '1 1 120px' }}>
              <button onClick={lookupCustomer} style={{ flex: 1, background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Find</button>
              <button onClick={() => setShowNewCust(true)} style={{ flex: 1, background: t.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New</button>
            </div>
          </div>
        )}
      </div>

      {/* In-Store Transaction bar + cart search + remove toggle */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8, background: t.bg2 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🏪</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: t.green, flexShrink: 0, marginRight: 4 }}>In-Store</span>
        {/* Cart search bar */}
        <input
          value={cartSearch}
          onChange={e => setCartSearch(e.target.value)}
          placeholder="Search cart…"
          style={{
            flex: 1, minWidth: 0, background: t.input, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: '6px 10px', color: t.text, fontSize: 13, outline: 'none',
          }}
        />
        {/* Remove mode toggle */}
        <button
          onClick={() => setRemoveMode(r => !r)}
          title={removeMode ? 'Remove mode ON — click to disable' : 'Enable remove mode'}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 800,
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 10px', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        {cart.length === 0
          ? (
            <div className="pos-cart-empty-precision" style={{ border: `2px dashed ${t.border}`, borderRadius: 12, background: t.bg2, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.85 }} aria-hidden>🛒</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 8 }}>Cart is currently empty</div>
              <div style={{ fontSize: 14, color: t.text3, maxWidth: 360, lineHeight: 1.5 }}>Scan a barcode or search for a product to begin adding items to this transaction.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: t.text4, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3 }}>Keyboard: F2</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: t.text4, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3 }}>Search: F4</span>
              </div>
            </div>
            )
          : showExchangeSections ? (
            <>
              {filteredReturn.length === 0 && filteredReplacement.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: t.text3 }}><div style={{ fontSize: 32, marginBottom: 6 }}>🔍</div><div style={{ fontSize: 14, fontWeight: 700 }}>No match in cart</div></div>
              ) : (
                <>
                  {filteredReturn.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: t.yellow, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>↩️ Returning</div>
                      {filteredReturn.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                            <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: t.green, fontWeight: 800 }}>{fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)} × {item.qty}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: t.text, minWidth: 56, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
                          <button onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }} style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', fontSize: 17, flexShrink: 0, color: t.text4 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredReplacement.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: t.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>↔ Replacement</div>
                      {filteredReplacement.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                            <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: t.green, fontWeight: 800 }}>{fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)} × {item.qty}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                            <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: t.text, minWidth: 56, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
                          <button onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }} style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', fontSize: 17, flexShrink: 0, color: t.text4 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : filteredCart.length === 0
            ? <div style={{ textAlign: 'center', padding: '24px 16px', color: t.text3 }}><div style={{ fontSize: 32, marginBottom: 6 }}>🔍</div><div style={{ fontSize: 14, fontWeight: 700 }}>No match in cart</div></div>
            : filteredCart.map(item => (
            <div
              key={item.id}
              onClick={() => removeMode && removeFromCart(item.originalId || item.id)}
              style={{
                display: 'flex', gap: 10, alignItems: 'center', padding: '10px',
                border: `1px solid ${t.border}`,
                cursor: removeMode ? 'pointer' : 'default',
                borderRadius: 12,
                background: removeMode ? '#ef444408' : t.card,
                transition: 'background 0.15s',
                marginBottom: 10,
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.lineAttributes?.Name || item.name}</div>
                <CartLineAttributeDetails item={item} t={t} />
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
                      style={{ width: 82, background: t.input, border: `1px solid ${t.accent}`, borderRadius: 6, padding: '4px 8px', color: t.text, fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                ) : (
                  <div
                    style={{ fontSize: 13, color: item.discount > 0 ? t.accent : t.green, fontWeight: 800, cursor: isManager ? 'pointer' : 'default' }}
                    onClick={() => isManager && updateCartItemPrice && (setEditingPriceId(item.id), setEditPriceVal(String(item.price ?? 0)))}
                    title={isManager ? 'Click to override price' : ''}
                  >
                    {item.discount > 0 ? `${fmt(item.price * (1 - item.discount / 100), settings?.sym)} (-${item.discount}%)` : fmt(item.price, settings?.sym)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
                <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: t.text, minWidth: 58, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty)}</div>
              <button
                onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }}
                style={{
                  background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer',
                  fontSize: 18, flexShrink: 0,
                  color: removeMode ? '#ef4444' : t.text4,
                  transition: 'color 0.18s',
                }}
              >✕</button>
            </div>
          ))}
      </div>

      {!checkoutSplit && (
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, background: t.bg2 }}>
        {appliedCoupon
          ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 8, padding: '9px 14px' }}>
            <span style={{ fontSize: 14, color: t.green, fontWeight: 800 }}>🎟️ {appliedCoupon.code} — {appliedCoupon.description}</span>
            <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: t.red, cursor: 'pointer', fontSize: 17 }}>✕</button>
          </div>
          : <div style={{ display: 'flex', gap: 8 }}>
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" style={{ flex: 1, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 12px', color: t.text, fontSize: 14, outline: 'none' }} />
            <button onClick={applyCoupon} style={{ background: t.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          </div>}

        {selCust && (selCust.loyaltyPoints || 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 8, padding: '9px 14px' }}>
            <span style={{ fontSize: 14, color: t.yellow, fontWeight: 700 }}>⭐ Redeem {selCust.loyaltyPoints} pts = {fmt(selCust.loyaltyPoints * (settings?.loyaltyValue || 0.01), settings?.sym)}</span>
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
              onChange={e => setManualDiscountPct?.(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              style={{ width: 68, background: t.input, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 10px', color: t.text, fontSize: 14, fontWeight: 700 }}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          {[['Subtotal', fmt(cartSubtotal, settings?.sym)], ['Tax', fmt(cartTax, settings?.sym)], couponDiscount > 0 && [`Coupon (${appliedCoupon?.code})`, `-${fmt(couponDiscount, settings?.sym)}`], loyaltyDiscount > 0 && ['Loyalty Discount', `-${fmt(loyaltyDiscount, settings?.sym)}`], manualDiscountAmount > 0 && [`Manual (${manualDiscountPct ?? 0}%)`, `-${fmt(manualDiscountAmount, settings?.sym)}`]].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: v.startsWith?.('-') ? t.green : t.text3, marginBottom: 5 }}><span>{k}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, fontWeight: 900, color: t.text, paddingTop: 12, borderTop: `2px solid ${t.border}`, marginTop: 6 }}>
            <span>Total</span><span style={{ color: t.accent }}>{fmt(cartTotal, settings?.sym)}</span>
          </div>
          {selCust && pointsEarned > 0 && <div style={{ fontSize: 13, color: t.yellow, textAlign: 'right', marginTop: 4 }}>+{pointsEarned} loyalty pts will be earned</div>}
        </div>

        {loadedOrderForReturn ? (
          <>
            <div style={{ marginTop: 12, padding: 12, background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.yellow, marginBottom: 8, textTransform: 'uppercase' }}>↩️ Return / Exchange</div>
              <Select t={t} label="Reason" value={returnReasonCode} onChange={setReturnReasonCode} options={REASON_OPTIONS.map(r => ({ value: r.value, label: r.label }))} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setReturnProcessMode('return')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'return' ? t.accent : t.border}`, background: returnProcessMode === 'return' ? t.accent + '15' : t.bg3, color: returnProcessMode === 'return' ? t.accent : t.text3, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Return</button>
                <button onClick={() => setReturnProcessMode('exchange')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${returnProcessMode === 'exchange' ? t.accent : t.border}`, background: returnProcessMode === 'exchange' ? t.accent + '15' : t.bg3, color: returnProcessMode === 'exchange' ? t.accent : t.text3, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Exchange</button>
              </div>
              {returnProcessMode === 'return' && (
                <Select t={t} label="Refund" value={returnRefundMethod} onChange={setReturnRefundMethod} options={[{ value: 'original', label: 'Original payment' }, { value: 'store_credit', label: 'Store credit' }]} />
              )}
            </div>
            {returnProcessMode === 'exchange' && showExchangeSections && (
              <div style={{ marginTop: 8, fontSize: 13, color: t.text3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Return:</span><span style={{ fontWeight: 700 }}>{fmt(returnTotal, settings?.sym)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Replacement:</span><span style={{ fontWeight: 700, color: t.green }}>{fmt(replacementTotal, settings?.sym)}</span></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                onClick={processReturnFromCart}
                disabled={checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)}
                style={{ flex: 1, padding: '15px', background: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.bg4 : t.green, color: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? t.text3 : '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: (checkoutProcessing || (returnProcessMode === 'exchange' && replacementItems.length === 0)) ? 'not-allowed' : 'pointer' }}
              >
                {checkoutProcessing ? 'Processing...' : returnProcessMode === 'exchange'
                  ? (replacementItems.length === 0 ? 'Add replacement items' : `↔ Exchange (Return: ${returnItems.length}, Replace: ${replacementItems.length})`)
                  : `↩️ Refund ${fmt(returnTotal || cartTotal, settings?.sym)}`}
              </button>
              <button onClick={clearReturnMode} style={{ padding: '15px 16px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text2, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>✕ Cancel</button>
            </div>
          </>
        ) : (
          <>
        {!loadedOrderForReturn && cart.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `2px solid ${t.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Payment</div>
            <div style={{ padding: 14, background: t.bg3, borderRadius: 12, border: `1px solid ${t.border}` }}>
              <POSPaymentForm
                payMethod={payMethod} setPayMethod={setPayMethod}
                cashGiven={cashGiven} setCashGiven={setCashGiven} cashGivenNum={cashGivenNum} cashChange={cashChange} cartTotal={cartTotal}
                splitCash={splitCash} setSplitCash={setSplitCash} splitCard={splitCard} setSplitCard={setSplitCard}
                cardNum={cardNum} setCardNum={setCardNum} setCardExp={setCardExp} setCardCvv={setCardCvv}
                checkout={checkout} setShowCustDisplay={setShowCustDisplay}
                checkoutProcessing={checkoutProcessing} qrPaymentStatus={qrPaymentStatus}
                settings={settings} t={t}
              />
            </div>
          </div>
        )}
        {!loadedOrderForReturn && cart.length > 0 && (
          <button type="button" onClick={() => { setCart([]); setManualDiscountPct?.(0) }} style={{ width: '100%', padding: '10px', marginTop: 10, background: 'transparent', color: t.text4, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>🗑️ Clear Cart</button>
        )}
          </>
        )}
      </div>
      )}
    </div>
  )
}
