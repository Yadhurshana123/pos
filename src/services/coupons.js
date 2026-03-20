import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchCoupons() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
  return null
}

export async function createCoupon(coupon) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('coupons').insert(coupon).select().single()
    if (error) throw error
    return data
  }
  return { id: Date.now(), current_uses: 0, ...coupon }
}

export async function updateCoupon(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  return { id, ...updates }
}

export async function deleteCoupon(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw error
  }
}

export async function validateCoupon(code, cartTotal) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()
    if (error) throw new Error('Invalid coupon code')
    if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('Coupon has expired')
    if (data.max_uses && data.current_uses >= data.max_uses) throw new Error('Coupon usage limit reached')
    if (data.min_order && cartTotal < data.min_order) throw new Error(`Minimum order ${data.min_order} required`)
    return data
  }
  return null
}

export async function incrementCouponUse(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.rpc('increment_coupon_uses', { coupon_id: id })
    if (error) throw error
  }
}
