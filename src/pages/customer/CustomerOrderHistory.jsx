import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Badge, Card, Modal } from '@/components/ui'
import { fmt } from '@/lib/utils'

export const CustomerOrderHistory = ({ orders, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser } = useAuth()
  const t = tProp || tCtx

  const [viewOrder, setViewOrder] = useState(null)
  const myOrders = orders.filter(o => o.customerId === currentUser?.id)

  const statusColor = (s) => {
    if (s === 'completed' || s === 'delivered') return 'green'
    if (s === 'preparing' || s === 'processing') return 'yellow'
    if (s === 'cancelled' || s === 'refunded') return 'red'
    return 'blue'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(10px,2vw,20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>My Orders</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>{myOrders.length} order{myOrders.length !== 1 ? 's' : ''} total</div>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No orders yet</div>
          <div style={{ fontSize: 13 }}>Your order history will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myOrders.map(order => (
            <Card t={t} key={order.id} style={{ cursor: 'pointer', transition: 'transform .12s' }}
              onClick={() => setViewOrder(order)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{order.id}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{order.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge t={t} text={order.orderType || 'in-store'} color={order.orderType === 'delivery' ? 'teal' : order.orderType === 'pickup' ? 'blue' : 'green'} />
                  <Badge t={t} text={order.status} color={statusColor(order.status)} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.text2 }}>
                    <span>{item.name} ×{item.qty}</span>
                    <span>{fmt(item.price * item.qty, settings?.sym)}</span>
                  </div>
                ))}
                {order.items.length > 3 && <div style={{ fontSize: 11, color: t.text4 }}>+{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: t.accent }}>{fmt(order.total, settings?.sym)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: t.text3 }}>{order.payment}</span>
                  {order.loyaltyEarned > 0 && <Badge t={t} text={`+${order.loyaltyEarned} pts`} color="purple" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewOrder && (
        <Modal t={t} title={`Order ${viewOrder.id}`} subtitle={viewOrder.date} onClose={() => setViewOrder(null)} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge t={t} text={viewOrder.orderType || 'in-store'} color={viewOrder.orderType === 'delivery' ? 'teal' : viewOrder.orderType === 'pickup' ? 'blue' : 'green'} />
              <Badge t={t} text={viewOrder.status} color={statusColor(viewOrder.status)} />
              <Badge t={t} text={viewOrder.payment} color="blue" />
            </div>

            {viewOrder.deliveryAddress && (
              <div style={{ background: t.bg3, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 3 }}>DELIVERY ADDRESS</div>
                <div style={{ fontSize: 13, color: t.text2 }}>{viewOrder.deliveryAddress}</div>
              </div>
            )}

            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>ITEMS</div>
              {viewOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, padding: '5px 0', borderBottom: i < viewOrder.items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: t.text4 }}> ×{item.qty}</span>
                    {item.size && <span style={{ fontSize: 11, color: t.text3 }}> ({item.size})</span>}
                    {item.discount > 0 && <span style={{ fontSize: 11, color: t.accent }}> -{item.discount}%</span>}
                  </div>
                  <span style={{ fontWeight: 600 }}>{fmt(item.price * (1 - (item.discount || 0) / 100) * item.qty, settings?.sym)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Subtotal', fmt(viewOrder.subtotal, settings?.sym)],
                viewOrder.tax > 0 && ['Tax', fmt(viewOrder.tax, settings?.sym)],
                viewOrder.deliveryCharge > 0 && ['Delivery', fmt(viewOrder.deliveryCharge, settings?.sym)],
                viewOrder.couponDiscount > 0 && ['Coupon Discount', '-' + fmt(viewOrder.couponDiscount, settings?.sym)],
                viewOrder.loyaltyDiscount > 0 && ['Loyalty Discount', '-' + fmt(viewOrder.loyaltyDiscount, settings?.sym)],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text3 }}>
                  <span>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `2px solid ${t.border}`, marginTop: 4 }}>
                <span>Total</span><span style={{ color: t.accent }}>{fmt(viewOrder.total, settings?.sym)}</span>
              </div>
            </div>

            {viewOrder.loyaltyEarned > 0 && (
              <div style={{ background: t.purpleBg, border: `1px solid ${t.purpleBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.purple }}>Earned {viewOrder.loyaltyEarned} loyalty points</div>
              </div>
            )}

            <Btn t={t} onClick={() => setViewOrder(null)} fullWidth>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
