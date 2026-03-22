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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}>
      {/* Table Header */}
      <div style={{ minWidth: 600, display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 40px', background: '#ef4444', color: '#fff', padding: '12px 16px', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        <div>Image</div>
        <div>Name</div>
        <div style={{ textAlign: 'center' }}>Qty</div>
        <div style={{ textAlign: 'right' }}>Price</div>
        <div style={{ textAlign: 'right' }}>Total</div>
        <div></div>
      </div>

      {/* Item List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No items in cart</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Scan an item or search above</div>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={item.id} style={{ minWidth: 600, display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 40px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9' }}>
                <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0, paddingRight: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{item.sku}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} focusTrigger={lastAddedTrigger?.id === item.id ? lastAddedTrigger.ts : null} />
                <button onClick={() => updateQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                {fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 900, color: '#ef4444' }}>
                {fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty, settings?.sym)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showFooter && (
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(cartSubtotal, settings?.sym)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b' }}>
              <span>Tax</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(cartTax, settings?.sym)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#10b981' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 700 }}>-{fmt(couponDiscount + loyaltyDiscount + manualDiscountAmount, settings?.sym)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, fontWeight: 900, color: '#1e293b', marginTop: 8, borderTop: '1px solid #cbd5e1', paddingTop: 12 }}>
              <span>Total Payable</span>
              <span style={{ color: '#ef4444' }}>{fmt(cartTotal, settings?.sym)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
