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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }} className="pos-left">
      {/* Redundant header removed - actions moved to Top Bar in POSTerminal */}

      {favProds.length > 0 && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>⭐ Quick Access Favorites</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {favProds.map(p => {
              const disc = getItemDiscount(p)
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
