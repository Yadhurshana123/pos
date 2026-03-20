import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchBanners(venueId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('banners').select('*')
    if (venueId) q = q.eq('venue_id', venueId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  return null
}

export async function createBanner(banner) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('banners').insert(banner).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), ...banner }
}

export async function updateBanner(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  return { id, ...updates }
}

export async function deleteBanner(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
  }
}

export async function toggleBannerActive(id, active) {
  return updateBanner(id, { active })
}
