import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Badge, Card, StatCard, Select } from '@/components/ui'
import { fmt } from '@/lib/utils'
import dayjs from 'dayjs'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export const ReturnManagement = ({
  orders,
  returns,
  setReturns,
  products,
  setProducts,
  settings,
  setOrders,
  addAudit,
  currentUser,
  t: tProp,
  siteId,
}) => {
  const { t: tCtx } = useTheme()
  const t = tProp || tCtx

  const [statusFilter, setStatusFilter] = useState('all')

  const returnDays = settings?.returnDays ?? 30
  const allowReturns = settings?.allowReturns !== false

  const filteredReturns = statusFilter === 'all'
    ? returns
    : returns.filter(r => r.status === statusFilter)

  const isWithinReturnWindow = (orderDate) => {
    if (!orderDate) return true
    const days = dayjs().diff(dayjs(orderDate, ['DD/MM/YYYY, HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD']), 'day')
    return days <= returnDays
  }

  const getOrderForReturn = (r) => orders.find(o => o.id === (r.order_id || r.orderId))

  const getReturnItems = (r) => {
    if (r.return_items && Array.isArray(r.return_items)) {
      return r.return_items.map(ri => ({
        productId: ri.product_id,
        name: products.find(p => p.id === ri.product_id)?.name || 'Item',
        qty: ri.quantity || 1,
        price: (ri.refund_amount || 0) / (ri.quantity || 1),
      }))
    }
    if (r.items && Array.isArray(r.items)) return r.items
    if (r.productId && r.productName && r.qty) {
      return [{ productId: r.productId, name: r.productName, qty: r.qty, price: r.refundAmount / r.qty }]
    }
    return []
  }

  const isProductReturnable = (productId) => {
    const p = products.find(pr => pr.id === productId)
    return p == null || p.returnable !== false
  }

  const pendingCount = returns.filter(r => r.status === 'pending').length
  const completedCount = returns.filter(r => r.status === 'completed').length
  const totalRefunded = returns.filter(r => ['approved', 'completed'].includes(r.status)).reduce((s, r) => s + (r.refund_amount || r.refundAmount || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Returns & Refunds</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(180px,45vw),1fr))', gap: 14 }}>
        <StatCard t={t} title="Completed" value={completedCount} color={t.green} icon="✅" />
        <StatCard t={t} title="Pending" value={pendingCount} color={t.yellow} icon="⏳" />
        <StatCard t={t} title="Total Refunded" value={fmt(totalRefunded, settings?.sym)} color={t.accent} icon="💸" />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <Select t={t} label="Filter by status" value={statusFilter} onChange={setStatusFilter}
          options={STATUS_FILTERS.map(f => ({ value: f.value, label: f.label }))} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredReturns.map(r => {
          const order = getOrderForReturn(r)
          const items = getReturnItems(r)
          const withinWindow = isWithinReturnWindow(order?.date)
          const hasNonReturnable = items.some(i => !isProductReturnable(i.productId))

          return (
            <Card t={t} key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: t.text }}>{r.id}</span>
                    <Badge t={t} text={r.status} color={r.status === 'completed' || r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow'} />
                    {r.type && <Badge t={t} text={r.type} color="blue" />}
                    {!withinWindow && <Badge t={t} text="Outside return window" color="red" />}
                    {hasNonReturnable && <Badge t={t} text="Contains non-returnable" color="red" />}
                  </div>
                  <div style={{ fontSize: 13, color: t.text2 }}>👤 {r.customer_name || r.customerName} · Order: {r.order_id || r.orderId}</div>
                  <div style={{ fontSize: 13, color: t.text2, marginTop: 4 }}>
                    📦 {items.map(i => `${i.name || i.productName} × ${i.qty || 1}`).join(', ')}
                  </div>
                  <div style={{ fontSize: 12, color: t.text3, marginTop: 2 }}>Reason: {r.reason_code || r.reason || '—'}</div>
                  {r.rejectReason && <div style={{ fontSize: 12, color: t.red, marginTop: 2 }}>Rejection: {r.rejectReason}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: t.accent }}>{fmt(r.refund_amount || r.refundAmount, settings?.sym)}</div>
                </div>
              </div>
            </Card>
          )
        })}
        {filteredReturns.length === 0 && (
          <Card t={t}>
            <div style={{ textAlign: 'center', padding: 30, color: t.text3 }}>
              {statusFilter === 'all' ? 'No return requests' : `No ${statusFilter} returns`}
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
