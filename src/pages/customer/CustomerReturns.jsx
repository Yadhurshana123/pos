import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, StatCard, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts, genId } from '@/lib/utils'
import dayjs from 'dayjs'

const RETURN_REASONS = [
  'Defective / Damaged',
  'Wrong item received',
  'Changed my mind',
  'Item not as described',
  'Better price available',
  'Other',
]

export const CustomerReturns = ({ orders, returns, setReturns, products, setProducts, addAudit, currentUser, t: tProp, settings }) => {
  const { t: tCtx } = useTheme()
  const { currentUser: authUser } = useAuth()
  const user = currentUser || authUser
  const t = tProp || tCtx

  const [showForm, setShowForm] = useState(false)
  const [selOrder, setSelOrder] = useState('')
  const [selItemQtys, setSelItemQtys] = useState({})
  const [reason, setReason] = useState(RETURN_REASONS[0])
  const [notes, setNotes] = useState('')
  const [viewReturn, setViewReturn] = useState(null)

  const returnDays = settings?.returnDays ?? 30
  const allowReturns = settings?.allowReturns !== false

  const isWithinReturnWindow = (orderDate) => {
    if (!orderDate) return true
    const days = dayjs().diff(dayjs(orderDate, ['DD/MM/YYYY, HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD']), 'day')
    return days <= returnDays
  }

  const myOrders = orders.filter(o =>
    o.customerId === user?.id &&
    (o.status === 'completed' || o.status === 'delivered') &&
    isWithinReturnWindow(o.date) &&
    allowReturns
  )
  const myReturns = (returns || []).filter(r => r.customerId === user?.id)
  const selectedOrder = myOrders.find(o => o.id === selOrder)

  const isProductReturnable = (productId) => {
    const p = products?.find(pr => pr.id === productId)
    return p == null || p.returnable !== false
  }

  const setItemQty = (itemIdx, qty) => {
    const maxQty = selectedOrder?.items[itemIdx]?.qty || 0
    const n = Math.max(0, Math.min(maxQty, parseInt(qty, 10) || 0))
    setSelItemQtys(prev => (n > 0 ? { ...prev, [itemIdx]: n } : (() => { const { [itemIdx]: _, ...rest } = prev; return rest })()))
  }

  const toggleItem = (itemIdx) => {
    const item = selectedOrder?.items[itemIdx]
    if (!item) return
    if (selItemQtys[itemIdx]) {
      setSelItemQtys(prev => { const { [itemIdx]: _, ...rest } = prev; return rest })
    } else {
      setSelItemQtys(prev => ({ ...prev, [itemIdx]: item.qty }))
    }
  }

  const selectedItems = selectedOrder
    ? Object.entries(selItemQtys)
        .filter(([idx, qty]) => qty > 0 && selectedOrder.items[+idx])
        .map(([idx, qty]) => ({ item: selectedOrder.items[+idx], idx: +idx, qty }))
    : []

  const submitReturn = () => {
    if (!selOrder) { notify('Please select an order', 'error'); return }
    if (selectedItems.length === 0) { notify('Please select at least one item with quantity', 'error'); return }
    if (!reason) { notify('Please select a reason', 'error'); return }

    const nonReturnable = selectedItems.filter(({ item }) => !isProductReturnable(item.productId))
    if (nonReturnable.length > 0) {
      notify(`${nonReturnable.map(({ item }) => item.name).join(', ')} cannot be returned (non-returnable items)`, 'error')
      return
    }

    const itemsToReturn = selectedItems.map(({ item, qty }) => ({
      productId: item.productId,
      name: item.name,
      qty,
      price: item.price,
      discount: item.discount || 0,
    }))
    const refundAmt = itemsToReturn.reduce(
      (s, i) => s + i.price * (1 - (i.discount || 0) / 100) * i.qty,
      0
    )
    const order = myOrders.find(o => o.id === selOrder)

    const ret = {
      id: genId('RET'),
      orderId: selOrder,
      customerId: user.id,
      customerName: user.name,
      items: itemsToReturn,
      reason,
      notes: notes.trim(),
      refundAmount: Math.round(refundAmt * 100) / 100,
      status: 'pending',
      date: ts(),
      paymentMethod: order?.payment || 'Original payment',
      cardLast4: order?.cardLast4,
    }

    setReturns(prev => [ret, ...(prev || [])])
    if (addAudit) addAudit(user, 'Return Request', 'Returns', `${ret.id} for ${selOrder} — ${fmt(ret.refundAmount, settings?.sym)}`)
    notify('Return request submitted: ' + ret.id, 'success')

    setShowForm(false)
    setSelOrder('')
    setSelItemQtys({})
    setReason(RETURN_REASONS[0])
    setNotes('')
  }

  const statusColor = (s) => {
    if (s === 'approved' || s === 'refunded') return 'green'
    if (s === 'pending') return 'yellow'
    if (s === 'rejected') return 'red'
    return 'blue'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(10px,2vw,20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Returns</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 2 }}>
            {myReturns.length} return{myReturns.length !== 1 ? 's' : ''} · {returnDays} day return window
          </div>
        </div>
        <Btn t={t} onClick={() => setShowForm(true)} disabled={!allowReturns}>📦 New Return Request</Btn>
      </div>

      {!allowReturns && (
        <Card t={t} style={{ background: t.bg3, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 14, color: t.text2 }}>Returns are currently disabled.</div>
        </Card>
      )}
      {myReturns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>↩️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No returns</div>
          <div style={{ fontSize: 13 }}>Your return requests will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myReturns.map(ret => (
            <Card t={t} key={ret.id} style={{ cursor: 'pointer', transition: 'transform .12s' }}
              onClick={() => setViewReturn(ret)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{ret.id}</div>
                  <div style={{ fontSize: 11, color: t.text3 }}>Order: {ret.orderId} · {ret.date}</div>
                </div>
                <Badge t={t} text={ret.status} color={statusColor(ret.status)} />
              </div>
              <div style={{ fontSize: 12, color: t.text2, marginBottom: 6 }}>
                {ret.items?.length
                  ? ret.items.map(i => `${i.name || i.productName} × ${i.qty || 1}`).join(', ')
                  : ret.productName ? `${ret.productName} × ${ret.qty || 1}` : '—'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: t.text3 }}>{ret.reason}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: t.accent }}>{fmt(ret.refundAmount, settings?.sym)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal t={t} title="📦 New Return Request" onClose={() => setShowForm(false)} width={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: t.text3 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤷</div>
                <div style={{ fontSize: 14 }}>No eligible orders found for returns</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Completed orders must be within {returnDays} days</div>
              </div>
            ) : (
              <>
                <Select t={t} label="Select Order" value={selOrder} onChange={v => { setSelOrder(v); setSelItemQtys({}) }}
                  options={[{ value: '', label: 'Choose an order...' }, ...myOrders.map(o => ({ value: o.id, label: `${o.id} — ${fmt(o.total, settings?.sym)} — ${o.date}` }))]} />

                {selectedOrder && (
                  <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>SELECT ITEMS TO RETURN</div>
                    {selectedOrder.items.map((item, i) => (
                      <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: i < selectedOrder.items.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selItems.includes(i)} onChange={() => toggleItem(i)}
                          style={{ width: 16, height: 16, accentColor: t.accent }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: t.text3 }}>Qty: {item.qty} · {fmt(item.price * item.qty, settings?.sym)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <Select t={t} label="Reason" value={reason} onChange={setReason}
                  options={RETURN_REASONS.map(r => ({ value: r, label: r }))} />

                <Input t={t} label="Additional Notes (optional)" value={notes} onChange={setNotes} placeholder="Describe the issue..." />

                {selectedItems.length > 0 && selectedOrder && (
                  <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.yellow }}>Estimated Refund</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: t.yellow }}>
                      {fmt(selectedItems.reduce((s, { item, qty }) => s + item.price * (1 - (item.discount || 0) / 100) * qty, 0), settings?.sym)}
                    </span>
                  </div>
                )}

                <Btn t={t} variant="success" fullWidth onClick={submitReturn} disabled={!selOrder || selectedItems.length === 0}>
                  Submit Return Request
                </Btn>
              </>
            )}
          </div>
        </Modal>
      )}

      {viewReturn && (
        <Modal t={t} title={`Return ${viewReturn.id}`} subtitle={viewReturn.date} onClose={() => setViewReturn(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge t={t} text={viewReturn.status} color={statusColor(viewReturn.status)} />
              <Badge t={t} text={`Order: ${viewReturn.orderId}`} color="blue" />
            </div>
            <div style={{ background: t.bg3, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, marginBottom: 8 }}>ITEMS</div>
              {(viewReturn.items || (viewReturn.productName ? [{ name: viewReturn.productName, qty: viewReturn.qty || 1, price: viewReturn.refundAmount / (viewReturn.qty || 1) }] : [])).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, padding: '4px 0' }}>
                  <span>{item.name || item.productName} ×{item.qty || 1}</span>
                  <span>{fmt((item.price || 0) * (item.qty || 1), settings?.sym)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: t.text2 }}><strong>Reason:</strong> {viewReturn.reason}</div>
            {viewReturn.notes && <div style={{ fontSize: 13, color: t.text2 }}><strong>Notes:</strong> {viewReturn.notes}</div>}
            <div style={{ background: t.bg3, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: t.text2 }}>
              <strong>Refund to:</strong> {(() => {
                const ord = orders.find(o => o.id === viewReturn.orderId)
                return ord?.payment ? `${ord.payment}${ord.cardLast4 ? ` •••• ${ord.cardLast4}` : ''}` : (viewReturn.paymentMethod || 'Original payment method')
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `2px solid ${t.border}` }}>
              <span>Refund Amount</span><span style={{ color: t.accent }}>{fmt(viewReturn.refundAmount, settings?.sym)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
