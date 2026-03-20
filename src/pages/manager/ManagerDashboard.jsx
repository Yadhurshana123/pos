import { Badge, Card, StatCard, Table } from '@/components/ui'
import { fmt } from '@/lib/utils'

function getOrderItems(o) {
  const items = o?.items || o?.order_items || []
  return Array.isArray(items) ? items : []
}

function toItemName(i) {
  return i?.product_name || i?.name || 'Unknown'
}

function toItemQty(i) {
  return i?.quantity ?? i?.qty ?? 0
}

export const ManagerDashboard = ({ orders = [], products = [], users = [], counters = [], t, settings }) => {
  const storeOrders = Array.isArray(orders) ? orders : []
  const todayRevenue = storeOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const pendingOrders = storeOrders.filter(o => o.status === 'preparing').length
  const staffCount = (users || []).filter(u => u.role === 'cashier').length
  const lowStock = (products || []).filter(p => (p.stock ?? 0) < 10).length

  const topP = {}
  storeOrders.forEach(o => {
    getOrderItems(o).forEach(i => {
      const name = toItemName(i)
      topP[name] = (topP[name] || 0) + toItemQty(i)
    })
  })
  const topProducts = Object.entries(topP).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Store Dashboard</div>
        <div style={{ fontSize: 13, color: t.text3, marginTop: 3 }}>Your store overview & active operations</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14 }}>
        <StatCard t={t} title="Total Revenue" value={fmt(todayRevenue, settings?.sym)} color={t.accent} icon="💰" trend={8} />
        <StatCard t={t} title="Total Orders" value={storeOrders.length} color={t.blue} icon="🧾" trend={5} />
        <StatCard t={t} title="Pending Orders" value={pendingOrders} color={t.yellow} icon="⏳" />
        <StatCard t={t} title="Staff Active" value={staffCount} color={t.green} icon="👥" />
        <StatCard t={t} title="Low Stock Items" value={lowStock} color={t.red} icon="⚠️" />
        <StatCard t={t} title="Active Counters" value={(counters || []).filter(c => c.active).length} color={t.teal} icon="🏪" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🏆 Top Selling Products</div>
          {topProducts.length === 0
            ? <div style={{ color: t.text3, fontSize: 13 }}>No sales data yet</div>
            : topProducts.map(([name, qty], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                <span style={{ color: t.text }}>#{i + 1} {name}</span>
                <Badge t={t} text={qty + ' sold'} color="blue" />
              </div>
            ))}
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🏪 Counter Performance</div>
          {(counters || []).map(c => {
            const rev = storeOrders.filter(o => o.counter === c.name).reduce((s, o) => s + o.total, 0)
            const cnt = storeOrders.filter(o => o.counter === c.name).length
            const pct = todayRevenue > 0 ? Math.round(rev / todayRevenue * 100) : 0
            return (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: t.text2, fontWeight: 600 }}>
                    {c.name} <span style={{ fontSize: 10, color: c.active ? t.green : t.text4 }}>({c.active ? 'active' : 'inactive'})</span>
                  </span>
                  <span style={{ fontWeight: 800, color: t.text }}>{fmt(rev, settings?.sym)}</span>
                </div>
                <div style={{ height: 6, background: t.bg4, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: t.accent, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: t.text4, marginTop: 2 }}>{cnt} orders · {pct}% of revenue</div>
              </div>
            )
          })}
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>⚠️ Stock Alerts</div>
          {(products || []).filter(p => (p.stock ?? 0) < 15).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 13, color: t.text }}>{p.emoji} {p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: p.stock < 5 ? t.red : p.stock < 10 ? t.yellow : t.text3 }}>{p.stock} left</span>
            </div>
          ))}
          {(products || []).filter(p => (p.stock ?? 0) < 15).length === 0 && (
            <div style={{ color: t.green, fontSize: 13 }}>✅ All stock levels healthy</div>
          )}
        </Card>

        <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 14, fontWeight: 800, color: t.text }}>📋 Recent Orders</div>
          <Table
            t={t}
            cols={['ID', 'Customer', 'Type', 'Total', 'Status']}
            rows={storeOrders.slice(0, 6).map(o => [
              <span key={o.id} style={{ fontSize: 11, fontFamily: 'monospace' }}>{o.order_number || o.id}</span>,
              o.customer_name || o.customerName || 'Walk-in',
              <Badge t={t} key="type" text={o.order_type || o.orderType || 'in-store'} color={(o.order_type || o.orderType) === 'delivery' ? 'teal' : (o.order_type || o.orderType) === 'pickup' ? 'blue' : 'green'} />,
              fmt(o.total, settings?.sym),
              <Badge t={t} key="status" text={o.status} color={o.status === 'completed' ? 'green' : o.status === 'preparing' ? 'yellow' : 'red'} />,
            ])}
            empty="No orders yet"
          />
        </Card>
      </div>
    </div>
  )
}
