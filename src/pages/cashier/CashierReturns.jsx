import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useCashStore } from '@/stores/cashStore'
import { Btn, Input, Badge, Card, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts } from '@/lib/utils'
import dayjs from 'dayjs'
import { returnsService, ordersService } from '@/services'
import { isSupabaseConfigured } from '@/lib/supabase'

const REASON_CODES = [
  { value: 'damaged', label: 'Defective / Damaged' },
  { value: 'wrong_size', label: 'Wrong size' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'other', label: 'Other' },
]

const REFUND_METHODS = [
  { value: 'original', label: 'Original payment method' },
  { value: 'store_credit', label: 'Store credit' },
]

const PROCESS_MODES = [
  { value: 'return', label: 'Return & Refund' },
  { value: 'exchange', label: 'Exchange (return + replacement order)' },
]

function getOrderItems(order) {
  const items = order?.order_items || order?.items || []
  return Array.isArray(items) ? items : []
}

function itemName(i) {
  return i?.product_name || i?.name || 'Unknown'
}

function itemQty(i) {
  return i?.quantity ?? i?.qty ?? 1
}

function itemPrice(i) {
  return i?.unit_price ?? i?.price ?? 0
}

function itemDiscount(i) {
  return i?.discount_pct ?? i?.discount ?? 0
}

export const CashierReturns = ({
  orders = [],
  setOrders,
  returns = [],
  setReturns,
  products = [],
  setProducts,
  settings,
  addAudit,
  currentUser,
  t: tProp,
  siteId,
}) => {
  const { t: tCtx } = useTheme()
  const { currentUser: authUser } = useAuth()
  const user = currentUser || authUser
  const t = tProp || tCtx

  const [orderSearch, setOrderSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selItemQtys, setSelItemQtys] = useState({})
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0].value)
  const [refundMethod, setRefundMethod] = useState('original')
  const [processMode, setProcessMode] = useState('return')
  const [processing, setProcessing] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)

  const returnDays = settings?.returnDays ?? 30
  const effectiveSiteId = siteId || 'b0000000-0000-0000-0000-000000000001'

  const isWithinReturnWindow = (orderDate) => {
    if (!orderDate) return true
    const d = dayjs(orderDate).isValid() ? dayjs(orderDate) : dayjs(orderDate, ['DD/MM/YYYY, HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD'])
    return d.isValid() && dayjs().diff(d, 'day') <= returnDays
  }

  const isProductReturnable = (productId) => {
    const p = (products || []).find((pr) => pr.id === productId)
    return p == null || p.returnable !== false
  }

  const lookupOrder = async () => {
    if (!orderSearch?.trim()) return
    setLookupLoading(true)
    setSelectedOrder(null)
    setSelItemQtys({})
    try {
      const fromState = (orders || []).find(
        (o) =>
          String(o.order_number || o.id).toLowerCase() === orderSearch.trim().toLowerCase() ||
          String(o.id).toLowerCase() === orderSearch.trim().toLowerCase()
      )
      if (fromState) {
        setSelectedOrder(fromState)
        const items = getOrderItems(fromState)
        const initial = {}
        items.forEach((it, idx) => {
          initial[idx] = itemQty(it)
        })
        setSelItemQtys(initial)
        return
      }
      if (isSupabaseConfigured()) {
        const o = await ordersService.fetchOrderByNumber(orderSearch.trim())
        if (o) {
          setSelectedOrder(o)
          const items = getOrderItems(o)
          const initial = {}
          items.forEach((it, idx) => {
            initial[idx] = itemQty(it)
          })
          setSelItemQtys(initial)
        } else {
          notify('Order not found', 'error')
        }
      } else {
        notify('Order not found', 'error')
      }
    } catch (err) {
      notify(err?.message || 'Lookup failed', 'error')
    } finally {
      setLookupLoading(false)
    }
  }

  const items = selectedOrder ? getOrderItems(selectedOrder) : []
  const selectedItems = items
    .map((it, idx) => ({ item: it, idx, qty: selItemQtys[idx] ?? 0 }))
    .filter(({ qty }) => qty > 0)

  const refundAmount = selectedItems.reduce((s, { item, qty }) => {
    const price = itemPrice(item)
    const disc = itemDiscount(item)
    return s + price * (1 - disc / 100) * qty
  }, 0)

  const hasNonReturnable = selectedItems.some(({ item }) => !isProductReturnable(item.product_id || item.productId))
  const withinWindow = isWithinReturnWindow(selectedOrder?.created_at || selectedOrder?.date)

  const processReturn = async () => {
    if (!selectedOrder || selectedItems.length === 0) {
      notify('Select at least one item to return', 'error')
      return
    }
    if (hasNonReturnable) {
      notify('Some selected items are non-returnable', 'error')
      return
    }
    if (!withinWindow) {
      notify(`Return window is ${returnDays} days`, 'error')
      return
    }

    setProcessing(true)
    try {
      const orderId = selectedOrder.id
      const isExchange = processMode === 'exchange'
      const effectiveRefundMethod = isExchange ? 'exchange' : refundMethod

      const returnItems = selectedItems.map(({ item, qty }) => {
        const price = itemPrice(item)
        const disc = itemDiscount(item)
        const lineRefund = price * (1 - disc / 100) * qty
        return {
          productId: item.product_id || item.productId,
          orderItemId: item.id || null,
          product_id: item.product_id || item.productId,
          qty: qty,
          quantity: qty,
          refundAmount: Math.round(lineRefund * 100) / 100,
          restock: true,
        }
      })

      const ret = await returnsService.createReturnWithItems({
        orderId,
        customerId: selectedOrder.customer_id || selectedOrder.customerId || null,
        type: selectedItems.length === items.length ? 'full' : 'partial',
        reasonCode,
        reason: REASON_CODES.find((r) => r.value === reasonCode)?.label || reasonCode,
        refundMethod: effectiveRefundMethod,
        items: returnItems,
        processedBy: user?.id,
        siteId: effectiveSiteId,
      })

      if (ret) {
        setReturns((rs) => [ret, ...(rs || [])])
        setProducts((ps) =>
          (ps || []).map((p) => {
            const inc = returnItems.find((ri) => (ri.productId || ri.product_id) === p.id)
            return inc ? { ...p, stock: (p.stock ?? 0) + inc.qty } : p
          })
        )
        if (selectedOrder.id && !(orders || []).find((o) => o.id === selectedOrder.id)) {
          setOrders((os) => [selectedOrder, ...(os || [])])
        }

        if (isExchange) {
          const exchangeItems = selectedItems.map(({ item, qty }) => ({
            productId: item.product_id || item.productId,
            product_id: item.product_id || item.productId,
            name: itemName(item),
            qty,
            price: itemPrice(item),
            discount: itemDiscount(item),
          }))
          const subtotal = exchangeItems.reduce((s, i) => s + i.price * (1 - i.discount / 100) * i.qty, 0)
          const vatRate = 0 // per-product tax now
          const taxAmount = Math.round(exchangeItems.reduce((s, i) => { const p = (products || []).find(pr => pr.id === (i.productId || i.product_id)); const lineNet = i.price * (1 - i.discount / 100) * i.qty; return s + lineNet * ((p?.taxPct ?? 20) / 100) }, 0) * 100) / 100
          const total = Math.round((subtotal + taxAmount) * 100) / 100

          const exchangeOrder = await ordersService.createOrderWithItems({
            siteId: effectiveSiteId,
            counterId: user?.counter_id || null,
            cashierId: user?.id,
            customerId: selectedOrder.customer_id || selectedOrder.customerId || null,
            items: exchangeItems,
            subtotal,
            taxAmount,
            discountAmount: 0,
            loyaltyDiscount: 0,
            total,
            paymentMethod: 'Exchange',
            paymentDetails: { exchange_for_return_id: ret.id },
            loyaltyEarned: 0,
            loyaltyUsed: 0,
            manualDiscountPct: 0,
          })

          if (exchangeOrder) {
            setOrders((os) => [exchangeOrder, ...(os || [])])
            if (addAudit) addAudit(user, 'Exchange Processed', 'Returns', `${ret.return_number || ret.id} → Order ${exchangeOrder.order_number || exchangeOrder.id}`)
            notify(`Exchange: Return ${ret.return_number || ret.id} + Order ${exchangeOrder.order_number || exchangeOrder.id} created`, 'success')
          } else {
            notify(`Return ${ret.return_number || ret.id} processed. Exchange order failed.`, 'warning')
          }
        } else {
          const origPayment = selectedOrder.payment_method || selectedOrder.payment
          if ((origPayment === 'Cash' || origPayment === 'Split') && refundMethod === 'original' && refundAmount > 0) {
            useCashStore.getState().addMovement('refund', refundAmount, `Refund: ${ret.return_number || ret.id}`, user)
          }
          if (addAudit) addAudit(user, 'Return Processed', 'Returns', `${ret.return_number || ret.id} — ${fmt(refundAmount, settings?.sym)}`)
          notify(`Return ${ret.return_number || ret.id} processed`, 'success')
        }

        setSelectedOrder(null)
        setSelItemQtys({})
        setOrderSearch('')
      }
    } catch (err) {
      notify(err?.message || 'Failed to process return', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const setItemQty = (idx, qty) => {
    const max = itemQty(items[idx] || {})
    const n = Math.max(0, Math.min(max, parseInt(qty, 10) || 0))
    setSelItemQtys((prev) => (n > 0 ? { ...prev, [idx]: n } : (() => { const { [idx]: _, ...rest } = prev; return rest })()))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Process Return</div>

      <Card t={t}>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 12 }}>Lookup Order</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Input
            t={t}
            value={orderSearch}
            onChange={setOrderSearch}
            placeholder="Order number (e.g. ORD-0001)"
            onKeyDown={(e) => e.key === 'Enter' && lookupOrder()}
            style={{ flex: 1 }}
          />
          <Btn t={t} onClick={lookupOrder} disabled={lookupLoading || !orderSearch?.trim()}>
            {lookupLoading ? '...' : 'Lookup'}
          </Btn>
        </div>
      </Card>

      {selectedOrder && (
        <>
          <Card t={t}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>
                Order {selectedOrder.order_number || selectedOrder.id}
              </div>
              {!withinWindow && <Badge t={t} text={`Outside ${returnDays}-day window`} color="red" />}
            </div>
            <div style={{ fontSize: 13, color: t.text2, marginBottom: 12 }}>
              Customer: {selectedOrder.customer_name || selectedOrder.customerName || 'Walk-in'} · Payment:{' '}
              {selectedOrder.payment_method || selectedOrder.payment}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => {
                const returnable = isProductReturnable(item.product_id || item.productId)
                const maxQty = itemQty(item)
                const selQty = selItemQtys[idx] ?? 0
                const linePrice = itemPrice(item) * (1 - itemDiscount(item) / 100)
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: !returnable ? t.redBg + '40' : t.bg3,
                      borderRadius: 9,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selQty > 0}
                      onChange={(e) => setItemQty(idx, e.target.checked ? maxQty : 0)}
                      disabled={!returnable}
                      style={{ width: 18, height: 18, accentColor: t.accent }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                        {itemName(item)}
                        {!returnable && <Badge t={t} text="Non-returnable" color="red" />}
                      </div>
                      <div style={{ fontSize: 11, color: t.text3 }}>
                        {fmt(linePrice, settings?.sym)} × {maxQty} max
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={maxQty}
                      value={selQty}
                      onChange={(e) => setItemQty(idx, e.target.value)}
                      disabled={!returnable}
                      style={{
                        width: 56,
                        padding: '6px 8px',
                        background: t.input,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.text,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.accent, minWidth: 60, textAlign: 'right' }}>
                      {fmt(linePrice * selQty, settings?.sym)}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card t={t}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Select
                t={t}
                label="Action"
                value={processMode}
                onChange={setProcessMode}
                options={PROCESS_MODES.map((r) => ({ value: r.value, label: r.label }))}
              />
              <Select
                t={t}
                label="Return reason"
                value={reasonCode}
                onChange={setReasonCode}
                options={REASON_CODES.map((r) => ({ value: r.value, label: r.label }))}
              />
              {processMode === 'return' && (
                <Select
                  t={t}
                  label="Refund method"
                  value={refundMethod}
                  onChange={setRefundMethod}
                  options={REFUND_METHODS.map((r) => ({ value: r.value, label: r.label }))}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: t.text }}>
                  {processMode === 'exchange' ? 'Exchange value' : 'Refund amount'}
                </span>
                <span style={{ fontSize: 22, fontWeight: 900, color: t.accent }}>{fmt(refundAmount, settings?.sym)}</span>
              </div>
              <Btn
                t={t}
                variant="success"
                size="lg"
                fullWidth
                onClick={processReturn}
                disabled={processing || selectedItems.length === 0 || hasNonReturnable || !withinWindow}
              >
                {processing ? 'Processing...' : processMode === 'exchange' ? 'Process Exchange' : 'Process Return'}
              </Btn>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
