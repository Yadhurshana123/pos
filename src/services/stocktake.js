import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { adjustStock } from './inventory'

export async function fetchStocktakeHistory(siteId) {
  if (isSupabaseConfigured()) {
    let q = supabase.from('inventory_movements')
      .select('*, products(name, emoji)')
      .eq('movement_type', 'adjust')
      .order('created_at', { ascending: false })
    
    if (siteId) q = q.eq('to_site_id', siteId)
    
    const { data, error } = await q.limit(100)
    if (error) throw error
    return data
  }
  return []
}

export async function submitStocktake(items, siteId, userId) {
  if (!isSupabaseConfigured()) return null
  
  const results = []
  for (const item of items) {
    if (item.variance !== 0) {
      const data = await adjustStock(
        item.productId, 
        siteId, 
        item.physicalCount, 
        'adjust', 
        `Stocktake: ${item.notes || 'No notes'}`, 
        userId
      )
      results.push(data)
    }
  }
  return results
}
