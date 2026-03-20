import { useState } from 'react'
import { Badge, Card, StatCard, Select } from '@/components/ui'
import { fmt } from '@/lib/utils'

export const AdminAnalytics = ({ orders, products, t, settings }) => {
  const [shopFilter, setShopFilter] = useState('all')
  const SHOPS_LIST = ['all', 'Main Stadium Store', 'East Wing Megastore', 'Airport Pop-up']
  const shopOrders = shopFilter === 'all'
    ? orders
    : orders.filter((_, i) => ['Main Stadium Store', 'East Wing Megastore', 'Airport Pop-up'].indexOf(shopFilter) === i % 3)

  const totalRev = (shopOrders || []).reduce((s, o) => s + (o.total || 0), 0)
  const byPayment = { Card: 0, Cash: 0, QR: 0, Online: 0 }
  ;(shopOrders || []).forEach(o => { if (o && o.payment) byPayment[o.payment] = (byPayment[o.payment] || 0) + (o.total || 0) })
  const byType = { 'in-store': 0, pickup: 0, delivery: 0 }
  ;(shopOrders || []).forEach(o => { if (o) byType[o.orderType || 'in-store'] = (byType[o.orderType || 'in-store'] || 0) + 1 })
  const topP = {}
  ;(shopOrders || []).forEach(o => (o?.items || []).forEach(i => { if (i?.name) topP[i.name] = (topP[i.name] || 0) + (i.qty || 0) }))
  const topProducts = Object.entries(topP).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const catRev = {}
  ;(shopOrders || []).forEach(o => (o?.items || []).forEach(i => {
    if (!i) return
    const p = (products || []).find(x => x.name === i.name)
    const cat = p?.category || 'Other'
    catRev[cat] = (catRev[cat] || 0) + (i.price || 0) * (i.qty || 0)
  }))
  const maxRev = Math.max(...Object.values(catRev), 1)
  const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0d9488']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>📈 Analytics Dashboard</div>
        <Select t={t} label="" value={shopFilter} onChange={setShopFilter} options={SHOPS_LIST.map(s => ({ value: s, label: s === 'all' ? '🌐 All Shops' : '🏪 ' + s }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14 }}>
        <StatCard t={t} title="Total Revenue" value={fmt(totalRev, settings?.sym)} color={t.accent} icon="💰" trend={12} />
        <StatCard t={t} title="Orders" value={shopOrders.length} color={t.blue} icon="🧾" trend={8} />
        <StatCard t={t} title="Avg Order" value={fmt(shopOrders.length ? totalRev / shopOrders.length : 0, settings?.sym)} color={t.green} icon="📊" />
        <StatCard t={t} title="Online Orders" value={shopOrders.filter(o => o.payment === 'Online').length} color={t.teal} icon="🌐" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 16 }}>📊 Revenue by Category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(catRev).sort((a, b) => b[1] - a[1]).map(([cat, rev], i) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: t.text2, fontWeight: 600 }}>{cat}</span>
                  <span style={{ fontWeight: 800, color: t.text }}>{fmt(rev, settings?.sym)}</span>
                </div>
                <div style={{ height: 8, background: t.bg4, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(rev / maxRev) * 100}%`, background: colors[i % colors.length], borderRadius: 4, transition: 'width .6s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 16 }}>🥧 Order Types</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {(() => {
                  const total2 = Object.values(byType).reduce((s, v) => s + v, 0) || 1
                  const typeColors = { 'in-store': '#dc2626', pickup: '#2563eb', delivery: '#0d9488' }
                  let offset = 0
                  return Object.entries(byType).filter(([, v]) => v > 0).map(([k, v]) => {
                    const pct = v / total2 * 100
                    const el = <circle key={k} cx="21" cy="21" r="15.9" fill="none" stroke={typeColors[k]} strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={100 - offset} />
                    offset += pct
                    return el
                  })
                })()}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: 9, color: t.text3, fontWeight: 700 }}>ORDERS</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: t.text }}>{shopOrders.length}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[['in-store', 'In-Store', '#dc2626'], ['pickup', 'Pickup', '#2563eb'], ['delivery', 'Delivery', '#0d9488']].map(([k, l, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: t.text2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{byType[k] || 0}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .7 }}>Payment Methods</div>
            {Object.entries(byPayment).filter(([, v]) => v > 0).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: t.text2 }}>{k}</span>
                <span style={{ fontWeight: 800, color: t.accent }}>{fmt(v, settings?.sym)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 16 }}>🏆 Top Products</div>
          {topProducts.map(([name, qty], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#fef9c3' : i === 1 ? '#f1f5f9' : t.bg3, border: `2px solid ${i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: i === 0 ? '#d97706' : t.text3, flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{name}</div>
                <div style={{ height: 4, background: t.bg4, borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${(qty / topProducts[0][1]) * 100}%`, background: colors[i % colors.length], borderRadius: 2 }} />
                </div>
              </div>
              <Badge t={t} text={qty + ' sold'} color="blue" />
            </div>
          ))}
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 16 }}>📅 Weekly Revenue</div>
          {(() => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            const vals = [1240, 985, 1560, 820, 1890, 2340, 1650].map(v => v * (shopFilter === 'all' ? 1 : 0.33))
            const maxV = Math.max(...vals)
            return (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {days.map((d, i) => (
                  <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: '100%', background: t.accent, borderRadius: '4px 4px 0 0', height: `${(vals[i] / maxV) * 100}px`, minHeight: 4, transition: 'height .5s', opacity: .85 }} />
                    <div style={{ fontSize: 9, color: t.text4, fontWeight: 700 }}>{d}</div>
                  </div>
                ))}
              </div>
            )
          })()}
          <div style={{ fontSize: 11, color: t.text4, marginTop: 8, textAlign: 'right' }}>Simulated mock data</div>
        </Card>
      </div>
    </div>
  )
}
