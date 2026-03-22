import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isUuid } from '@/lib/utils'

/** Only pass values Postgres uuid columns accept; local demo IDs (e.g. Date.now()) become null. */
function asUuidOrNull(v) {
  return isUuid(v) ? String(v).trim() : null
}

/** Map DB order to app format (camelCase) */
function toAppFormat(row) {
  if (!row) return row
  return {
    ...row,
    orderNumber: row.order_number,
    orderType: row.order_type || 'in-store',
    customerName: row.customer_name || 'Walk-in',
    cashierName: row.cashier_name || 'Staff',
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax_amount || 0),
    discountAmt: Number(row.discount_amount || 0),
    total: Number(row.total || 0),
    payment: row.payment_method || 'Cash',
    date: row.created_at ? new Date(row.created_at).toLocaleString('en-GB', { hour12: false }).replace(',', '') : row.date,
    items: row.order_items?.map(i => ({
      ...i,
      productId: i.product_id,
      name: i.product_name,
      qty: i.quantity,
      price: i.unit_price,
      discount: i.discount_pct,
      lineTotal: i.line_total
    })) || []
  }
}

export async function fetchOrders(filters = {}) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('orders').select('*, order_items(*)')
    if (filters.customerId) q = q.eq('customer_id', filters.customerId)
    if (filters.cashierId) q = q.eq('cashier_id', filters.cashierId)
    if (filters.siteId) q = q.eq('site_id', filters.siteId)
    if (filters.status) q = q.eq('status', filters.status)
    if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
    if (filters.dateTo) q = q.lte('created_at', filters.dateTo)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toAppFormat)
  }
  return null
}

export async function createOrder(order) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('orders').insert(order).select().single()
    if (error) throw error
    return data
  }
  return { id: 'ORD-' + String(Math.floor(Math.random() * 9000) + 1000), ...order }
}

/** Create order + order_items in Supabase. Returns created order with items. */
export async function createOrderWithItems({ siteId, counterId, cashierId, customerId, items, subtotal, taxAmount, discountAmount, loyaltyDiscount, total, paymentMethod, paymentDetails, loyaltyEarned, loyaltyUsed, manualDiscountPct }) {
  if (!isSupabaseConfigured()) return null
  const orderPayload = {
    site_id: asUuidOrNull(siteId),
    counter_id: asUuidOrNull(counterId),
    customer_id: asUuidOrNull(customerId),
    cashier_id: asUuidOrNull(cashierId),
    order_type: 'in-store',
    status: 'completed',
    subtotal: Number(subtotal),
    tax_amount: Number(taxAmount),
    discount_amount: Number(discountAmount || 0),
    loyalty_discount: Number(loyaltyDiscount || 0),
    delivery_charge: 0,
    total: Number(total),
    payment_method: paymentMethod || 'Cash',
    payment_details: paymentDetails || {},
    loyalty_earned: loyaltyEarned || 0,
    loyalty_used: loyaltyUsed || 0,
    manual_discount_pct: Number(manualDiscountPct || 0),
  }
  const { data: order, error: orderErr } = await supabase.from('orders').insert(orderPayload).select().single()
  if (orderErr) throw orderErr
  if (!items?.length) return order

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: asUuidOrNull(i.productId || i.product_id),
    variant_id: asUuidOrNull(i.variantId || i.variant_id),
    product_name: i.name,
    quantity: i.qty,
    unit_price: Number(i.price),
    discount_pct: Number(i.discount || 0),
    override_price: i.overridePrice != null ? Number(i.overridePrice) : null,
    line_total: Number((i.price * (1 - (i.discount || 0) / 100) * i.qty).toFixed(2)),
  }))
  const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
  if (itemsErr) throw itemsErr
  return { ...order, order_items: orderItems }
}

/** Fetch order by order_number for reprint receipt */
export async function fetchOrderByNumber(orderNumber) {
  if (!isSupabaseConfigured() || !orderNumber?.trim()) return null
  const num = String(orderNumber).trim()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', num)
    .maybeSingle()
  if (error || !data) return null
  return toAppFormat(data)
}

export async function updateOrderStatus(id, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return toAppFormat(data)
  }
  return { id, status }
}
