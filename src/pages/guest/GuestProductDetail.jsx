import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { fmt } from '@/lib/utils'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { ImgWithFallback } from '@/components/shared'
import { Btn } from '@/components/ui'

export function GuestProductDetail({ products = [], settings = {} }) {
  const { t } = useTheme()
  const { productId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const product = location.state?.product || products.find(p => String(p.id) === productId)

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || null)
  const [qty, setQty] = useState(1)

  if (!product) {
    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text, marginBottom: 8 }}>Product Not Found</div>
          <div style={{ fontSize: 14, color: t.text3, marginBottom: 24 }}>This product may have been removed or doesn't exist.</div>
          <Btn t={t} onClick={() => navigate('/shop')}>← Back to Shop</Btn>
        </div>
      </div>
    )
  }

  const img = product.image_url || product.image || PRODUCT_IMAGES[product.name]
  const hasPromo = !!product.promotionalPrice
  const hasDiscount = product.discount > 0 || hasPromo
  const finalPrice = hasPromo ? product.promotionalPrice : product.price * (1 - (product.discount || 0) / 100)

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: t.bg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 5%' }}>
        <button onClick={() => navigate('/shop')} style={{
          background: 'none', border: 'none', color: t.text3, cursor: 'pointer',
          fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back to Shop</button>

        <div style={{ display: 'flex', gap: 'clamp(20px,4vw,48px)', flexWrap: 'wrap' }}>
          {/* Image */}
          <div style={{ flex: '1 1 300px', maxWidth: 520 }}>
            <div style={{
              background: t.bg3, borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${t.border}`, position: 'relative',
            }}>
              <ImgWithFallback
                src={img}
                fallback={product.emoji || '📦'}
                alt={product.name}
                style={{ width: '100%', height: 'clamp(300px,40vw,480px)', objectFit: 'cover' }}
              />
              {product.stock === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 22, fontWeight: 900,
                }}>OUT OF STOCK</div>
              )}
              {hasDiscount && product.stock > 0 && (
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: t.accent, color: '#fff', borderRadius: 10,
                  padding: '6px 14px', fontSize: 13, fontWeight: 900,
                }}>
                  {hasPromo ? 'PROMO' : `-${product.discount}%`}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: '1 1 320px' }}>
            <div style={{
              fontSize: 11, color: t.accent, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
            }}>{product.category}</div>

            <h1 style={{
              fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900,
              color: t.text, lineHeight: 1.15, margin: '0 0 8px',
            }}>{product.name}</h1>

            <div style={{ fontSize: 12, color: t.text4, marginBottom: 20 }}>
              SKU: {product.sku || 'N/A'} {product.barcode ? ` · Barcode: ${product.barcode}` : ''}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 900, color: t.accent }}>{fmt(finalPrice, settings?.sym)}</span>
              {hasDiscount && (
                <span style={{ fontSize: 16, color: t.text4, textDecoration: 'line-through' }}>{fmt(product.price, settings?.sym)}</span>
              )}
              {hasDiscount && (
                <span style={{
                  background: '#fef2f2', color: '#dc2626', fontSize: 12,
                  fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                }}>
                  Save {fmt(product.price - finalPrice, settings?.sym)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 24,
              background: product.stock > 5 ? '#f0fdf4' : product.stock > 0 ? '#fefce8' : '#fef2f2',
              color: product.stock > 5 ? '#16a34a' : product.stock > 0 ? '#ca8a04' : '#dc2626',
            }}>
              <span>{product.stock > 5 ? '✓' : product.stock > 0 ? '⚠' : '✗'}</span>
              {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>Size</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} style={{
                      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      background: selectedSize === s ? t.accent : t.bg3,
                      color: selectedSize === s ? '#fff' : t.text,
                      border: `2px solid ${selectedSize === s ? t.accent : t.border}`,
                      transition: 'all .15s',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 10 }}>Quantity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                  width: 44, height: 44, borderRadius: '10px 0 0 10px',
                  border: `1px solid ${t.border}`, background: t.bg3, color: t.text,
                  cursor: 'pointer', fontSize: 20, fontWeight: 900,
                }}>−</button>
                <input type="number" value={qty}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setQty(Math.min(product.stock || 99, Math.max(1, val)));
                    else setQty('');
                  }}
                  onBlur={() => { if (!qty || qty < 1) setQty(1) }}
                  style={{
                  width: 60, height: 44, textAlign: 'center',
                  border: `1px solid ${t.border}`, borderLeft: 'none', borderRight: 'none',
                  background: t.bg, fontSize: 16, fontWeight: 900, color: t.text, outline: 'none',
                  MozAppearance: 'textfield'
                }} />
                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{
                  width: 44, height: 44, borderRadius: '0 10px 10px 0',
                  border: `1px solid ${t.border}`, background: t.bg3, color: t.text,
                  cursor: 'pointer', fontSize: 20, fontWeight: 900,
                }}>+</button>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                disabled={product.stock === 0}
                onClick={() => navigate('/login')}
                style={{
                  flex: '1 1 200px', padding: '16px 28px', borderRadius: 14, border: 'none',
                  background: product.stock === 0 ? t.bg4 : t.accent,
                  color: product.stock === 0 ? t.text3 : '#fff',
                  fontSize: 16, fontWeight: 900, cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: product.stock === 0 ? 'none' : `0 4px 20px ${t.accent}40`,
                  transition: 'transform .1s',
                }}
                onMouseDown={e => { if (product.stock > 0) e.currentTarget.style.transform = 'scale(.97)' }}
                onMouseUp={e => { e.currentTarget.style.transform = '' }}
              >
                {product.stock === 0 ? 'Out of Stock' : `Sign In to Buy — ${fmt(finalPrice * qty, settings?.sym)}`}
              </button>
            </div>

            <div style={{
              marginTop: 16, padding: '12px 16px', background: t.bg3,
              borderRadius: 10, fontSize: 12, color: t.text3, lineHeight: 1.6,
            }}>
              Sign in or register to add items to your cart and complete your purchase. Members earn loyalty points on every order.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
