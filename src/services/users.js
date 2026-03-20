import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchProfiles(filters = {}) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('profiles').select('*')
    if (filters.role) q = q.eq('role', filters.role)
    if (filters.venueId) q = q.eq('venue_id', filters.venueId)
    if (filters.siteId) q = q.eq('site_id', filters.siteId)
    if (filters.active !== undefined) q = q.eq('active', filters.active)
    const { data, error } = await q.order('display_name')
    if (error) throw error
    return data
  }
  return null
}

export async function getProfile(userId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) throw error
    return data
  }
  return null
}

export async function updateProfile(userId, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
    if (error) throw error
    return data
  }
  return { id: userId, ...updates }
}

export async function createStaffMember(profileData) {
  if (isSupabaseConfigured()) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: profileData.email,
      password: profileData.password,
      email_confirm: true,
    })
    if (authError) throw authError
    const { data, error } = await supabase.from('profiles').update({
      display_name: profileData.name,
      role: profileData.role,
      venue_id: profileData.venueId,
      site_id: profileData.siteId,
      phone: profileData.phone,
    }).eq('id', authData.user.id).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), ...profileData }
}

export async function deactivateUser(userId) {
  return updateProfile(userId, { active: false })
}

export async function activateUser(userId) {
  return updateProfile(userId, { active: true })
}
