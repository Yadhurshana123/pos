import { useState } from 'react'
import { Btn, Badge, Card, StatCard, Table } from '@/components/ui'
import { fmt } from '@/lib/utils'

const SHOPS = [
  { id: 's1', name: 'Main Stadium Store', location: 'Stadium Entrance, Gate A' },
  { id: 's2', name: 'East Wing Megastore', location: 'East Stand, Level 2' },
  { id: 's3', name: 'Airport Pop-up', location: 'Terminal 2, Departures' },
]

export const AdminDashboard = ({ orders, users, products, t, settings }) => {
  const [activeShop, setActiveShop] = useState('all')

  const total = (orders || []).reduce((s, o) => s + (o.total || 0), 0)
  const topP = {}
  ;(orders || []).forEach(o => (o.items || []).forEach(i => { topP[i.name] = (topP[i.name] || 0) + i.qty }))
  const top = Object.entries(topP).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const shopOrders = SHOPS.map((_, si) => (orders || []).filter((__, idx) => idx % 3 === si))
  const activeShopOrders = activeShop === 'all'
    ? (orders || [])
    : shopOrders[SHOPS.findIndex(s => s.id === activeShop)] || []
  const shopTotal = activeShopOrders.reduce((s, o) => s + (o.total || 0), 0)

  const lowStock = (products || []).filter(p => p.stock < 10 && p.stock > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: t.text3 }}>Global system overview</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveShop('all')}
          style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${activeShop === 'all' ? t.accent : t.border}`, background: activeShop === 'all' ? t.accent + '15' : t.bg3, color: activeShop === 'all' ? t.accent : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          🌐 All Shops
        </button>
        {SHOPS.map(shop => (
          <button
            key={shop.id}
            onClick={() => setActiveShop(shop.id)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${activeShop === shop.id ? t.accent : t.border}`, background: activeShop === shop.id ? t.accent + '15' : t.bg3, color: activeShop === shop.id ? t.accent : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            🏪 {shop.name}
          </button>
        ))}
      </div>

      {activeShop !== 'all' && (
        <div style={{ background: t.blueBg, border: `1px solid ${t.blueBorder}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: t.blue }}>
          📍 {SHOPS.find(s => s.id === activeShop)?.location}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(180px,45vw),1fr))', gap: 14 }}>
        <StatCard t={t} title="Revenue" value={fmt(shopTotal, settings?.sym)} color={t.accent} icon="💰" trend={activeShop === 'all' ? 12 : undefined} />
        <StatCard t={t} title="Orders" value={activeShopOrders.length} color={t.blue} icon="🧾" trend={activeShop === 'all' ? 8 : undefined} />
        <StatCard t={t} title="Users" value={(users || []).length} color={t.green} icon="👥" />
        <StatCard t={t} title="Products" value={(products || []).length} color={t.yellow} icon="📦" />
      </div>

      {activeShop === 'all' && (
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🏪 Revenue by Shop</div>
          {SHOPS.map((shop, si) => {
            const shopRev = shopOrders[si].reduce((s, o) => s + o.total, 0)
            const pct = total > 0 ? Math.round(shopRev / total * 100) : 0
            return (
              <div key={shop.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <div>
                    <span style={{ color: t.text, fontWeight: 700 }}>{shop.name}</span>
                    <span style={{ fontSize: 11, color: t.text3, marginLeft: 8 }}>{shop.location}</span>
                  </div>
                  <div className="flex-wrap-mob" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: t.text3, fontSize: 12 }}>{shopOrders[si].length} orders</span>
                    <span style={{ fontWeight: 800, color: t.accent }}>{fmt(shopRev, settings?.sym)}</span>
                    <span style={{ fontSize: 11, color: t.text3 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 7, background: t.bg4, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: [t.accent, t.blue, t.teal][si], borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            )
          })}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="grid-2">
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🏆 Top Sellers</div>
          {top.map(([n, q], i) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
              <span style={{ color: t.text }}>#{i + 1} {n}</span>
              <Badge t={t} text={`${q} sold`} color="blue" />
            </div>
          ))}
          {top.length === 0 && <div style={{ color: t.text3, fontSize: 13 }}>No sales data yet</div>}
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🏪 Counter Revenue</div>
          {['Counter 1', 'Counter 2', 'Counter 3'].map(c => {
            const r = activeShopOrders.filter(o => o.counter === c).reduce((s, o) => s + o.total, 0)
            const p = shopTotal ? Math.round(r / shopTotal * 100) : 0
            return (
              <div key={c} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: t.text2 }}>{c}</span>
                  <span style={{ fontWeight: 800, color: t.text }}>{fmt(r, settings?.sym)}</span>
                </div>
                <div style={{ height: 6, background: t.bg4, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${p}%`, background: t.accent, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>⚠️ Stock Alerts</div>
          {lowStock.slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 13, color: t.text }}>{p.emoji} {p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: p.stock < 5 ? t.red : t.yellow }}>{p.stock} left</span>
            </div>
          ))}
        </Card>
      )}

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, fontSize: 14, fontWeight: 800, color: t.text }}>Recent Orders</div>
        <Table
          t={t}
          cols={['Order', 'Customer', 'Cashier', 'Total', 'Payment', 'Status']}
          rows={activeShopOrders.slice(0, 8).map(o => [
            o.id,
            o.customerName || 'Walk-in',
            o.cashierName || 'System',
            fmt(o.total || 0, settings?.sym),
            o.payment || '-',
            <Badge t={t} text={o.status || 'pending'} color={o.status === 'completed' ? 'green' : 'red'} />,
          ])}
        />
      </Card>
    </div>
  )
}
