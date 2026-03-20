import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, StatCard, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'

export const CashierOrders = ({ orders, setOrders, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser } = useAuth()
  const t = tProp || tCtx
  const user = currentUser

  const my = orders.filter(o => o.cashierId === user?.id)
  const [pickupModal, setPickupModal] = useState(null)
  const [trackModal, setTrackModal] = useState(null)
  const DELIVERY_STATUSES = ['pending', 'processing', 'dispatched', 'out-for-delivery', 'delivered']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>My Orders</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(180px,45vw),1fr))', gap: 14 }}>
        <StatCard t={t} title="Orders" value={my.length} color={t.green} icon="🧾" />
        <StatCard t={t} title="Revenue" value={fmt(my.reduce((s, o) => s + o.total, 0), settings?.sym)} color={t.accent} icon="💰" />
        <StatCard t={t} title="Deliveries" value={my.filter(o => o.orderType === 'delivery').length} color={t.teal} icon="🚚" />
        <StatCard t={t} title="Pickups" value={my.filter(o => o.orderType === 'pickup').length} color={t.blue} icon="📦" />
      </div>

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table t={t} cols={['Order', 'Customer', 'Type', 'Total', 'Payment', 'Status', 'Actions']} rows={my.map(o => [
          o.id,
          o.customerName,
          <Badge t={t} text={o.orderType || 'in-store'} color={o.orderType === 'delivery' ? 'teal' : o.orderType === 'pickup' ? 'blue' : 'green'} />,
          fmt(o.total, settings?.sym),
          o.payment,
          <Badge t={t} text={o.status} color={o.status === 'completed' ? 'green' : 'red'} />,
          <div style={{ display: 'flex', gap: 5 }}>
            {o.orderType === 'pickup' && o.status === 'completed' && (
              <Btn t={t} variant="secondary" size="sm" onClick={() => setPickupModal(o)}>📦 Pickup</Btn>
            )}
            {o.orderType === 'delivery' && (
              <Btn t={t} variant="secondary" size="sm" onClick={() => setTrackModal(o)}>🚚 Track</Btn>
            )}
          </div>
        ])} empty="No orders yet" />
      </Card>

      {pickupModal && (
        <Modal t={t} title="Confirm Pickup" subtitle={`Order ${pickupModal.id}`} onClose={() => setPickupModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.blueBg, border: `1px solid ${t.blueBorder}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: t.blue, fontWeight: 700 }}>👤 {pickupModal.customerName}</div>
              <div style={{ fontSize: 12, color: t.text3, marginTop: 4 }}>Scheduled: {pickupModal.pickupDate || 'No date set'}</div>
              <div style={{ fontSize: 12, color: t.text3 }}>Items: {pickupModal.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: t.accent, marginTop: 6 }}>{fmt(pickupModal.total, settings?.sym)}</div>
            </div>
            <Btn t={t} variant="success" fullWidth onClick={() => { notify(`Pickup confirmed for ${pickupModal.customerName}`, 'success'); setPickupModal(null) }}>✓ Confirm Collected</Btn>
            <Btn t={t} variant="ghost" fullWidth onClick={() => setPickupModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {trackModal && (
        <Modal t={t} title="Update Delivery Status" subtitle={`Order ${trackModal.id} · ${trackModal.customerName}`} onClose={() => setTrackModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.tealBg, border: `1px solid ${t.tealBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: t.teal }}>
              📍 {trackModal.deliveryAddress || 'No address'}<br />
              <span style={{ fontWeight: 700 }}>Current: {trackModal.deliveryStatus || 'pending'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DELIVERY_STATUSES.map(s => (
                <button key={s} onClick={() => {
                  setOrders(os => os.map(o => o.id === trackModal.id ? { ...o, deliveryStatus: s } : o))
                  notify(`Status updated to ${s}`, 'success')
                  setTrackModal(null)
                }}
                  style={{ padding: '10px 14px', borderRadius: 9, border: `1px solid ${trackModal.deliveryStatus === s ? t.teal : t.border}`, background: trackModal.deliveryStatus === s ? t.tealBg : t.bg3, color: trackModal.deliveryStatus === s ? t.teal : t.text2, fontSize: 13, fontWeight: trackModal.deliveryStatus === s ? 800 : 500, cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize' }}>
                  {trackModal.deliveryStatus === s ? '✓ ' : ''}{s.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
