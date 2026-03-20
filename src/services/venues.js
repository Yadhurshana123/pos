import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/** Fetch all venues with their sites (for venue/site selection) */
export async function fetchVenuesWithSites() {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Main Stadium',
        address: '123 Stadium Road, London, UK',
        sites: [
          { id: 'b0000000-0000-0000-0000-000000000001', name: 'Main Merchandise Store', type: 'retail' },
        ],
      },
    ]
  }
  try {
    const { data: venues, error: vErr } = await supabase
      .from('venues')
      .select('id, name, address')
      .eq('status', 'active')
      .order('name')
    if (vErr) throw vErr
    if (!venues?.length) return []

    const { data: sites, error: sErr } = await supabase
      .from('sites')
      .select('id, venue_id, name, type')
      .in('venue_id', venues.map(v => v.id))
      .eq('status', 'active')
      .order('name')
    if (sErr) throw sErr

    const siteMap = {}
    ;(sites || []).forEach(s => {
      if (!siteMap[s.venue_id]) siteMap[s.venue_id] = []
      siteMap[s.venue_id].push({ id: s.id, name: s.name, type: s.type })
    })

    return venues.map(v => ({ ...v, sites: siteMap[v.id] || [] }))
  } catch (err) {
    console.warn('[venues] fetchVenuesWithSites:', err?.message)
    return []
  }
}
