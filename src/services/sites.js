import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchSites() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('sites').select('*').order('name')
    if (error) throw error
    return data
  }
  return []
}

export async function fetchSiteById(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('sites').select('*').eq('id', id).single()
    if (error) throw error
    return data
  }
  return null
}
