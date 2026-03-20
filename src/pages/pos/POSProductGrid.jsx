import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { ImgWithFallback } from '@/components/shared'
import { fmt } from '@/lib/utils'

export function POSProductGrid({
  search, setSearch, categories, cat, setCat, filteredProds, favProds,
  getItemDiscount, addToCart, scanMsg,
  parkBill, parked, recallBill, showParkedDropdown, setShowParkedDropdown,
  setShowBarcodeInput, setShowReprint, setShowReturnModal,
  loadOrderInput, setLoadOrderInput, loadOrderForReturn, loadOrderLoading, loadedOrderForReturn,
  returnProcessMode,
  settings, t,
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.posLeft, borderRight: `1px solid ${t.border}` }} className="pos-left">
      <div className="pos-grid-header" style={{ padding: '8px 10px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {loadedOrderForReturn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: t.yellow, background: t.yellowBg, padding: '6px 10px', borderRadius: 8, border: `1px solid ${t.yellowBorder}` }}>
              {returnProcessMode === 'exchange' ? '↔ Exchange: Add replacement items below' : `↩️ Return: ${loadedOrderForReturn.order_number || loadedOrderForReturn.id}`}
            </span>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search / SKU..." style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '8px 14px 8px 34px', color: t.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={loadOrderInput} onChange={e => setLoadOrderInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadOrderForReturn()} placeholder="Order #" style={{ width: 90, background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '8px 10px', color: t.text, fontSize: 12, outline: 'none' }} />
              <button onClick={() => loadOrderForReturn()} disabled={loadOrderLoading || !loadOrderInput?.trim()} style={{ padding: '8px 12px', background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 9, color: t.yellow, fontSize: 12, fontWeight: 800, cursor: loadOrderLoading || !loadOrderInput?.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>{loadOrderLoading ? '...' : '↩️ Load'}</button>
            </div>
          </>
        )}
        <button onClick={() => setShowBarcodeInput(true)} style={{ padding: '8px 12px', background: t.blueBg, border: `1px solid ${t.blueBorder}`, borderRadius: 9, color: t.blue, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>📷 Scan</button>
        {setShowReturnModal ? <button onClick={() => setShowReturnModal(true)} style={{ padding: '8px 12px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, color: t.text2, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>↩️ Return</button> : null}
        {setShowReprint ? <button onClick={() => setShowReprint(true)} style={{ padding: '8px 12px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, color: t.text2, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖨️ Reprint</button> : null}
        {scanMsg && <span style={{ fontSize: 12, color: t.green, fontWeight: 700 }}>{scanMsg}</span>}
        <button onClick={parkBill} style={{ padding: '8px 12px', background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 9, color: t.yellow, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>⏸ Park</button>
        {parked.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowParkedDropdown(v => !v)} style={{ padding: '8px 12px', background: t.purpleBg, border: `1px solid ${t.purpleBorder}`, borderRadius: 9, color: t.purple, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>📋 Recall ({parked.length})</button>
            {showParkedDropdown && (
              <div style={{ position: 'absolute', top: '110%', left: 0, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 8, zIndex: 100, minWidth: 200, boxShadow: t.shadowMd }}>
                {parked.map(pb => <button key={pb.id} onClick={() => recallBill(pb)} style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', textAlign: 'left', fontSize: 12, borderRadius: 6 }}>📋 {pb.id} — {pb.cart.length} items · {pb.ts}</button>)}
              </div>
            )}
          </div>
        )}
      </div>

      {favProds.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
          <div style={{ fontSize: 10, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>⭐ Favourites</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {favProds.map(p => {
              const disc = getItemDiscount(p)
              return (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock === 0} style={{ flexShrink: 0, background: t.card, border: `1px solid ${disc > 0 ? t.accent : t.border}`, borderRadius: 9, padding: '6px 12px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: p.stock === 0 ? 0.4 : 1 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.text, whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: t.green, fontWeight: 800 }}>{disc > 0 ? <><s style={{ color: t.text3 }}>{fmt(p.price, settings?.sym)}</s> {fmt(p.price * (1 - disc / 100), settings?.sym)}</> : fmt(p.price, settings?.sym)}</div>
                  </div>
                  {disc > 0 && <span style={{ fontSize: 9, background: t.accent, color: '#fff', borderRadius: 5, padding: '1px 5px', fontWeight: 900 }}>-{disc}%</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ padding: '10px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
          {(categories || []).map(c => <button key={c} onClick={() => setCat(c)} style={{ padding: '5px 13px', borderRadius: 20, border: 'none', background: cat === c ? t.accent : t.bg4, color: cat === c ? '#fff' : t.text3, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c}</button>)}
        </div>
      </div>

      <div className="pos-products-grid" style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, alignContent: 'start' }}>
        {filteredProds.map(p => {
          const disc = getItemDiscount(p)
          return (
            <div key={p.id} onClick={() => addToCart(p)} style={{ background: t.card, border: `1px solid ${disc > 0 ? t.accent : t.border}`, borderRadius: 11, overflow: 'hidden', cursor: p.stock === 0 ? 'not-allowed' : 'pointer', opacity: p.stock === 0 ? 0.45 : 1, transition: 'all 0.12s', boxShadow: t.shadow, position: 'relative' }}
              onMouseEnter={e => { if (p.stock > 0) e.currentTarget.style.boxShadow = t.shadowMd }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = t.shadow}>
              {disc > 0 && <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 1, background: t.accent, color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 900 }}>-{disc}% OFF</div>}
              <div style={{ height: 'clamp(60px,12vw,80px)', background: t.bg3, overflow: 'hidden' }}>
                <ImgWithFallback src={p.image || p.image_url || PRODUCT_IMAGES[p.name]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '7px 9px' }}>
                <div style={{ fontSize: 'clamp(9px,2.5vw,11px)', fontWeight: 700, color: t.text, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {disc > 0 ? <><div style={{ fontSize: 10, color: t.text4, textDecoration: 'line-through' }}>{fmt(p.price, settings?.sym)}</div><div style={{ fontSize: 12, fontWeight: 900, color: t.accent }}>{fmt(p.price * (1 - disc / 100), settings?.sym)}</div></> : <div style={{ fontSize: 12, fontWeight: 900, color: t.green }}>{fmt(p.price, settings?.sym)}</div>}
                  </div>
                  <div style={{ fontSize: 9, color: p.stock <= 5 ? t.red : t.text4 }}>Stk:{p.stock}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
