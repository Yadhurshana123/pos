import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function signIn(email, password) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    return profile
  }
  return null
}

export async function signUp(email, password, metadata = {}) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
  }
  return null
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

export async function getSession() {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    return profile
  }
  return null
}

export function onAuthStateChange(callback) {
  if (isSupabaseConfigured()) {
    return supabase.auth.onAuthStateChange(callback)
  }
  return { data: { subscription: { unsubscribe: () => {} } } }
}
