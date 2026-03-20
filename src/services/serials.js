import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/** Register serial numbers when receiving stock */
export async function registerSerials(productId, siteId, serials, variantId = null) {
  if (!isSupabaseConfigured() || !productId || !siteId || !serials?.length) return []
  const rows = serials.map((sn) => ({
    product_id: productId,
    variant_id: variantId,
    site_id: siteId,
    serial_number: String(sn).trim(),
    status: 'in_stock',
    notes: null,
  }))
  const { data, error } = await supabase.from('serial_numbers').insert(rows).select()
  if (error) throw error
  return data || []
}

/** Mark serial as sold (link to order_item) */
export async function markSerialSold(serialId, orderItemId) {
  if (!isSupabaseConfigured() || !serialId || !orderItemId) return null
  const { data, error } = await supabase
    .from('serial_numbers')
    .update({ status: 'sold', order_item_id: orderItemId, updated_at: new Date().toISOString() })
    .eq('id', serialId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Mark serial as returned */
export async function markSerialReturned(serialId) {
  if (!isSupabaseConfigured() || !serialId) return null
  const { data, error } = await supabase
    .from('serial_numbers')
    .update({ status: 'returned', order_item_id: null, updated_at: new Date().toISOString() })
    .eq('id', serialId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Lookup serial number - returns product if found */
export async function lookupSerial(serialNumber) {
  if (!isSupabaseConfigured() || !serialNumber?.trim()) return null
  const { data, error } = await supabase
    .from('serial_numbers')
    .select('id, serial_number, status, product:products(*)')
    .eq('serial_number', String(serialNumber).trim())
    .maybeSingle()
  if (error || !data) return null
  const p = data.product
  return p ? { ...p, serial_id: data.id, serial_status: data.status } : null
}

/** Fetch serials for a product at a site */
export async function fetchSerialsByProduct(productId, siteId, status = null) {
  if (!isSupabaseConfigured() || !productId) return []
  let q = supabase
    .from('serial_numbers')
    .select('id, serial_number, status, order_item_id, created_at')
    .eq('product_id', productId)
  if (siteId) q = q.eq('site_id', siteId)
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

/** Fetch in-stock serials for a product (available to sell) */
export async function fetchInStockSerials(productId, siteId) {
  return fetchSerialsByProduct(productId, siteId, 'in_stock')
}
