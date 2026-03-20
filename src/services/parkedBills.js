import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchParkedBills(siteId, cashierId = null) {
  if (!isSupabaseConfigured() || !siteId) return []
  let q = supabase
    .from('parked_bills')
    .select('*')
    .eq('site_id', siteId)
  if (cashierId) q = q.eq('cashier_id', cashierId)
  const { data, error } = await q.order('parked_at', { ascending: false })
  if (error) return []
  return (data || []).map((pb) => ({
    id: pb.id,
    cart: pb.items || [],
    customerId: pb.customer_id,
    ts: pb.parked_at ? new Date(pb.parked_at).toLocaleString() : '',
    notes: pb.notes,
  }))
}

export async function parkBill(siteId, counterId, cashierId, customerId, items, notes) {
  if (!isSupabaseConfigured() || !siteId || !cashierId) return null
  const { data, error } = await supabase
    .from('parked_bills')
    .insert({
      site_id: siteId,
      counter_id: counterId || null,
      cashier_id: cashierId,
      customer_id: customerId || null,
      items: items || [],
      notes: notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteParkedBill(id) {
  if (!isSupabaseConfigured() || !id) return
  await supabase.from('parked_bills').delete().eq('id', id)
}
