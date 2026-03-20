import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Badge, Card, StatCard, Modal, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts } from '@/lib/utils'

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed']

export const StaffDashboard = ({ orders, setOrders, products, users, addAudit, currentUser: cuProp, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser: cuCtx } = useAuth()
  const t = tProp || tCtx
  const currentUser = cuProp || cuCtx

  const [filter, setFilter] = useState('active')
  const [viewOrder, setViewOrder] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const active = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
  const completed = orders.filter(o => o.status === 'completed')
  const displayed = filter === 'active' ? active : filter === 'completed' ? completed : orders

  const pending = orders.filter(o => o.status === 'pending').length
  const preparing = orders.filter(o => o.status === 'preparing').length
  const ready = orders.filter(o => o.status === 'ready').length

  const updateStatus = (orderId, newStatus) => {
    setOrders(os => os.map(o => o.id === orderId ? { ...o, status: newStatus, lastUpdated: ts(), updatedBy: currentUser?.name || 'Staff' } : o))
    if (addAudit) addAudit({ action: 'Order Status Updated', detail: `${orderId} → ${newStatus}`, user: currentUser?.name || 'Staff' })
    notify(`Order ${orderId} → ${newStatus}`, 'success')
    setConfirmModal(null)
  }

  const nextStatus = (status) => {
    const idx = ORDER_STATUSES.indexOf(status)
    return idx >= 0 && idx < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[idx + 1] : null
  }

  const statusColor = (s) => {
    if (s === 'completed') return 'green'
    if (s === 'ready') return 'blue'
    if (s === 'preparing') return 'yellow'
    if (s === 'pending') return 'red'
    return 'blue'
  }

  const statusEmoji = (s) => {
    if (s === 'pending') return '🔴'
    if (s === 'preparing') return '🟡'
    if (s === 'ready') return '🟢'
    if (s === 'completed') return '✅'
    return '⬜'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Order Queue</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>{active.length} active order{active.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,45vw),1fr))', gap: 14 }}>
        <StatCard t={t} title="Pending" value={pending} color={t.red} icon="🔴" />
        <StatCard t={t} title="Preparing" value={preparing} color={t.yellow} icon="🟡" />
        <StatCard t={t} title="Ready" value={ready} color={t.blue} icon="🟢" />
        <StatCard t={t} title="Completed Today" value={completed.length} color={t.green} icon="✅" />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[['active', 'Active'], ['completed', 'Completed'], ['all', 'All']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${filter === v ? t.accent : t.border}`, background: filter === v ? t.accent : 'transparent', color: filter === v ? '#fff' : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>No orders in queue</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,90vw),1fr))', gap: 14 }}>
          {displayed.map(order => {
            const next = nextStatus(order.status)
            return (
              <Card t={t} key={order.id} style={{ borderLeft: `4px solid ${t[statusColor(order.status)] || t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{statusEmoji(order.status)} {order.id}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{order.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {order.orderType && <Badge t={t} text={order.orderType} color={order.orderType === 'delivery' ? 'teal' : order.orderType === 'pickup' ? 'blue' : 'green'} />}
                    <Badge t={t} text={order.status} color={statusColor(order.status)} />
                  </div>
                </div>

                <div style={{ fontSize: 12, color: t.text2, marginBottom: 4 }}>
                  <strong>Customer:</strong> {order.customerName || 'Walk-in'}
                </div>

                <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.text2 }}>
                      <span>{item.name} ×{item.qty}</span>
                      <span>{fmt(item.price * item.qty, settings?.sym)}</span>
                    </div>
                  ))}
                  {order.items.length > 4 && <div style={{ fontSize: 11, color: t.text4 }}>+{order.items.length - 4} more</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.accent }}>{fmt(order.total, settings?.sym)}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn t={t} variant="secondary" size="sm" onClick={() => setViewOrder(order)}>Details</Btn>
                    {next && (
                      <Btn t={t} variant="success" size="sm" onClick={() => setConfirmModal({ order, next })}>
                        → {next.charAt(0).toUpperCase() + next.slice(1)}
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {viewOrder && (
        <Modal t={t} title={`Order ${viewOrder.id}`} subtitle={viewOrder.date} onClose={() => setViewOrder(null)} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge t={t} text={viewOrder.status} color={statusColor(viewOrder.status)} />
              {viewOrder.orderType && <Badge t={t} text={viewOrder.orderType} color={viewOrder.orderType === 'delivery' ? 'teal' : 'blue'} />}
              <Badge t={t} text={viewOrder.payment} color="blue" />
            </div>
            <div style={{ fontSize: 13, color: t.text2 }}><strong>Customer:</strong> {viewOrder.customerName || 'Walk-in'}</div>
            {viewOrder.cashierName && <div style={{ fontSize: 13, color: t.text2 }}><strong>Cashier:</strong> {viewOrder.cashierName}</div>}
            {viewOrder.deliveryAddress && <div style={{ fontSize: 13, color: t.text2 }}><strong>Delivery:</strong> {viewOrder.deliveryAddress}</div>}

            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>ITEMS</div>
              {viewOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, padding: '5px 0', borderBottom: i < viewOrder.items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <span>{item.name} ×{item.qty}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(item.price * item.qty, settings?.sym)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `1px solid ${t.border}`, marginTop: 4 }}>
                <span>Total</span><span style={{ color: t.accent }}>{fmt(viewOrder.total, settings?.sym)}</span>
              </div>
            </div>

            {nextStatus(viewOrder.status) && (
              <Btn t={t} variant="success" fullWidth onClick={() => { setViewOrder(null); setConfirmModal({ order: viewOrder, next: nextStatus(viewOrder.status) }) }}>
                Move to → {nextStatus(viewOrder.status)}
              </Btn>
            )}
          </div>
        </Modal>
      )}

      {confirmModal && (
        <Modal t={t} title="Confirm Status Change" onClose={() => setConfirmModal(null)} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>{statusEmoji(confirmModal.next)}</div>
            <div style={{ fontSize: 15, color: t.text }}>
              Move <strong>{confirmModal.order.id}</strong> to <strong>{confirmModal.next}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="secondary" fullWidth onClick={() => setConfirmModal(null)}>Cancel</Btn>
              <Btn t={t} variant="success" fullWidth onClick={() => updateStatus(confirmModal.order.id, confirmModal.next)}>Confirm</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
