import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function openSession(siteId, counterId, userId, openingFloat) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('cash_sessions').insert({
      site_id: siteId, counter_id: counterId, opened_by: userId, opening_float: openingFloat,
    }).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), site_id: siteId, counter_id: counterId, opened_by: userId, opening_float: openingFloat, status: 'open', opened_at: new Date().toISOString() }
}

export async function closeSession(sessionId, closingCash, expectedCash, userId) {
  const variance = closingCash - expectedCash
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('cash_sessions').update({
      closed_by: userId, closing_cash: closingCash, expected_cash: expectedCash, variance, status: 'closed', closed_at: new Date().toISOString(),
    }).eq('id', sessionId).select().single()
    if (error) throw error
    return data
  }
  return { id: sessionId, closing_cash: closingCash, expected_cash: expectedCash, variance, status: 'closed' }
}

export async function recordCashMovement(sessionId, type, amount, referenceId, notes, userId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('cash_movements').insert({
      session_id: sessionId, type, amount, reference_id: referenceId, notes, created_by: userId,
    }).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), session_id: sessionId, type, amount }
}

export async function getActiveSession(counterId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('cash_sessions').select('*').eq('counter_id', counterId).eq('status', 'open').maybeSingle()
    if (error) throw error
    return data
  }
  return null
}
