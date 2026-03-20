import { useState } from 'react'
import { Modal, Btn } from '@/components/ui'
import { ImgWithFallback } from './ImgWithFallback'
import { fmt } from '@/lib/utils'
import { PRODUCT_IMAGES } from '@/lib/seed-data'

export function ProductDetailModal({ product, onClose, onAddToCart, t, settings }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null)
  const [qty, setQty] = useState(1)

  if (!product) return null

  const img = product.image_url || product.image || PRODUCT_IMAGES[product.name]
  const effectivePrice = product.promotionalPrice || product.price
  const hasDiscount = product.discount > 0 || product.promotionalPrice
  const finalPrice = product.promotionalPrice || (product.price * (1 - (product.discount || 0) / 100))

  const handleAdd = () => {
    onAddToCart?.({ ...product, selectedSize, qty })
    onClose()
  }

  return (
    <Modal t={t} title={product.name} onClose={onClose} width={520}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 180px' }}>
          <ImgWithFallback
            src={img}
            fallback={product.emoji || '📦'}
            alt={product.name}
            style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, background: t.bg3 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: t.text3, marginBottom: 4 }}>{product.category}</div>
          <div style={{ fontSize: 11, color: t.text4, marginBottom: 12 }}>SKU: {product.sku || 'N/A'}</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: t.accent }}>{fmt(finalPrice, settings?.sym)}</span>
            {hasDiscount && <span style={{ fontSize: 14, color: t.text4, textDecoration: 'line-through' }}>{fmt(product.price, settings?.sym)}</span>}
          </div>

          <div style={{ fontSize: 12, color: product.stock > 0 ? '#16a34a' : '#ef4444', fontWeight: 700, marginBottom: 12 }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          {product.sizes?.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.text2, marginBottom: 6 }}>Size</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: selectedSize === s ? t.accent : t.bg3,
                    color: selectedSize === s ? '#fff' : t.text,
                    border: `1px solid ${selectedSize === s ? t.accent : t.border}`,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text2 }}>Qty</span>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, fontWeight: 900,
            }}>−</button>
            <input type="number" value={qty}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setQty(Math.min(product.stock || 99, Math.max(1, val)));
                else setQty('');
              }}
              onBlur={() => { if (!qty || qty < 1) setQty(1) }}
              style={{
                width: 40, height: 30, textAlign: 'center',
                border: `1px solid ${t.border}`, borderRadius: 4,
                background: t.bg, fontSize: 14, fontWeight: 900, color: t.text, outline: 'none',
                MozAppearance: 'textfield'
              }}
            />
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.bg3, color: t.text, cursor: 'pointer', fontSize: 16, fontWeight: 900,
            }}>+</button>
          </div>

          <Btn t={t} onClick={handleAdd} disabled={product.stock === 0} style={{ width: '100%' }}>
            {product.stock === 0 ? 'Out of Stock' : `Add to Cart — ${fmt(finalPrice * qty, settings?.sym)}`}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
