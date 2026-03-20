import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchDamageLostEntries(siteId, filters = {}) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('damage_lost_inventory').select('*, products(*), sites(name)').order('created_at', { ascending: false })
    if (siteId) q = q.eq('site_id', siteId)
    if (filters.type) q = q.eq('type', filters.type)
    if (filters.productId) q = q.eq('product_id', filters.productId)
    const { data, error } = await q
    if (error) throw error
    return data
  }
  return null
}

export async function createDamageLostEntry(entry) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('damage_lost_inventory').insert({
      ...entry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), ...entry, created_at: new Date().toISOString() }
}

export async function updateDamageLostEntry(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('damage_lost_inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  return { id, ...updates }
}

export async function deleteDamageLostEntry(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('damage_lost_inventory').delete().eq('id', id)
    if (error) throw error
    return true
  }
  return true
}
