import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchSettings(venueId, siteId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('settings').select('*')
    if (venueId) q = q.eq('venue_id', venueId)
    if (siteId) q = q.eq('site_id', siteId)
    const { data, error } = await q
    if (error) throw error
    return data.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
  }
  return null
}

export async function getSetting(key, venueId, siteId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('settings').select('value').eq('key', key)
    if (venueId) q = q.eq('venue_id', venueId)
    if (siteId) q = q.eq('site_id', siteId)
    const { data, error } = await q.single()
    if (error && error.code !== 'PGRST116') throw error
    return data?.value ?? null
  }
  return null
}

export async function upsertSetting(key, value, venueId = null, siteId = null) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('settings').upsert(
      { key, value, venue_id: venueId, site_id: siteId, updated_at: new Date().toISOString() },
      { onConflict: 'venue_id,site_id,key' }
    ).select().single()
    if (error) throw error
    return data
  }
  return { key, value }
}

export async function deleteSetting(key, venueId, siteId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('settings').delete().eq('key', key)
    if (venueId) q = q.eq('venue_id', venueId)
    if (siteId) q = q.eq('site_id', siteId)
    const { error } = await q
    if (error) throw error
  }
}
