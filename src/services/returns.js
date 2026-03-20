import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { addStock } from './inventory'
import { createRefundPayment } from './payments'

export async function fetchReturns(filters = {}) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('returns').select('*, return_items(*)')
    if (filters.customerId) q = q.eq('customer_id', filters.customerId)
    if (filters.status) q = q.eq('status', filters.status)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  return null
}

export async function createReturn(ret) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('returns').insert(ret).select().single()
    if (error) throw error
    return data
  }
  return { id: 'RET-' + String(Math.floor(Math.random() * 9000) + 1000), ...ret }
}

/** Create return with items, restock, and refund payment. Cashier processes directly (no approval). */
export async function createReturnWithItems({ orderId, customerId, type, reasonCode, reason, refundMethod, items, processedBy, siteId }) {
  if (!isSupabaseConfigured() || !items?.length) return null

  const refundAmount = items.reduce((s, i) => s + (Number(i.refundAmount) || 0), 0)

  const returnPayload = {
    order_id: orderId,
    customer_id: customerId || null,
    processed_by: processedBy || null,
    type: type || 'partial',
    status: 'completed',
    reason_code: reasonCode || null,
    reason: reason || null,
    refund_amount: refundAmount,
    refund_method: refundMethod || 'original',
    notes: null,
  }

  const { data: ret, error: retErr } = await supabase.from('returns').insert(returnPayload).select().single()
  if (retErr) throw retErr

  const returnItems = items.map((i) => ({
    return_id: ret.id,
    order_item_id: i.orderItemId || null,
    product_id: i.productId || i.product_id,
    variant_id: i.variantId || null,
    quantity: i.qty || i.quantity || 1,
    refund_amount: Number(i.refundAmount) || 0,
    restock: i.restock !== false,
  }))

  const { error: itemsErr } = await supabase.from('return_items').insert(returnItems)
  if (itemsErr) throw itemsErr

  for (const item of items) {
    if (item.restock !== false && (item.productId || item.product_id)) {
      const qty = item.qty ?? item.quantity ?? 1
      await addStock(
        item.productId || item.product_id,
        siteId,
        qty,
        `Return restock: ${ret.return_number || ret.id}`,
        processedBy
      )
    }
  }

  if (refundMethod !== 'store_credit' && refundMethod !== 'exchange' && refundAmount > 0) {
    try {
      await createRefundPayment({ orderId, returnId: ret.id, amount: refundAmount })
    } catch (_) { /* payments may not have return_id yet */ }
  }

  return { ...ret, return_items: returnItems }
}

export async function updateReturnStatus(id, status, processedBy) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('returns').update({ status, processed_by: processedBy }).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  return { id, status }
}
