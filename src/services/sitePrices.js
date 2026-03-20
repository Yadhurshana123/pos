import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchSitePrices(siteId) {
  if (!isSupabaseConfigured() || !siteId) return []
  const { data, error } = await supabase
    .from('site_prices')
    .select('product_id, price')
    .eq('site_id', siteId)
  if (error) return []
  return data || []
}

export async function upsertSitePrice(productId, siteId, price) {
  if (!isSupabaseConfigured() || !productId || !siteId) return null
  const { data, error } = await supabase
    .from('site_prices')
    .upsert({ product_id: productId, site_id: siteId, price: Number(price), updated_at: new Date().toISOString() }, { onConflict: 'product_id,site_id' })
    .select()
    .single()
  if (error) throw error
  return data
}
