import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/** Record payment(s) for an order. For split: pass array of { amount, method, details } */
export async function createPayments(orderId, payments) {
  if (!isSupabaseConfigured() || !orderId || !payments?.length) return []
  const rows = payments.map((p) => ({
    order_id: orderId,
    amount: Number(p.amount),
    method: p.method || 'cash',
    reference_id: p.referenceId || null,
    details: p.details || {},
  }))
  const { data, error } = await supabase.from('payments').insert(rows).select()
  if (error) throw error
  return data || []
}

/** Record refund payment for a return. Links to original order and return. */
export async function createRefundPayment({ orderId, returnId, amount }) {
  if (!isSupabaseConfigured() || !orderId || !amount) return null
  const row = {
    order_id: orderId,
    amount: Number(amount),
    method: 'refund',
    reference_id: returnId || null,
    return_id: returnId || null,
    details: returnId ? { return_id: returnId } : {},
  }
  const { data, error } = await supabase.from('payments').insert(row).select().single()
  if (error) throw error
  return data
}
