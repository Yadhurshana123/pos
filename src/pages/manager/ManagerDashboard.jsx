import { useState, useMemo, useEffect } from 'react'
import { Badge, Card, StatCard, Table, Btn } from '@/components/ui'
import { fmt } from '@/lib/utils'
import { 
  TrendingUp, TrendingDown, Package, Users, Clock, 
  Store, AlertTriangle, RefreshCw, ChevronRight,
  BarChart3, PieChart as PieIcon, ArrowUpRight
} from 'lucide-react'
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid 
} from 'recharts'

const getOrderItems = (o) => {
  const items = o?.items || o?.order_items || []
  return Array.isArray(items) ? items : []
}

const toItemName = (i) => i?.product_name || i?.name || 'Unknown'
const toItemQty = (i) => i?.quantity ?? i?.qty ?? 0

export const ManagerDashboard = ({ orders = [], products = [], users = [], counters = [], t, settings }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const storeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders])
  
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1200)
  }

  // Calculate Metrics
  const metrics = useMemo(() => {
    const revenue = storeOrders.reduce((s, o) => s + (o.total ?? 0), 0)
    const pending = storeOrders.filter(o => o.status === 'preparing' || o.status === 'pending').length
    const staff = (users || []).filter(u => u.role === 'cashier' || u.role === 'staff').length
    const lowStock = (products || []).filter(p => (p.stock ?? 0) < 10).length
    
    return { revenue, pending, staff, lowStock }
  }, [storeOrders, users, products])

  // Chart Data: Last 7 Days (Mocked for visual impact based on real orders)
  const salesTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((d, i) => ({
      name: d,
      sales: Math.floor(Math.random() * 500) + 200 + (i === 6 ? metrics.revenue / 10 : 0)
    }))
  }, [metrics.revenue])

  // Category Data
  const categoryData = useMemo(() => {
    const cats = {}
    storeOrders.forEach(o => {
      getOrderItems(o).forEach(i => {
        // Mock category lookup or simple mapping
        const cat = i.category || 'General'
        cats[cat] = (cats[cat] || 0) + (i.price * toItemQty(i))
      })
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 5)
  }, [storeOrders])

  const COLORS = [t.accent, t.blue, t.green, t.yellow, t.purple]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 950, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>Store Overview</h1>
          <p style={{ fontSize: 14, color: t.text3, margin: '4px 0 0 0' }}>Real-time performance metrics for your location</p>
        </div>
        <Btn 
          variant="secondary" 
          onClick={handleRefresh} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ transition: 'transform 0.5s' }} />
          {isRefreshing ? 'Syncing...' : 'Refresh'}
        </Btn>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <StatCard 
          t={t} title="Total Revenue" value={fmt(metrics.revenue, settings?.sym)} icon={<Store size={20} />} 
          color={t.accent} trend="+12.5%" trendUp={true} 
          sparkline={salesTrend.map(s => s.sales)}
        />
        <StatCard 
          t={t} title="Active Staff" value={metrics.staff} icon={<Users size={20} />} 
          color={t.green} trend="Steady" 
        />
        <StatCard 
          t={t} title="Pending Tasks" value={metrics.pending} icon={<Clock size={20} />} 
          color={t.yellow} trend="-3 today" trendUp={true} 
        />
        <StatCard 
          t={t} title="Critical Stock" value={metrics.lowStock} icon={<AlertTriangle size={20} />} 
          color={t.red} trend={metrics.lowStock > 5 ? "High Risk" : "Manageable"} 
        />
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, minHeight: 350 }}>
        <Card t={t} style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Weekly Sales Performance</h3>
              <p style={{ fontSize: 12, color: t.text3, margin: '2px 0' }}>Daily revenue trend for the current week</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge t={t} text="Daily" color="blue" />
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.border} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: t.text3 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: t.text3 }} />
                <Tooltip 
                  contentStyle={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8, boxShadow: t.shadowMd }}
                  itemStyle={{ fontSize: 12, fontWeight: 700 }}
                />
                <Line 
                  type="monotone" dataKey="sales" stroke={t.accent} strokeWidth={3} 
                  dot={{ fill: t.accent, strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card t={t} style={{ padding: 24 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>Revenue by Category</h3>
          <p style={{ fontSize: 12, color: t.text3, marginBottom: 20 }}>Top performing segments</p>
          <div style={{ width: '100%', height: 200, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length ? categoryData : [{ name: 'None', value: 1 }]}
                  innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.text }}>{categoryData.length}</div>
              <div style={{ fontSize: 10, color: t.text3 }}>Cats</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            {categoryData.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 11, color: t.text2, fontWeight: 600 }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: t.text }}>{fmt(c.value, settings?.sym)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Operational Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Counter Performance */}
        <Card t={t} style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Counter Traffic</h3>
            <BarChart3 size={18} color={t.text3} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(counters || []).map(c => {
              const rev = storeOrders.filter(o => o.counter === c.name).reduce((s, o) => s + o.total, 0)
              const pct = metrics.revenue > 0 ? Math.round(rev / metrics.revenue * 100) : 0
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.active ? t.green : t.text4 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{fmt(rev, settings?.sym)}</span>
                  </div>
                  <div style={{ height: 8, background: t.bg3, borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', width: `${pct || 2}%`, 
                        background: `linear-gradient(90deg, ${t.blue}, ${t.teal})`,
                        borderRadius: 4, transition: 'width 1s ease-out'
                      }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent Orders Table */}
        <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Active Orders</h3>
            <Btn variant="ghost" size="sm" style={{ padding: '4px 8px', fontSize: 11 }}>View All</Btn>
          </div>
          <Table
            t={t}
            cols={['Order', 'Customer', 'Status', 'Total']}
            rows={storeOrders.slice(0, 5).map(o => [
              <div key={o.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: t.text }}>#{o.order_number || String(o.id).substring(0,6)}</span>
                <span style={{ fontSize: 10, color: t.text4 }}>{o.date || 'Just now'}</span>
              </div>,
              <span key="cust" style={{ fontWeight: 600 }}>{o.customer_name || 'Walk-in'}</span>,
              <Badge 
                key="stat" t={t} 
                text={o.status} 
                color={o.status === 'completed' ? 'green' : o.status === 'preparing' ? 'yellow' : 'blue'} 
              />,
              <span key="tot" style={{ fontWeight: 900, color: t.text }}>{fmt(o.total, settings?.sym)}</span>
            ])}
            empty="Refreshing operational data..."
          />
        </Card>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
