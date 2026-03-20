import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, StatCard, Modal } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts } from '@/lib/utils'

export const PickupOrders = ({ orders, setOrders, addAudit, currentUser: cuProp, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser: cuCtx } = useAuth()
  const t = tProp || tCtx
  const currentUser = cuProp || cuCtx

  const [filter, setFilter] = useState('ready')
  const [verifyModal, setVerifyModal] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [viewOrder, setViewOrder] = useState(null)

  const pickups = orders.filter(o => o.orderType === 'pickup')
  const readyPickups = pickups.filter(o => o.status === 'ready' || o.status === 'completed')
  const pendingPickups = pickups.filter(o => o.status === 'pending' || o.status === 'preparing')
  const pickedUp = pickups.filter(o => o.status === 'picked-up')
  const displayed = filter === 'ready' ? readyPickups : filter === 'pending' ? pendingPickups : filter === 'picked-up' ? pickedUp : pickups

  const confirmPickup = (order) => {
    setOrders(os => os.map(o => o.id === order.id ? { ...o, status: 'picked-up', pickedUpAt: ts(), pickedUpBy: currentUser?.name || 'Staff' } : o))
    if (addAudit) addAudit({ action: 'Pickup Confirmed', detail: `${order.id} collected by ${order.customerName}`, user: currentUser?.name || 'Staff' })
    notify(`Pickup confirmed: ${order.id}`, 'success')
    setVerifyModal(null)
    setVerifyCode('')
  }

  const statusColor = (s) => {
    if (s === 'picked-up') return 'green'
    if (s === 'ready' || s === 'completed') return 'blue'
    if (s === 'preparing') return 'yellow'
    return 'red'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Pickup Orders</div>
        <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>{pickups.length} pickup order{pickups.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,45vw),1fr))', gap: 14 }}>
        <StatCard t={t} title="Ready" value={readyPickups.length} color={t.blue} icon="📦" />
        <StatCard t={t} title="Pending" value={pendingPickups.length} color={t.yellow} icon="⏳" />
        <StatCard t={t} title="Picked Up" value={pickedUp.length} color={t.green} icon="✅" />
        <StatCard t={t} title="Total" value={pickups.length} color={t.accent} icon="🧾" />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[['ready', '📦 Ready'], ['pending', '⏳ Pending'], ['picked-up', '✅ Picked Up'], ['all', 'All']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === v ? t.accent : t.border}`, background: filter === v ? t.accent : 'transparent', color: filter === v ? '#fff' : t.text3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>No {filter} pickup orders</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,90vw),1fr))', gap: 14 }}>
          {displayed.map(order => (
            <Card t={t} key={order.id} style={{ borderLeft: `4px solid ${t[statusColor(order.status)] || t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{order.id}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{order.date}</div>
                </div>
                <Badge t={t} text={order.status} color={statusColor(order.status)} />
              </div>

              <div style={{ fontSize: 13, color: t.text2, marginBottom: 6 }}>
                <strong>Customer:</strong> {order.customerName || 'Walk-in'}
              </div>

              <div style={{ marginBottom: 10 }}>
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.text2, marginBottom: 2 }}>
                    <span>{item.name} ×{item.qty}</span>
                    <span>{fmt(item.price * item.qty, settings?.sym)}</span>
                  </div>
                ))}
                {order.items.length > 3 && <div style={{ fontSize: 11, color: t.text4 }}>+{order.items.length - 3} more</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: t.accent }}>{fmt(order.total, settings?.sym)}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn t={t} variant="secondary" size="sm" onClick={() => setViewOrder(order)}>Details</Btn>
                  {(order.status === 'ready' || order.status === 'completed') && (
                    <Btn t={t} variant="success" size="sm" onClick={() => setVerifyModal(order)}>✓ Confirm Pickup</Btn>
                  )}
                </div>
              </div>

              {order.pickedUpAt && (
                <div style={{ marginTop: 8, fontSize: 11, color: t.green, fontWeight: 700 }}>
                  Picked up at {order.pickedUpAt} by {order.pickedUpBy}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {verifyModal && (
        <Modal t={t} title="📦 Confirm Pickup" subtitle={verifyModal.id} onClose={() => { setVerifyModal(null); setVerifyCode('') }} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: t.text2, marginBottom: 4 }}><strong>Customer:</strong> {verifyModal.customerName}</div>
              <div style={{ fontSize: 13, color: t.text2, marginBottom: 4 }}><strong>Items:</strong> {verifyModal.items.length}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: t.accent }}>{fmt(verifyModal.total, settings?.sym)}</div>
            </div>

            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>ORDER ITEMS</div>
              {verifyModal.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, padding: '4px 0' }}>
                  <span>{item.name} ×{item.qty}</span>
                  <span>{fmt(item.price * item.qty, settings?.sym)}</span>
                </div>
              ))}
            </div>

            <Input t={t} label="Verification Code (optional)" value={verifyCode} onChange={setVerifyCode} placeholder="Enter code or leave blank" />

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="secondary" fullWidth onClick={() => { setVerifyModal(null); setVerifyCode('') }}>Cancel</Btn>
              <Btn t={t} variant="success" fullWidth onClick={() => confirmPickup(verifyModal)}>✓ Confirm Collected</Btn>
            </div>
          </div>
        </Modal>
      )}

      {viewOrder && (
        <Modal t={t} title={`Order ${viewOrder.id}`} subtitle={viewOrder.date} onClose={() => setViewOrder(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge t={t} text={viewOrder.status} color={statusColor(viewOrder.status)} />
              <Badge t={t} text={viewOrder.payment} color="blue" />
            </div>
            <div style={{ fontSize: 13, color: t.text2 }}><strong>Customer:</strong> {viewOrder.customerName || 'Walk-in'}</div>
            {viewOrder.cashierName && <div style={{ fontSize: 13, color: t.text2 }}><strong>Cashier:</strong> {viewOrder.cashierName}</div>}

            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
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
          </div>
        </Modal>
      )}
    </div>
  )
}
