import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Btn, Input, Badge, Card, StatCard, Modal, Select } from '@/components/ui'
import { ImgWithFallback, notify } from '@/components/shared'
import { fmt, ts, genId } from '@/lib/utils'
import { CATEGORIES as INITIAL_CATEGORIES } from '@/lib/constants'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { fetchCategories, fetchSubCategories } from '@/services/categories'

const QtyInput = ({ qty, onChange, t }) => {
  const [val, setVal] = useState(qty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  import('react').then(({ useEffect }) => useEffect(() => setVal(qty), [qty]));
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
        width: 36, height: 24, textAlign: 'center',
        border: `1px solid ${t.border}`, borderRadius: 4,
        background: t.bg, fontSize: 14, fontWeight: 900, color: t.text, outline: 'none',
        MozAppearance: 'textfield', padding: 0, margin: 0
      }}
    />
  )
}

export const CustomerShop = ({ products, orders, setOrders, users, setUsers, currentUser: cuProp, banners, coupons, settings, t: tProp, addGlobalNotif }) => {
  const { t: tCtx } = useTheme()
  const { currentUser: cuCtx } = useAuth()
  const t = tProp || tCtx
  const currentUser = cuProp || cuCtx

  const [search, setSearch] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('All')
  const [activeSubCategoryId, setActiveSubCategoryId] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [viewProduct, setViewProduct] = useState(null)
  const [orderType, setOrderType] = useState('pickup')
  const [deliveryAddr, setDeliveryAddr] = useState('')
  const [deliveryZone, setDeliveryZone] = useState(settings.deliveryZones?.[0]?.zone || '')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({ num: '', exp: '', name: currentUser?.name || '' })
  const [cardApproved, setCardApproved] = useState(false)

  const { data: dbCategoriesData = [] } = useQuery({
    queryKey: ['customer-categories'],
    queryFn: fetchCategories
  })

  // We fetch all subcategories at once to avoid waterfall
  const { data: dbSubCategoriesData = [] } = useQuery({
    queryKey: ['customer-sub-categories'],
    queryFn: () => fetchSubCategories()
  })

  const dbCategories = dbCategoriesData || INITIAL_CATEGORIES.filter(c => c !== 'All').map((c, i) => ({ id: `seed-${i}`, name: c }))
  const dbSubCategories = dbSubCategoriesData || []

  const validSubCategories = activeCategoryId === 'All' 
    ? [] 
    : dbSubCategories.filter(s => s.category_id === activeCategoryId)

  const handleCategoryClick = (catId) => {
    setActiveCategoryId(catId)
    setActiveSubCategoryId('All')
  }

  const activeOffers = (banners || []).filter(b => b.active && b.offerType !== 'none')
  const getDisc = (p) => {
    const o = activeOffers.find(b => b.offerType === 'category' && b.offerTarget === p.category)
    return Math.max(o ? o.offerDiscount : 0, p.discount || 0)
  }

  let filtered = products
    .filter(p => {
      let matchesCategory = true;
      if (activeCategoryId !== 'All') {
        const isSeedData = p.category_id == null;
        if (isSeedData) {
          const catObj = dbCategories.find(c => c.id === activeCategoryId);
          matchesCategory = catObj && p.category === catObj.name;
        } else {
          matchesCategory = p.category_id === activeCategoryId;
        }
      }

      let matchesSubCategory = true;
      if (activeSubCategoryId !== 'All') {
        const isSeedData = p.category_id == null;
        if (isSeedData) {
          matchesSubCategory = false; 
        } else {
          matchesSubCategory = p.subcategory_id === activeSubCategoryId;
        }
      }

      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSubCategory && matchesSearch;
    })

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  else if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  else if (sortBy === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  const addToCart = (p, size) => {
    const disc = getDisc(p)
    const key = p.id + (size ? '__' + size : '')
    setCart(c => { const ex = c.find(i => i._key === key); return ex ? c.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1, _key: key, selectedSize: size || '', discount: disc }] })
    notify(p.name + (size ? ' (' + size + ')' : '') + ' added to cart', 'success')
  }
  const updateQty = (key, d) => setCart(c => c.map(i => i._key === key ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0))

  const subtotal = cart.reduce((s, i) => s + i.price * (1 - (i.discount || 0) / 100) * i.qty, 0)
  const deliveryFee = orderType === 'delivery' ? (settings.deliveryZones?.find(z => z.zone === deliveryZone)?.charge || 0) : 0
  const vatAmt = cart.reduce((s, i) => { const lineNet = i.price * (1 - (i.discount || 0) / 100) * i.qty; return s + lineNet * ((i.taxPct ?? 20) / 100) }, 0)
  let couponDisc = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') couponDisc = (subtotal + vatAmt + deliveryFee) * appliedCoupon.value / 100
    else if (appliedCoupon.type === 'fixed') couponDisc = Math.min(appliedCoupon.value, subtotal + vatAmt + deliveryFee)
    else if (appliedCoupon.type === 'delivery') couponDisc = deliveryFee
  }
  const total = Math.max(0, Math.round((subtotal + vatAmt + deliveryFee - couponDisc) * 100) / 100)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const applyCoupon = () => {
    const c = coupons.find(x => x.code === couponCode.toUpperCase() && x.active)
    if (!c) { notify('Invalid coupon code', 'error'); return }
    if (subtotal < c.minOrder) { notify(`Minimum order ${fmt(c.minOrder, settings?.sym)} required`, 'error'); return }
    setAppliedCoupon(c); notify('Coupon applied! ' + c.description, 'success')
  }

  const doPlaceOrder = (payment) => {
    if (cart.length === 0) return
    if (orderType === 'delivery' && !deliveryAddr.trim()) { notify('Please enter delivery address', 'error'); return }
    const pts = Math.floor(total * (settings.loyaltyRate || 1))
    const newOrder = {
      id: genId('ORD'), customerId: currentUser.id, customerName: currentUser.name,
      cashierId: null, cashierName: 'Online',
      items: cart.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price, discount: i.discount || 0, size: i.selectedSize || '' })),
      subtotal, tax: vatAmt, discountAmt: couponDisc, loyaltyDiscount: 0, couponDiscount: couponDisc,
      couponCode: appliedCoupon?.code || null, deliveryCharge: deliveryFee, total,
      payment, date: ts(), counter: 'Online', status: 'preparing',
      orderType, deliveryAddress: orderType === 'delivery' ? deliveryAddr : null,
      deliveryZone: orderType === 'delivery' ? deliveryZone : null,
      deliveryStatus: orderType === 'delivery' ? 'pending' : null,
      loyaltyEarned: pts, loyaltyUsed: 0,
    }
    setUsers(us => us.map(u => u.id === currentUser.id ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) + pts, totalSpent: (u.totalSpent || 0) + total } : u))
    setOrders(os => [newOrder, ...os])
    if (addGlobalNotif) addGlobalNotif('Order ' + newOrder.id + ' placed! ' + (orderType === 'delivery' ? 'Delivery in 2-3 days.' : 'Ready for pickup soon.'), 'success')
    setOrderPlaced(newOrder)
    setCart([]); setAppliedCoupon(null); setCouponCode(''); setShowPayment(false); setCardApproved(false); setShowCart(false)
    notify('Order placed! ' + newOrder.id, 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, color: '#fff', border: 'none', borderRadius: 50, padding: '12px 20px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 20px ${t.accent}60`, display: 'flex', alignItems: 'center', gap: 8 }}>
          🛒 Cart ({cartCount}) · {fmt(total, settings?.sym)}
        </button>
      )}

      <div style={{ background: t.bg2, borderBottom: `1px solid ${t.border}`, padding: '14px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '9px 14px 9px 32px', color: t.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '9px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <div style={{ background: t.bg2, padding: '12px 20px 0', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: validSubCategories.length > 0 ? 0 : 12, borderBottom: validSubCategories.length > 0 ? 'none' : `1px solid ${t.border}` }}>
        <button 
          onClick={() => handleCategoryClick('All')} 
          style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeCategoryId === 'All' ? t.accent : t.border}`, background: activeCategoryId === 'All' ? t.accent : 'transparent', color: activeCategoryId === 'All' ? '#fff' : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
        >
          All
        </button>
        {dbCategories.map(c => (
          <button 
            key={c.id} 
            onClick={() => handleCategoryClick(c.id)} 
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeCategoryId === c.id ? t.accent : t.border}`, background: activeCategoryId === c.id ? t.accent : 'transparent', color: activeCategoryId === c.id ? '#fff' : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {validSubCategories.length > 0 && (
        <div style={{ background: t.bg2, borderBottom: `1px solid ${t.border}`, padding: '10px 20px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveSubCategoryId('All')} 
            style={{ padding: '5px 12px', borderRadius: 16, border: `1px solid ${activeSubCategoryId === 'All' ? t.accent : t.border}`, background: activeSubCategoryId === 'All' ? t.accent + '20' : 'transparent', color: activeSubCategoryId === 'All' ? t.accent : t.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            All
          </button>
          {validSubCategories.map(s => (
            <button 
              key={s.id} 
              onClick={() => setActiveSubCategoryId(s.id)} 
              style={{ padding: '5px 12px', borderRadius: 16, border: `1px solid ${activeSubCategoryId === s.id ? t.accent : t.border}`, background: activeSubCategoryId === s.id ? t.accent + '20' : 'transparent', color: activeSubCategoryId === s.id ? t.accent : t.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 'clamp(10px,2vw,20px)' }}>
        <div style={{ fontSize: 13, color: t.text3, marginBottom: 14 }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(200px,45vw),1fr))', gap: 'clamp(10px,2vw,16px)' }}>
          {filtered.map(p => {
            const disc = getDisc(p)
            return (
              <div key={p.id} style={{ background: t.card, border: `1px solid ${disc > 0 ? t.accent : t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadow, transition: 'transform .15s,box-shadow .15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.shadowMd }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = t.shadow }}>
                <div style={{ position: 'relative', height: 165, background: t.bg3, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setViewProduct(p)}>
                  <ImgWithFallback src={p.image_url || p.image || PRODUCT_IMAGES[p.name]} alt={p.name} emoji={p.emoji} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {disc > 0 && <div style={{ position: 'absolute', top: 8, left: 8, background: t.accent, color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 900 }}>-{disc}% OFF</div>}
                  {p.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>OUT OF STOCK</div>}
                </div>
                <div style={{ padding: '11px 13px' }}>
                  <div style={{ fontSize: 10, color: t.text3, marginBottom: 2 }}>{p.category}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {disc > 0 ? <><div style={{ fontSize: 11, color: t.text4, textDecoration: 'line-through' }}>{fmt(p.price, settings?.sym)}</div><div style={{ fontSize: 16, fontWeight: 900, color: t.accent }}>{fmt(p.price * (1 - disc / 100), settings?.sym)}</div></> : <div style={{ fontSize: 16, fontWeight: 900, color: t.green }}>{fmt(p.price, settings?.sym)}</div>}
                    </div>
                    {p.stock > 0 && (
                      <button onClick={() => p.sizes?.length > 1 ? setViewProduct(p) : addToCart(p)} style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Add</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 700 }}>No products found</div></div>}
      </div>

      {viewProduct && (
        <Modal t={t} title={viewProduct.name} subtitle={viewProduct.category} onClose={() => setViewProduct(null)} width={520}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 'min(200px,100%)', flexShrink: 0 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', background: t.bg3, height: 200 }}>
                <ImgWithFallback src={viewProduct.image_url || viewProduct.image || PRODUCT_IMAGES[viewProduct.name]} alt={viewProduct.name} emoji={viewProduct.emoji} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.7, marginBottom: 14 }}>{viewProduct.description}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: getDisc(viewProduct) > 0 ? t.accent : t.green, marginBottom: 14 }}>{fmt(viewProduct.price * (1 - getDisc(viewProduct) / 100), settings?.sym)}</div>
              {viewProduct.stock > 0 ? (
                <Btn t={t} fullWidth onClick={() => { addToCart(viewProduct); setViewProduct(null) }}>🛒 Add to Cart</Btn>
              ) : (
                <div style={{ background: t.redBg, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: t.red, fontWeight: 700, textAlign: 'center' }}>❌ Out of stock</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex' }}>
          <div onClick={() => setShowCart(false)} style={{ flex: 1, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ width: 'min(420px,100vw)', background: t.bg2, borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', boxShadow: t.shadowLg }}>
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: t.text }}>🛒 Your Cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: t.text3, fontSize: 14 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              {cart.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: t.text3 }}><div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>Your cart is empty</div> : (
                <>
                  {cart.map(item => (
                    <div key={item._key} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ width: 48, height: 48, borderRadius: 9, overflow: 'hidden', flexShrink: 0, background: t.bg3 }}>
                        <ImgWithFallback src={item.image_url || item.image || PRODUCT_IMAGES[item.name]} alt={item.name} emoji={item.emoji} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: t.green, fontWeight: 800 }}>{fmt(item.price * (1 - (item.discount || 0) / 100), settings?.sym)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button onClick={() => updateQty(item._key, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <QtyInput qty={item.qty} onChange={n => updateQty(item._key, n - item.qty)} t={t} />
                        <button onClick={() => updateQty(item._key, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bg3, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: t.text, minWidth: 54, textAlign: 'right' }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty, settings?.sym)}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, display: 'flex', gap: 7 }}>
                    {[['pickup', '📦 Pickup'], ['delivery', '🚚 Delivery']].map(([v, l]) => (
                      <button key={v} onClick={() => setOrderType(v)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1px solid ${orderType === v ? t.accent : t.border}`, background: orderType === v ? t.accent + '15' : t.bg3, color: orderType === v ? t.accent : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                  {orderType === 'delivery' && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Input t={t} label="Delivery Address" value={deliveryAddr} onChange={setDeliveryAddr} placeholder="Full address including postcode" />
                      <Select t={t} label="Zone" value={deliveryZone} onChange={setDeliveryZone} options={(settings.deliveryZones || []).map(z => ({ value: z.zone, label: `${z.zone} — ${fmt(z.charge, settings?.sym)} (${z.days}d)` }))} />
                    </div>
                  )}
                  {appliedCoupon ? (
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 9, padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, color: t.green, fontWeight: 800 }}>🎟️ {appliedCoupon.code}</span>
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: t.red, cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" style={{ flex: 1, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 10px', color: t.text, fontSize: 12, outline: 'none' }} />
                      <button onClick={applyCoupon} style={{ background: t.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[['Subtotal', fmt(subtotal, settings?.sym)], ['Tax', fmt(vatAmt, settings?.sym)], deliveryFee > 0 && ['Delivery', fmt(deliveryFee, settings?.sym)], couponDisc > 0 && ['Discount', '-' + fmt(couponDisc, settings?.sym)]].filter(Boolean).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text3 }}><span>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: t.text, paddingTop: 10, borderTop: `2px solid ${t.border}`, marginTop: 4 }}>
                      <span>Total</span><span style={{ color: t.accent }}>{fmt(total, settings?.sym)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}` }}>
                <button onClick={() => setShowPayment(true)} style={{ width: '100%', padding: 13, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 14px ${t.accent}40` }}>
                  Checkout · {fmt(total, settings?.sym)} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPayment && (
        <Modal t={t} title="💳 Payment" subtitle={`Total: ${fmt(total, settings?.sym)}`} onClose={() => { setShowPayment(false); setCardApproved(false) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['card', '💳 Card'], ['cod', '💵 Cash on Delivery']].map(([v, l]) => (
                <button key={v} onClick={() => { setPayMethod(v); setCardApproved(false) }} style={{ flex: 1, padding: '10px 8px', borderRadius: 9, border: `2px solid ${payMethod === v ? t.accent : t.border}`, background: payMethod === v ? t.accent + '15' : 'transparent', color: payMethod === v ? t.accent : t.text3, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
            {payMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ background: '#0a0f1e', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ fontSize: 10, color: '#607090', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Card Terminal · PCI DSS</div>
                  {!cardApproved ? (
                    <>
                      <input value={cardDetails.name} onChange={e => setCardDetails(d => ({ ...d, name: e.target.value }))} placeholder="Cardholder Name" style={{ background: '#141b2d', border: '1px solid #1e2d40', borderRadius: 8, padding: '8px 12px', color: '#f0f4ff', fontSize: 13, outline: 'none' }} />
                      <input value={cardDetails.num} onChange={e => setCardDetails(d => ({ ...d, num: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="Card Number" style={{ background: '#141b2d', border: '1px solid #1e2d40', borderRadius: 8, padding: '8px 12px', color: '#f0f4ff', fontSize: 13, outline: 'none', letterSpacing: 2 }} />
                      <button disabled={!cardDetails.num || cardDetails.num.length < 14 || !cardDetails.name}
                        onClick={() => setCardApproved(true)}
                        style={{ padding: '11px', background: cardDetails.num?.length >= 14 && cardDetails.name ? '#ef4444' : '#1e2d40', color: cardDetails.num?.length >= 14 && cardDetails.name ? '#fff' : '#607090', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 900, cursor: cardDetails.num?.length >= 14 && cardDetails.name ? 'pointer' : 'not-allowed' }}>
                        TAP / PAY {fmt(total, settings?.sym)}
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '14px' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e' }}>APPROVED</div>
                    </div>
                  )}
                </div>
                {cardApproved && <Btn t={t} variant="success" fullWidth onClick={() => doPlaceOrder('Card')}>Confirm Order →</Btn>}
              </div>
            )}
            {payMethod === 'cod' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.yellow, marginBottom: 6 }}>💵 Cash on Delivery</div>
                  <div style={{ fontSize: 13, color: t.text2 }}>Pay <strong>{fmt(total, settings?.sym)}</strong> when your order {orderType === 'delivery' ? 'arrives' : 'is ready for pickup'}.</div>
                </div>
                <Btn t={t} variant="success" fullWidth onClick={() => doPlaceOrder('Cash on Delivery')}>Place COD Order →</Btn>
              </div>
            )}
          </div>
        </Modal>
      )}

      {orderPlaced && (
        <Modal t={t} title="✅ Order Placed!" onClose={() => setOrderPlaced(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: t.text, marginBottom: 4 }}>{orderPlaced.id}</div>
            <div style={{ fontSize: 13, color: t.text3, marginBottom: 18 }}>{orderPlaced.orderType === 'delivery' ? 'Delivery in 2-3 days.' : 'Ready for pickup soon.'}</div>
            <div style={{ background: t.bg3, borderRadius: 12, padding: '12px 18px', textAlign: 'left', marginBottom: 14 }}>
              {orderPlaced.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: t.text2 }}><span>{i.name} ×{i.qty}</span><span>{fmt(i.price * i.qty, settings?.sym)}</span></div>)}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `1px solid ${t.border}`, marginTop: 6 }}><span>Total</span><span style={{ color: t.accent }}>{fmt(orderPlaced.total, settings?.sym)}</span></div>
            </div>
            <Btn t={t} onClick={() => setOrderPlaced(null)} fullWidth>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
