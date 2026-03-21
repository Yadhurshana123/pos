import React, { useEffect, useState } from 'react'
import { ImgWithFallback } from '@/components/shared'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { fmt } from '@/lib/utils'

const LINE_ATTR_ORDER = ['Name', 'Brand', 'Size', 'Color', 'Material', 'Print name']

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
    <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${t.border}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {detailKeys.map(k => (
        <div key={k} style={{ fontSize: 11, color: t.text3, lineHeight: 1.35 }}>
          <span style={{ fontWeight: 800, color: t.text4 }}>{k}: </span>
          <span style={{ color: t.text2 }}>{la[k]}</span>
        </div>
      ))}
    </div>
  )
}

const QtyInput = ({ qty, onChange, t }) => {
  const [val, setVal] = useState(qty)
  useEffect(() => setVal(qty), [qty])
  return (
    <input
      type="number"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => {
        let n = parseInt(val, 10)
        if (isNaN(n) || n < 1) n = 1
        setVal(n)
        if (n !== qty) onChange(n)
      }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
      onFocus={e => e.target.select()}
      style={{
        width: 44, height: 34, textAlign: 'center',
        border: `1px solid ${t.border}`, borderRadius: 8,
        background: t.bg, fontSize: 15, fontWeight: 900, color: t.text, outline: 'none',
        MozAppearance: 'textfield', padding: 0, margin: 0,
      }}
    />
  )
}

export function CartTable({
  cart,
  filteredCart,
  removeMode,
  setRemoveMode,
  updateQty,
  setCart,
  removeFromCart,
  settings,
  t,
  isManager,
  editingPriceId,
  setEditingPriceId,
  editPriceVal,
  setEditPriceVal,
  updateCartItemPrice,
  onEmptyScan,
}) {
  const touchBtn = {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.bg3,
    color: t.text,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (cart.length === 0) {
    return (
      <div
        className="pos-cart-empty-precision"
        style={{
          borderRadius: 16,
          background: t.bg3,
          border: `1px dashed ${t.border}`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.75 }} aria-hidden>🛒</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 6 }}>No items yet</div>
        <div style={{ fontSize: 13, color: t.text3, maxWidth: 320, lineHeight: 1.45, marginBottom: 18 }}>
          Scan a barcode or search — <kbd style={{ padding: '2px 6px', borderRadius: 4, background: t.bg3, border: `1px solid ${t.border}` }}>Enter</kbd> adds the first match.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={onEmptyScan} style={{ ...touchBtn, padding: '10px 18px', fontSize: 15, fontWeight: 800, background: t.blue, borderColor: t.blueBorder, color: '#fff' }}>
            Scan barcode
          </button>
        </div>
      </div>
    )
  }

  if (filteredCart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 16px', color: t.text3 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }} aria-hidden>🔍</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>No lines match cart filter</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }} role="table" aria-label="Cart">
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px 10px', fontSize: 11, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.06 }}>
        <span style={{ flex: 1 }}>Product</span>
        <span style={{ width: 148, textAlign: 'center' }}>Qty</span>
        <span style={{ width: 88, textAlign: 'right' }}>Line</span>
        <span style={{ width: 36 }} />
      </div>
      {filteredCart.map(item => (
        <div
          key={item.id}
          role="row"
          onClick={() => removeMode && removeFromCart?.(item.originalId || item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 10px',
            marginBottom: 8,
            borderRadius: 12,
            background: removeMode ? 'rgba(239,68,68,0.06)' : t.card,
            boxShadow: '0 1px 8px rgba(15, 23, 42, 0.06)',
            cursor: removeMode ? 'pointer' : 'default',
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
            <ImgWithFallback src={item.image || item.image_url || PRODUCT_IMAGES[item.name]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.lineAttributes?.Name || item.name}</div>
            <CartLineAttributeDetails item={item} t={t} />
            {editingPriceId === item.id ? (
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
                style={{ marginTop: 6, width: 88, background: t.input, border: `1px solid ${t.accent}`, borderRadius: 6, padding: '4px 8px', color: t.text, fontSize: 13, fontWeight: 700 }}
              />
            ) : (
              <div
                style={{ fontSize: 13, color: item.discount > 0 ? t.accent : t.green, fontWeight: 800, marginTop: 4, cursor: isManager ? 'pointer' : 'default' }}
                onClick={e => { e.stopPropagation(); if (isManager && updateCartItemPrice) { setEditingPriceId(item.id); setEditPriceVal(String(item.price ?? 0)) } }}
                title={isManager ? 'Override price' : ''}
              >
                {item.discount > 0 ? `${fmt(item.price * (1 - item.discount / 100), settings?.sym)} (−${item.discount}%)` : fmt(item.price, settings?.sym)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(item.id, -1)} style={touchBtn}>−</button>
            <QtyInput qty={item.qty} onChange={n => updateQty(item.id, n - item.qty)} t={t} />
            <button type="button" aria-label="Increase quantity" onClick={() => updateQty(item.id, 1)} style={touchBtn}>+</button>
          </div>
          <div style={{ width: 88, fontSize: 16, fontWeight: 900, color: t.text, textAlign: 'right', flexShrink: 0 }}>
            {fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty, settings?.sym)}
          </div>
          <button
            type="button"
            aria-label="Remove line"
            onClick={e => { e.stopPropagation(); setCart(c => c.filter(i => i.id !== item.id)) }}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              fontSize: 18,
              color: t.text3,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setRemoveMode(r => !r)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            border: `1px solid ${removeMode ? t.redBorder : t.border}`,
            background: removeMode ? t.redBg : t.bg3,
            color: removeMode ? t.red : t.text3,
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: removeMode ? t.red : 'transparent', border: `2px solid ${removeMode ? t.red : t.text4}` }} />
          Remove mode
        </button>
      </div>
    </div>
  )
}
