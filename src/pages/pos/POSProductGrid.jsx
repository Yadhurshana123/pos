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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.posLeft }} className="pos-left">
      {/* Redundant header removed - actions moved to Top Bar in POSTerminal */}

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

      {/* Note: Product Categories and Grid removed as per request to simplify UI and focus on header/favorites/scanning */}
    </div>
  )
}
