import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isUuid } from '@/lib/utils'

/** inventory_movements.created_by is UUID → auth.users; omit invalid demo IDs */
const actorId = (id) => (isUuid(id) ? id : null)

export async function fetchInventory(siteId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('inventory').select('*, products(*), sites(name)')
    if (siteId) q = q.eq('site_id', siteId)
    const { data, error } = await q.order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }
  return null
}

/** Receive stock: add quantity to inventory (creates row if needed) */
export async function receiveStock(productId, siteId, quantity, notes, userId) {
  if (!isSupabaseConfigured()) return null
  const { data: existing } = await supabase.from('inventory')
    .select('id, stock_on_hand')
    .match({ product_id: productId, site_id: siteId })
    .maybeSingle()
  const newQty = (existing?.stock_on_hand ?? 0) + quantity
  const { error: mvError } = await supabase.from('inventory_movements').insert({
    product_id: productId, to_site_id: siteId, quantity, movement_type: 'receive', notes, created_by: actorId(userId),
  })
  if (mvError) throw mvError
  if (existing) {
    const { data, error } = await supabase.from('inventory')
      .update({ stock_on_hand: newQty, updated_at: new Date().toISOString() })
      .match({ product_id: productId, site_id: siteId })
      .select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('inventory')
    .insert({ product_id: productId, site_id: siteId, stock_on_hand: newQty })
    .select().single()
  if (error) throw error
  return data
}

/** Deduct stock (sale, damage, loss): reduce inventory */
export async function deductStock(productId, siteId, quantity, type, notes, userId) {
  if (!isSupabaseConfigured()) return null
  const qty = -Math.abs(quantity)
  const { data: existing } = await supabase.from('inventory')
    .select('stock_on_hand')
    .match({ product_id: productId, site_id: siteId })
    .maybeSingle()
  if (!existing) throw new Error('No inventory record for product at this site')
  const newQty = Math.max(0, existing.stock_on_hand + qty)
  const { error: mvError } = await supabase.from('inventory_movements').insert({
    product_id: productId, to_site_id: siteId, quantity: qty, movement_type: type, notes, created_by: actorId(userId),
  })
  if (mvError) throw mvError
  const { data, error } = await supabase.from('inventory')
    .update({ stock_on_hand: newQty, updated_at: new Date().toISOString() })
    .match({ product_id: productId, site_id: siteId })
    .select().single()
  if (error) throw error
  return data
}

/** Add stock (return restock) */
export async function addStock(productId, siteId, quantity, notes, userId) {
  return receiveStock(productId, siteId, quantity, notes || 'Return restock', userId)
}

export async function adjustStock(productId, siteId, quantity, type, notes, userId) {
  if (isSupabaseConfigured()) {
    const { error: mvError } = await supabase.from('inventory_movements').insert({
      product_id: productId, to_site_id: siteId, quantity, movement_type: type, notes, created_by: actorId(userId),
    })
    if (mvError) throw mvError
    const { data: existing } = await supabase.from('inventory')
      .select('id')
      .match({ product_id: productId, site_id: siteId })
      .maybeSingle()
    if (existing) {
      const { data, error } = await supabase.from('inventory')
        .update({ stock_on_hand: quantity, updated_at: new Date().toISOString() })
        .match({ product_id: productId, site_id: siteId })
        .select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('inventory')
      .insert({ product_id: productId, site_id: siteId, stock_on_hand: quantity })
      .select().single()
    if (error) throw error
    return data
  }
  return null
}

export async function transferStock(productId, fromSiteId, toSiteId, quantity, notes, userId) {
  if (isSupabaseConfigured()) {
    // 1. Record the movement
    const { error: mvError } = await supabase.from('inventory_movements').insert({
      product_id: productId, 
      from_site_id: fromSiteId, 
      to_site_id: toSiteId,
      quantity, 
      movement_type: 'transfer', 
      notes, 
      created_by: actorId(userId),
    })
    if (mvError) throw mvError

    // 2. Deduct from source
    const { error: decError } = await supabase.rpc('increment_inventory', {
      p_product_id: productId,
      p_site_id: fromSiteId,
      p_amount: -quantity
    })
    
    // Fallback if RPC doesn't exist (temporary manual update)
    if (decError) {
      const { data: currentFrom } = await supabase.from('inventory')
        .select('stock_on_hand')
        .match({ product_id: productId, site_id: fromSiteId })
        .single()
      
      if (currentFrom) {
        await supabase.from('inventory')
          .update({ stock_on_hand: currentFrom.stock_on_hand - quantity })
          .match({ product_id: productId, site_id: fromSiteId })
      }
    }

    // 3. Add to destination
    const { error: incError } = await supabase.rpc('increment_inventory', {
      p_product_id: productId,
      p_site_id: toSiteId,
      p_amount: quantity
    })

    if (incError) {
      const { data: currentTo } = await supabase.from('inventory')
        .select('stock_on_hand')
        .match({ product_id: productId, site_id: toSiteId })
        .single()
      
      if (currentTo) {
        await supabase.from('inventory')
          .update({ stock_on_hand: currentTo.stock_on_hand + quantity })
          .match({ product_id: productId, site_id: toSiteId })
      } else {
        // Create entry if it doesn't exist
        await supabase.from('inventory').insert({
          product_id: productId,
          site_id: toSiteId,
          stock_on_hand: quantity
        })
      }
    }
    
    return true
  }
  return null
}

export async function fetchMovements(productId, siteId) {
  if (!isSupabaseConfigured()) return null
  let q = supabase.from('inventory_movements').select(`
    *,
    product:products(name, emoji),
    from_site:sites!inventory_movements_from_site_id_fkey(name),
    to_site:sites!inventory_movements_to_site_id_fkey(name)
  `)
  if (productId) q = q.eq('product_id', productId)
  if (siteId) q = q.or(`from_site_id.eq.${siteId},to_site_id.eq.${siteId}`)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return data
}

export async function fetchTransfers() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, products(*), from_site:sites!inventory_movements_from_site_id_fkey(name), to_site:sites!inventory_movements_to_site_id_fkey(name)')
    .eq('movement_type', 'transfer')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
