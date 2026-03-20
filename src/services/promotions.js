import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchActivePromotions() {
  if (!isSupabaseConfigured()) return []
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .lte('start_date', now)
    .gte('end_date', now)
  if (error) return []
  return data || []
}

export async function fetchPromotions() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase.from('promotions').select('*').order('start_date', { ascending: false })
  if (error) return []
  return data || []
}

export async function createPromotion(promo) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase.from('promotions').insert(promo).select().single()
  if (error) throw error
  return data
}

export async function updatePromotion(id, updates) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase.from('promotions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePromotion(id) {
  if (!isSupabaseConfigured()) return
  await supabase.from('promotions').delete().eq('id', id)
}
