import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function fetchCategories() {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createCategory(payload) {
  if (!isSupabaseConfigured()) {
    return { id: `local-${Date.now()}`, ...payload, created_at: new Date().toISOString() }
  }
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id, updates) {
  if (!isSupabaseConfigured()) return { id, ...updates }
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchSubCategories(categoryId = null) {
  if (!isSupabaseConfigured()) return []
  let query = supabase.from('sub_categories').select('*').order('name', { ascending: true })
  if (categoryId) query = query.eq('category_id', categoryId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createSubCategory(payload) {
  if (!isSupabaseConfigured()) return { id: `local-${Date.now()}`, ...payload }
  const { data, error } = await supabase.from('sub_categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateSubCategory(id, updates) {
  if (!isSupabaseConfigured()) return { id, ...updates }
  const { data, error } = await supabase.from('sub_categories').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSubCategory(id) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('sub_categories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchAttributes() {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase.from('attributes').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchSubCategoryAttributes(subCategoryId) {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('subcategory_attributes')
    .select('attribute_id, attributes(name)')
    .eq('subcategory_id', subCategoryId)
  if (error) throw error
  return data
}

export async function saveSubCategoryAttributes(subCategoryId, attributeIds) {
  if (!isSupabaseConfigured()) return
  // Delete existing
  await supabase.from('subcategory_attributes').delete().eq('subcategory_id', subCategoryId)
  // Insert new
  if (attributeIds && attributeIds.length > 0) {
    const { error } = await supabase.from('subcategory_attributes').insert(
      attributeIds.map(aid => ({ subcategory_id: subCategoryId, attribute_id: aid }))
    )
    if (error) throw error
  }
}

export async function createAttribute(name) {
  if (!isSupabaseConfigured()) return { id: Date.now(), name }
  const { data, error } = await supabase.from('attributes').insert([{ name }]).select().single()
  if (error) throw error
  return data
}
