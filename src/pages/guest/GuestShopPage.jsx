import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/context/ThemeContext'
import { fmt } from '@/lib/utils'
import { PRODUCT_IMAGES, CATEGORIES as INITIAL_CATEGORIES } from '@/lib/seed-data'
import { ImgWithFallback } from '@/components/shared'
import { fetchCategories, fetchSubCategories } from '@/services/categories'

export function GuestShopPage({ products = [], banners = [], settings = {} }) {
  const { t } = useTheme()
  const navigate = useNavigate()
  
  const [activeCategoryId, setActiveCategoryId] = useState('All')
  const [activeSubCategoryId, setActiveSubCategoryId] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: dbCategoriesData = [] } = useQuery({
    queryKey: ['guest-categories'],
    queryFn: fetchCategories
  })

  // We fetch all subcategories at once to avoid waterfall
  const { data: dbSubCategoriesData = [] } = useQuery({
    queryKey: ['guest-sub-categories'],
    queryFn: () => fetchSubCategories()
  })

  // Fallback to initial categories if supabase is not connected or returns null
  const dbCategories = dbCategoriesData || INITIAL_CATEGORIES.filter(c => c !== 'All').map((c, i) => ({ id: `seed-${i}`, name: c }))
  const dbSubCategories = dbSubCategoriesData || []

  const validSubCategories = activeCategoryId === 'All' 
    ? [] 
    : dbSubCategories.filter(s => s.category_id === activeCategoryId)

  const handleCategoryClick = (catId) => {
    setActiveCategoryId(catId)
    setActiveSubCategoryId('All')
  }

  const allActiveOffers = banners.filter(b => b.active && b.offerType === 'category')
  const getGuestDisc = (p) => {
    const o = allActiveOffers.find(b => b.offerTarget === p.category)
    return Math.max(o ? o.offerDiscount : 0, p.discount || 0)
  }
  
  const filtered = products.filter(p => {
    let matchesCategory = true;
    if (activeCategoryId !== 'All') {
      // Handle both seed data (no id) and DB data
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

    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubCategory && matchesSearch;
  })

  const goToProductDetail = (p) => {
    navigate(`/product/${p.id}`, { state: { product: p } })
  }

  const addToCart = (p) => {
    if (p.stock === 0) return
    if (p.sizes?.length > 1) {
      goToProductDetail(p)
    } else {
      // Parent/layout can provide onAddToCart; for now just go to detail
      goToProductDetail(p)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: t.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>← Back to Home</button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: t.text, letterSpacing: -0.5 }}>Shop Our Collection</div>
              <div style={{ fontSize: 13, color: t.text3, marginTop: 5 }}>Official merchandise for every fan</div>
            </div>

            <div style={{ position: 'relative', maxWidth: 400 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: 14, outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
            </div>
          </div>
        </div>
        
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', marginBottom: validSubCategories.length > 0 ? 12 : 28 }}>
          <button 
            onClick={() => handleCategoryClick('All')} 
            style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${activeCategoryId === 'All' ? t.accent : t.border}`, background: activeCategoryId === 'All' ? t.accent : 'transparent', color: activeCategoryId === 'All' ? '#fff' : t.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
          >
            All
          </button>
          {dbCategories.map(c => (
            <button 
              key={c.id} 
              onClick={() => handleCategoryClick(c.id)} 
              style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${activeCategoryId === c.id ? t.accent : t.border}`, background: activeCategoryId === c.id ? t.accent : 'transparent', color: activeCategoryId === c.id ? '#fff' : t.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* SubCategory tabs */}
        {validSubCategories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', marginBottom: 28 }}>
            <button 
              onClick={() => setActiveSubCategoryId('All')} 
              style={{ padding: '6px 14px', borderRadius: 16, border: `1px solid ${activeSubCategoryId === 'All' ? t.accent : t.border}`, background: activeSubCategoryId === 'All' ? t.accent + '20' : 'transparent', color: activeSubCategoryId === 'All' ? t.accent : t.text3, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
            >
              All
            </button>
            {validSubCategories.map(s => (
              <button 
                key={s.id} 
                onClick={() => setActiveSubCategoryId(s.id)} 
                style={{ padding: '6px 14px', borderRadius: 16, border: `1px solid ${activeSubCategoryId === s.id ? t.accent : t.border}`, background: activeSubCategoryId === s.id ? t.accent + '20' : 'transparent', color: activeSubCategoryId === s.id ? t.accent : t.text3, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(210px,45vw),1fr))', gap: 'clamp(12px,2vw,20px)' }}>
          {filtered.map(p => {
            const disc = getGuestDisc(p)
            return (
              <div key={p.id} style={{ background: t.card, border: `1px solid ${disc > 0 ? t.accent : t.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: t.shadow, transition: 'transform .15s,box-shadow .15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = t.shadowMd }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = t.shadow }}>
                <div style={{ position: 'relative', height: 180, background: t.bg3, overflow: 'hidden', cursor: 'pointer' }} onClick={() => goToProductDetail(p)}>
                  <ImgWithFallback src={p.image_url || p.image || PRODUCT_IMAGES[p.name]} alt={p.name} emoji={p.emoji} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {disc > 0 && <div style={{ position: 'absolute', top: 10, left: 10, background: t.accent, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 900 }}>-{disc}% OFF</div>}
                  {p.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>OUT OF STOCK</div>}
                  {p.stock > 0 && p.stock <= 5 && <div style={{ position: 'absolute', top: 10, right: 10, background: t.yellow, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>Only {p.stock} left!</div>}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>👁 View Details</div>
                </div>
                <div style={{ padding: '14px 15px' }}>
                  <div style={{ fontSize: 10, color: t.text3, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.category}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 10, lineHeight: 1.3, cursor: 'pointer' }} onClick={() => goToProductDetail(p)}>{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {disc > 0 ? <><div style={{ fontSize: 11, color: t.text4, textDecoration: 'line-through' }}>{fmt(p.price, settings?.sym)}</div><div style={{ fontSize: 17, fontWeight: 900, color: t.accent }}>{fmt(p.price * (1 - disc / 100), settings?.sym)}</div></> : <div style={{ fontSize: 17, fontWeight: 900, color: t.green }}>{fmt(p.price, settings?.sym)}</div>}
                    </div>
                    <button onClick={() => addToCart(p)} disabled={p.stock === 0} style={{ background: p.stock === 0 ? t.bg4 : t.accent, color: p.stock === 0 ? t.text3 : '#fff', border: 'none', borderRadius: 9, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: p.stock === 0 ? 'not-allowed' : 'pointer', boxShadow: p.stock === 0 ? 'none' : `0 2px 8px ${t.accent}40` }}>Add</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '80px 20px', color: t.text3 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div><div style={{ fontSize: 18, fontWeight: 700 }}>No products found</div></div>}
      </div>
    </div>
  )
}
