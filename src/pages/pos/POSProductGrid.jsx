import { fmt } from '@/lib/utils'

const btnGhost = (t) => ({
  padding: '9px 13px',
  background: t.bg3,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  color: t.text2,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

/** Top search + actions only (no product cards). Search matches show as a compact text list. */
export function POSProductGrid({
  search, setSearch, filteredProds,
  getItemDiscount, addToCart, scanMsg,
  parkBill, parked, recallBill, showParkedDropdown, setShowParkedDropdown,
  setShowBarcodeInput, setShowReprint, setShowReturnModal,
  loadOrderInput, setLoadOrderInput, loadOrderForReturn, loadOrderLoading, loadedOrderForReturn,
  returnProcessMode,
  settings, t,
  /** Shown as ORDER # … when set (register precision layout) */
  orderDisplayId,
}) {
  const pickFirstMatch = () => {
    if (filteredProds.length > 0) addToCart(filteredProds[0])
  }

  const g = btnGhost(t)
  const parkStyle = { ...g, background: `${t.accent}14`, borderColor: t.accent, color: t.accent }

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', background: t.posLeft, borderBottom: `1px solid ${t.border}` }} className="pos-search-strip">
      {loadedOrderForReturn ? (
        <div className="pos-grid-header" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.yellow, background: t.yellowBg, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.yellowBorder}` }}>
            {returnProcessMode === 'exchange' ? 'Exchange: add replacement items below' : `Return: ${loadedOrderForReturn.order_number || loadedOrderForReturn.id}`}
          </span>
        </div>
      ) : (
        <>
          {orderDisplayId != null && (
            <div className="pos-precision-order-row" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: t.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Order</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: t.text }}>#{orderDisplayId}</span>
              <input value={loadOrderInput} onChange={e => setLoadOrderInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadOrderForReturn()} placeholder="Order #" style={{ width: 100, background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 10px', color: t.text, fontSize: 13, outline: 'none' }} />
              <button type="button" onClick={() => loadOrderForReturn()} disabled={loadOrderLoading || !loadOrderInput?.trim()} style={{ ...g, opacity: loadOrderLoading || !loadOrderInput?.trim() ? 0.5 : 1, cursor: loadOrderLoading || !loadOrderInput?.trim() ? 'not-allowed' : 'pointer' }}>{loadOrderLoading ? '…' : 'Load'}</button>
              <button type="button" onClick={() => setShowBarcodeInput(true)} style={g}>Scan</button>
              {setShowReturnModal ? <button type="button" onClick={() => setShowReturnModal(true)} style={g}>Return</button> : null}
              {setShowReprint ? <button type="button" onClick={() => setShowReprint(true)} style={g}>Reprint</button> : null}
              <button type="button" onClick={parkBill} style={parkStyle}>Park</button>
              {parked.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowParkedDropdown(v => !v)} style={{ ...g, background: t.purpleBg, borderColor: t.purpleBorder, color: t.purple }}>Recall ({parked.length})</button>
                  {showParkedDropdown && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 8, zIndex: 100, minWidth: 200, boxShadow: t.shadowMd }}>
                      {parked.map(pb => <button key={pb.id} type="button" onClick={() => recallBill(pb)} style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', textAlign: 'left', fontSize: 14, borderRadius: 6 }}>{pb.id} — {pb.cart.length} items · {pb.ts}</button>)}
                    </div>
                  )}
                </div>
              )}
              {scanMsg ? <span style={{ fontSize: 14, color: t.green, fontWeight: 700, marginLeft: 'auto' }}>{scanMsg}</span> : null}
            </div>
          )}
          <div className="pos-grid-header" style={{ padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    pickFirstMatch()
                  }
                }}
                placeholder="Search / SKU…"
                style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '11px 14px 11px 38px', color: t.text, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.7, fontSize: 16 }} aria-hidden>🔍</span>
            </div>
            {orderDisplayId == null && (
              <>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input value={loadOrderInput} onChange={e => setLoadOrderInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadOrderForReturn()} placeholder="Order #" style={{ width: 96, background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '9px 11px', color: t.text, fontSize: 14, outline: 'none' }} />
                  <button type="button" onClick={() => loadOrderForReturn()} disabled={loadOrderLoading || !loadOrderInput?.trim()} style={{ padding: '9px 14px', background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 9, color: t.yellow, fontSize: 14, fontWeight: 800, cursor: loadOrderLoading || !loadOrderInput?.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>{loadOrderLoading ? '...' : 'Load'}</button>
                </div>
                <button type="button" onClick={() => setShowBarcodeInput(true)} style={{ padding: '9px 14px', background: t.blueBg, border: `1px solid ${t.blueBorder}`, borderRadius: 9, color: t.blue, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Scan</button>
                {setShowReturnModal ? <button type="button" onClick={() => setShowReturnModal(true)} style={{ padding: '9px 14px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, color: t.text2, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Return</button> : null}
                {setShowReprint ? <button type="button" onClick={() => setShowReprint(true)} style={{ padding: '9px 14px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, color: t.text2, fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reprint</button> : null}
                {scanMsg ? <span style={{ fontSize: 14, color: t.green, fontWeight: 700 }}>{scanMsg}</span> : null}
                <button type="button" onClick={parkBill} style={{ padding: '9px 14px', background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 9, color: t.yellow, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Park</button>
                {parked.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setShowParkedDropdown(v => !v)} style={{ padding: '9px 14px', background: t.purpleBg, border: `1px solid ${t.purpleBorder}`, borderRadius: 9, color: t.purple, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Recall ({parked.length})</button>
                    {showParkedDropdown && (
                      <div style={{ position: 'absolute', top: '110%', left: 0, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 8, zIndex: 100, minWidth: 200, boxShadow: t.shadowMd }}>
                        {parked.map(pb => <button key={pb.id} type="button" onClick={() => recallBill(pb)} style={{ display: 'block', width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', textAlign: 'left', fontSize: 14, borderRadius: 6 }}>{pb.id} — {pb.cart.length} items · {pb.ts}</button>)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: `1px solid ${t.border}`,
                    background: t.bg2, cursor: p.stock === 0 ? 'not-allowed' : 'pointer', opacity: p.stock === 0 ? 0.45 : 1,
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
    </div>
  )
}
