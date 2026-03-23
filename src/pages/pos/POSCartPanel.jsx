import { useState, useEffect, useRef } from 'react'
import { ImgWithFallback } from '@/components/shared'
import { Toggle, Select } from '@/components/ui'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { fmt } from '@/lib/utils'

const REASON_OPTIONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'changed_mind', label: 'Changed mind' },
  { value: 'other', label: 'Other' },
]

const QtyInput = ({ qty, onChange, t, focusTrigger }) => {
  const [val, setVal] = useState(qty);
  const inputRef = useRef(null);

  useEffect(() => setVal(qty), [qty]);

  useEffect(() => {
    if (focusTrigger) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusTrigger]);

  return (
    <input
      ref={inputRef}
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
  splitCash, setSplitCash, splitCard, setSplitCard, splitQr, setSplitQr,
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
  lastAddedTrigger,
  showFooter = true,
  isMobile = false,
}) {
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [editPriceVal, setEditPriceVal] = useState('')
  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const filteredCart = cartSearch.trim()
    ? cart.filter(i => i.name.toLowerCase().includes(cartSearch.toLowerCase()))
    : cart

  const cartListRef = useRef(null)
  useEffect(() => {
    if (!removeMode) return
    // Ensure "top" is visible when qty is reduced/moved to top in remove mode.
    if (cartListRef.current) cartListRef.current.scrollTop = 0
  }, [removeMode, cart])

  const gridTemplate = isMobile ? '1fr 100px 80px 30px' : '80px 1fr 140px 100px 120px 40px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}>
      {/* Table Header (Refined) */}
      <div style={{
        minWidth: isMobile ? 'auto' : 600,
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        background: '#0f172a',
        color: 'rgba(255,255,255,0.9)',
        padding: isMobile ? '12px 16px' : '16px 24px',
        fontWeight: 800,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        zIndex: 5
      }}>
        {!isMobile && <div>Product</div>}
        <div>{isMobile ? 'Item' : 'Details'}</div>
        <div style={{ textAlign: 'center' }}>Qty</div>
        {!isMobile && <div style={{ textAlign: 'right' }}>Price</div>}
        <div style={{ textAlign: 'right' }}>Total</div>
        <div></div>
      </div>

      {/* Item List (Premium Rows) */}
      <div ref={cartListRef} style={{ flex: 1, overflowY: 'auto', background: '#fcfcfc' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Your cart is empty</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#64748b' }}>Search or scan to start</div>
          </div>
        ) : (
          filteredCart.map((item, idx) => (
            <div
              key={item.id}
              className="fade-in"
              onClick={(e) => {
                if (!removeMode) return
                // Don't trigger remove when user is interacting with qty/input/buttons.
                const tag = (e.target?.tagName || '').toUpperCase()
                if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
                removeFromCart(item.id)
              }}
              style={{
                minWidth: isMobile ? 'auto' : 600,
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                padding: isMobile ? '12px 16px' : '16px 24px',
                alignItems: 'center',
                borderBottom: '1px solid #f1f5f9',
                background: removeMode ? '#fff5f5' : '#fff',
                cursor: removeMode ? 'pointer' : 'default',
                boxShadow: removeMode ? '0 0 0 2px rgba(239,68,68,0.18) inset, 0 6px 18px rgba(239,68,68,0.10)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {!isMobile && (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    cursor: removeMode ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (!removeMode) return
                    removeFromCart(item.id)
                  }}
                  title={removeMode ? 'Click to remove 1 qty' : undefined}
                >
                  <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ minWidth: 0, paddingRight: isMobile ? 8 : 16 }}>
                <div
                  style={{
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 800,
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: removeMode ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (!removeMode) return
                    removeFromCart(item.id)
                  }}
                  title={removeMode ? 'Click to remove 1 qty' : undefined}
                >
                  {item.name}
                </div>
                {!isMobile && <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 2 }}>SKU: {item.sku}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 10 }}>
                {!isMobile && (
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                )}
                <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} focusTrigger={lastAddedTrigger?.id === item.id ? lastAddedTrigger.ts : null} />
                {!isMobile && (
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                )}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                  {fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)}
                </div>
              )}
              <div style={{ textAlign: 'right', fontSize: isMobile ? 12 : 14, fontWeight: 900, color: '#10b981' }}>
                {fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty, settings?.sym)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => setCart(c => c.filter(i => i.id !== item.id))}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 18 }}
                >✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showFooter && (
        <div style={{ padding: isMobile ? '16px 20px' : '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -10px 30px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              <span>Order Subtotal</span>
              <span style={{ fontWeight: 800, color: '#1e293b' }}>{fmt(cartSubtotal, settings?.sym)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              <span>Estimated Tax (VAT)</span>
              <span style={{ fontWeight: 800, color: '#1e293b' }}>{fmt(cartTax, settings?.sym)}</span>
            </div>
            {couponDiscount + loyaltyDiscount + manualDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '10px 16px', borderRadius: 12 }}>
                <span>Total Discounts Applied</span>
                <span>-{fmt(couponDiscount + loyaltyDiscount + manualDiscountAmount, settings?.sym)}</span>
              </div>
            )}
            <div style={{
              background: '#0f172a',
              borderRadius: 20,
              padding: isMobile ? '16px 20px' : '20px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.2)'
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Final Total</div>
              <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#ffffff', letterSpacing: -1 }}>{fmt(cartTotal, settings?.sym)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
