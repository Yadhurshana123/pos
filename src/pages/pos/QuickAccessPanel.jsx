import { useCallback, useEffect, useMemo, useState } from 'react'
import { fmt } from '@/lib/utils'

const LS_FAV = 'pos_favorite_product_ids'
const LS_RECENT = 'pos_recent_product_ids'

function readIds(key) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter(Boolean) : []
  } catch {
    return []
  }
}

export function QuickAccessPanel({
  products,
  popularProducts,
  onQuickAdd,
  settings,
  t,
}) {
  const [tab, setTab] = useState('popular')
  const [favIds, setFavIds] = useState(() => readIds(LS_FAV))
  const [recentIds, setRecentIds] = useState(() => readIds(LS_RECENT))

  useEffect(() => {
    const refresh = () => {
      setFavIds(readIds(LS_FAV))
      setRecentIds(readIds(LS_RECENT))
    }
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('pos-recent-update', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pos-recent-update', refresh)
    }
  }, [])

  const byId = useMemo(() => {
    const m = {}
    ;(products || []).forEach((p) => { m[p.id] = p })
    return m
  }, [products])

  const resolveList = useCallback((ids) => {
    const out = []
    const seen = new Set()
    for (const id of ids) {
      const p = byId[id]
      if (p && !seen.has(p.id) && (p.stock ?? 0) > 0) {
        seen.add(p.id)
        out.push(p)
      }
      if (out.length >= 12) break
    }
    return out
  }, [byId])

  const list = useMemo(() => {
    if (tab === 'popular') return (popularProducts || []).filter((p) => (p.stock ?? 0) > 0).slice(0, 12)
    if (tab === 'recent') return resolveList(recentIds)
    return resolveList(favIds)
  }, [tab, popularProducts, recentIds, favIds, resolveList])

  const toggleFavorite = useCallback((e, productId) => {
    e.stopPropagation()
    setFavIds((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev].slice(0, 40)
      try { localStorage.setItem(LS_FAV, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const tabs = [
    { id: 'popular', label: 'Popular' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' },
  ]

  return (
    <div className="pos-quick-access-root" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: t.text2, letterSpacing: '0.06em', marginBottom: 4 }}>Quick add</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.text4, marginBottom: 12, lineHeight: 1.35 }}>Fast keys for repeat items — large tap targets</div>
      <div
        role="tablist"
        aria-label="Quick product groups"
        style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            style={{
              padding: '10px 16px',
              minHeight: 44,
              borderRadius: 10,
              border: `2px solid ${tab === id ? t.blue : t.border}`,
              background: tab === id ? `${t.blue}18` : t.bg3,
              color: tab === id ? t.blue : t.text3,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {list.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: t.text4, fontSize: 13 }}>
            {tab === 'favorites' ? 'Tap ★ on an item when we show it here to save favorites.' : tab === 'recent' ? 'Recent items appear as you sell.' : 'No popular picks yet.'}
          </div>
        ) : (
          list.map((p) => {
            const disabled = (p.stock ?? 0) === 0
            const isFav = favIds.includes(p.id)
            return (
              <div key={p.id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onQuickAdd?.(p)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 36px 14px 14px',
                    minHeight: 88,
                    borderRadius: 12,
                    border: `1px solid ${t.border}`,
                    background: t.card,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.text, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: t.blue }}>{fmt(p.price, settings?.sym)}</span>
                </button>
                <button
                  type="button"
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(e) => toggleFavorite(e, p.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.bg2,
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  {isFav ? '★' : '☆'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
