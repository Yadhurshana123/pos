import { fmt } from '@/lib/utils'
import { SearchBar } from './SearchBar'

const secondaryBtn = (t) => ({
  padding: '8px 12px',
  minHeight: 40,
  background: t.bg3,
  border: `1px solid ${t.border}`,
  borderRadius: 10,
  color: t.text4,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
})

const primaryBtn = (t) => ({
  ...secondaryBtn(t),
  background: `${t.blue}14`,
  borderColor: t.blueBorder,
  color: t.blue,
  fontWeight: 800,
})

/** Top strip: order context, full-width search, primary scan, secondary actions, match list. */
export function POSProductGrid({
  search,
  setSearch,
  searchInputRef,
  onSearchEnter,
  filteredProds,
  getItemDiscount,
  addToCart,
  scanMsg,
  parkBill,
  parked,
  recallBill,
  showParkedDropdown,
  setShowParkedDropdown,
  setShowBarcodeInput,
  setShowReprint,
  setShowReturnModal,
  setShowSearchModal,
  loadOrderInput,
  setLoadOrderInput,
  loadOrderForReturn,
  loadOrderLoading,
  loadedOrderForReturn,
  returnProcessMode,
  settings,
  t,
  orderDisplayId,
}) {
  const g = secondaryBtn(t)
  const pb = primaryBtn(t)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }} className="pos-left">
      {/* Redundant header removed - actions moved to Top Bar in POSTerminal */}

      {favProds.length > 0 && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>⭐ Quick Access Favorites</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {favProds.map(p => {
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', background: t.posLeft, borderBottom: `1px solid ${t.border}`, boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)' }} className="pos-search-strip">
      {loadedOrderForReturn ? (
        <div className="pos-grid-header" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.yellow, background: t.yellowBg, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.yellowBorder}` }}>
            {returnProcessMode === 'exchange' ? 'Exchange: add replacement items below' : `Return: ${loadedOrderForReturn.order_number || loadedOrderForReturn.id}`}
          </span>
        </div>
      ) : (
        <>
          {orderDisplayId != null && (
            <div className="pos-precision-order-row" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${t.border}`, background: t.bg2, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: t.text4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Register</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: t.blue, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sale</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: t.text, fontVariantNumeric: 'tabular-nums' }}>#{orderDisplayId}</span>
              <div style={{ flex: '1 1 160px', minWidth: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <input
                  value={loadOrderInput}
                  onChange={e => setLoadOrderInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadOrderForReturn()}
                  placeholder="Order #"
                  aria-label="Load order by number"
                  style={{ width: 120, background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 10px', color: t.text, fontSize: 13, outline: 'none' }}
                />
                <button type="button" onClick={() => loadOrderForReturn()} disabled={loadOrderLoading || !loadOrderInput?.trim()} style={{ ...g, opacity: loadOrderLoading || !loadOrderInput?.trim() ? 0.5 : 1, cursor: loadOrderLoading || !loadOrderInput?.trim() ? 'not-allowed' : 'pointer' }}>{loadOrderLoading ? '…' : 'Load'}</button>
                {setShowReturnModal ? <button type="button" onClick={() => setShowReturnModal(true)} style={g}>Return</button> : null}
                {setShowReprint ? <button type="button" onClick={() => setShowReprint(true)} style={g}>Reprint</button> : null}
                <button type="button" onClick={parkBill} style={g}>Park</button>
                {parked.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setShowParkedDropdown(v => !v)} style={g}>Recall ({parked.length})</button>
                    {showParkedDropdown && (
                      <div style={{ position: 'absolute', top: '110%', right: 0, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 8, zIndex: 100, minWidth: 220, boxShadow: t.shadowMd }}>
                        {parked.map(pb => <button key={pb.id} type="button" onClick={() => recallBill(pb)} style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', textAlign: 'left', fontSize: 14, borderRadius: 6 }}>{pb.id} — {pb.cart.length} items · {pb.ts}</button>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pos-grid-header pos-register-scan-zone" style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: `linear-gradient(180deg, ${t.bg3} 0%, ${t.posLeft} 100%)` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.text4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Step 1 · Scan or search</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text2 }}>Barcode scanner or keyboard — Enter adds item</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <SearchBar
                  ref={searchInputRef}
                  value={search}
                  onChange={setSearch}
                  onEnter={onSearchEnter}
                  onFocusSearch={() => searchInputRef?.current?.focus?.()}
                  t={t}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowBarcodeInput(true)} style={{ ...pb, minHeight: 48, minWidth: 96, fontSize: 14, borderRadius: 12 }}>Scan</button>
                <button type="button" onClick={() => setShowSearchModal?.(true)} style={{ ...pb, minHeight: 48, minWidth: 96, fontSize: 14, borderRadius: 12 }} title="Search (F4)">Search</button>
              </div>
            </div>

            {scanMsg ? (
              <div style={{ fontSize: 14, color: t.green, fontWeight: 700, padding: '10px 12px', borderRadius: 10, background: t.greenBg, border: `1px solid ${t.greenBorder}` }} role="status">{scanMsg}</div>
            ) : null}
          </div>
        </>
      )}


      {!loadedOrderForReturn && search.trim() && (
        <div className="pos-search-results" style={{ maxHeight: 280, overflowY: 'auto', borderTop: `1px solid ${t.border}`, background: t.bg2 }}>
          {filteredProds.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 14, color: t.text3 }}>No products match “{search.trim()}”</div>
          ) : (
            filteredProds.slice(0, 40).map(p => {
              const disc = getItemDiscount(p)
              const linePrice = disc > 0 ? p.price * (1 - disc / 100) : p.price
              return (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  disabled={p.stock === 0} 
                  className="scale-in"
                  style={{ 
                    flexShrink: 0, 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 16, 
                    padding: '12px 16px', 
                    cursor: p.stock === 0 ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    opacity: p.stock === 0 ? 0.4 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #f1f5f9' }}>
                    <ImgWithFallback src={p.image || p.image_url || PRODUCT_IMAGES[p.name]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 800, marginTop: 2 }}>
                      {disc > 0 ? (
                        <><s style={{ color: '#94a3b8', fontSize: 11, marginRight: 6 }}>{fmt(p.price, settings?.sym)}</s> {fmt(p.price * (1 - disc / 100), settings?.sym)}</>
                      ) : (
                        fmt(p.price, settings?.sym)
                      )}
                    </div>
                  </div>
                  {disc > 0 && <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '2px 8px', fontWeight: 900, marginLeft: 4 }}>-{disc}%</span>}
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: `1px solid ${t.border}`,
                    background: t.bg2,
                    cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: p.stock === 0 ? 0.45 : 1,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>SKU {p.sku || p.id} · Stk {p.stock}</div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: 16, fontWeight: 900, color: disc > 0 ? t.accent : t.green }}>
                    {disc > 0 ? <><span style={{ textDecoration: 'line-through', fontSize: 13, color: t.text4, marginRight: 6 }}>{fmt(p.price, settings?.sym)}</span>{fmt(linePrice, settings?.sym)}</> : fmt(p.price, settings?.sym)}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Note: Product Categories and Grid removed as per request to simplify UI and focus on header/favorites/scanning */}
    </div>
  )
}
