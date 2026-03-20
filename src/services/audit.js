import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ts } from '@/lib/utils'

function isValidUuid(val) {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

export async function logAudit(user, action, module, details = '') {
  if (isSupabaseConfigured()) {
    const uid = isValidUuid(user?.id) ? user.id : null
    const { error } = await supabase.from('audit_logs').insert({
      user_id: uid, user_name: user?.name || 'System', user_role: user?.role || 'system',
      action, module, details,
    })
    if (error) console.error('Audit log failed:', error)
  }
  return {
    id: `LOG-${Date.now()}`, user: user?.name || 'System', role: user?.role || 'system',
    action, module, details, timestamp: ts(),
  }
}

export async function fetchAuditLogs(filters = {}) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('audit_logs').select('*')
    if (filters.module) q = q.eq('module', filters.module)
    if (filters.userId) q = q.eq('user_id', filters.userId)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    return data
  }
  return null
}
