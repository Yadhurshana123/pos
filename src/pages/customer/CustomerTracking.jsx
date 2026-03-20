import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Badge, Card, Modal } from '@/components/ui'
import { fmt } from '@/lib/utils'

const DELIVERY_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '🧾' },
  { key: 'processing', label: 'Processing', icon: '📋' },
  { key: 'dispatched', label: 'Dispatched', icon: '📤' },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
]

const PICKUP_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '🧾' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready', label: 'Ready for Pickup', icon: '📦' },
  { key: 'picked-up', label: 'Picked Up', icon: '✅' },
]

export const CustomerTracking = ({ orders, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser } = useAuth()
  const t = tProp || tCtx

  const [selectedOrder, setSelectedOrder] = useState(null)

  const trackable = orders.filter(o =>
    o.customerId === currentUser?.id &&
    (o.orderType === 'delivery' || o.orderType === 'pickup') &&
    o.status !== 'cancelled' && o.status !== 'refunded'
  )
  const active = trackable.filter(o => o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'picked-up')
  const completed = trackable.filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'picked-up')

  const getSteps = (order) => order.orderType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS

  const getStepIndex = (order) => {
    const steps = getSteps(order)
    const statusKey = order.deliveryStatus || order.status
    const idx = steps.findIndex(s => s.key === statusKey)
    if (idx >= 0) return idx
    if (order.status === 'completed' || order.status === 'delivered' || order.status === 'picked-up') return steps.length - 1
    if (order.status === 'preparing') return order.orderType === 'delivery' ? 1 : 1
    return 0
  }

  const renderTimeline = (order) => {
    const steps = getSteps(order)
    const currentStep = getStepIndex(order)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 4 }}>
        {steps.map((step, i) => {
          const done = i <= currentStep
          const isCurrent = i === currentStep
          return (
            <div key={step.key} style={{ display: 'flex', gap: 14, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done ? (isCurrent ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.greenBg) : t.bg3,
                  border: `2px solid ${done ? (isCurrent ? t.accent : t.green) : t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, zIndex: 2,
                  boxShadow: isCurrent ? `0 0 10px ${t.accent}40` : 'none'
                }}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 24,
                    background: i < currentStep ? t.green : t.border
                  }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 18 : 0, paddingTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: isCurrent ? 900 : 600, color: done ? t.text : t.text4 }}>{step.label}</div>
                {isCurrent && (
                  <div style={{ fontSize: 11, color: t.accent, marginTop: 2, fontWeight: 700 }}>Current status</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const OrderCard = ({ order }) => (
    <Card t={t} style={{ cursor: 'pointer', transition: 'transform .12s' }}
      onClick={() => setSelectedOrder(order)}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = ''}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{order.id}</div>
          <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{order.date}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge t={t} text={order.orderType} color={order.orderType === 'delivery' ? 'teal' : 'blue'} />
          <Badge t={t} text={fmt(order.total, settings?.sym)} color="green" />
        </div>
      </div>
      {renderTimeline(order)}
    </Card>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(10px,2vw,20px)' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Order Tracking</div>
        <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>{trackable.length} trackable order{trackable.length !== 1 ? 's' : ''}</div>
      </div>

      {trackable.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No trackable orders</div>
          <div style={{ fontSize: 13 }}>Delivery and pickup orders will appear here</div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Active Orders ({active.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text3, marginBottom: 10 }}>
                Completed ({completed.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completed.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
        </>
      )}

      {selectedOrder && (
        <Modal t={t} title={`Track ${selectedOrder.id}`} subtitle={`${selectedOrder.orderType} · ${selectedOrder.date}`} onClose={() => setSelectedOrder(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge t={t} text={selectedOrder.orderType} color={selectedOrder.orderType === 'delivery' ? 'teal' : 'blue'} />
              <Badge t={t} text={selectedOrder.status} color={selectedOrder.status === 'completed' || selectedOrder.status === 'delivered' ? 'green' : 'yellow'} />
            </div>

            {selectedOrder.deliveryAddress && (
              <div style={{ background: t.bg3, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 3 }}>DELIVERY TO</div>
                <div style={{ fontSize: 13, color: t.text2 }}>{selectedOrder.deliveryAddress}</div>
              </div>
            )}

            {renderTimeline(selectedOrder)}

            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>ITEMS</div>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, padding: '4px 0' }}>
                  <span>{item.name} ×{item.qty}</span>
                  <span>{fmt(item.price * item.qty, settings?.sym)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `1px solid ${t.border}`, marginTop: 6 }}>
                <span>Total</span><span style={{ color: t.accent }}>{fmt(selectedOrder.total, settings?.sym)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
