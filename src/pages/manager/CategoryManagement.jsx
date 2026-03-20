import { useState, useEffect, useCallback } from 'react'
import { Btn, Card, Modal, Badge } from '@/components/ui'
import { notify } from '@/components/shared'
import { fetchCategories, createCategory, updateCategory, deleteCategory, fetchSubCategories, createSubCategory, updateSubCategory, deleteSubCategory, fetchAttributes, createAttribute, saveSubCategoryAttributes } from '@/services/categories'

// ─── common chip-tag input ────────────────────────────────────────────────────
function ChipInput({ t, label, values = [], onChange, presets = [], placeholder }) {
  const [draft, setDraft] = useState('')
  const add = (val) => {
    const v = val.trim()
    if (!v || values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }
  const remove = (v) => onChange(values.filter(x => x !== v))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      {presets.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {presets.map(p => {
            const sel = values.includes(p)
            return (
              <button key={p} type="button"
                onClick={() => sel ? remove(p) : onChange([...values, p])}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${sel ? t.accent : t.border}`,
                  background: sel ? t.accent + '20' : 'transparent',
                  color: sel ? t.accent : t.text3,
                }}>
                {p}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(draft) } }}
          placeholder={placeholder || `Type & press Enter…`}
          style={{
            flex: 1, background: t.input, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: '8px 12px', color: t.text, fontSize: 13, outline: 'none'
          }}
        />
        <button type="button" onClick={() => add(draft)}
          style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          +
        </button>
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {values.map(v => (
            <div key={v} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: t.bg3, border: `1px solid ${t.border}`,
              borderRadius: 16, padding: '3px 10px', fontSize: 11, color: t.text
            }}>
              {v}
              <button type="button" onClick={() => remove(v)}
                style={{ background: 'none', border: 'none', color: t.red, cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── preset options ────────────────────────────────────────────────────────────
const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS', '6', '7', '8', '9', '10', '11', '12']
const COLOR_PRESETS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Grey', 'Navy', 'Purple', 'Orange']
const MATERIAL_PRESETS = ['Cotton', 'Polyester', 'Nylon', 'Wool', 'Denim', 'Leather', 'Fleece', 'Mesh', 'Spandex']

const blank = { category: '', subcategory: '', attribute_config: ['Size', 'Color', 'Material', 'Length'], custom_attributes: {} }

function buildCombinedTree(cats, subs) {
  const roots = (cats || []).map(c => ({ ...c, children: [] }))
  const map = {}
  roots.forEach(r => { map[r.id] = r })
    ; (subs || []).forEach(s => {
      if (map[s.category_id]) map[s.category_id].children.push(s)
    })
  return roots
}

const iStyle = (t) => ({
  width: '100%', boxSizing: 'border-box', background: t.input, border: `1px solid ${t.border}`,
  borderRadius: 9, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit'
})

const fieldLabel = (txt, t) => (
  <label style={{ fontSize: 11, fontWeight: 800, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 }}>{txt}</label>
)

const CategoryForm = ({ f, onChange, isEdit = false, target = null, t, allCats, attributes, setAllAttrs, submitting, handleSave, setShowAdd, setEditTarget }) => {
  const styles = iStyle(t)
  const [customAttr, setCustomAttr] = useState('')

  const toggleAttr = (attrName) => {
    const next = f.attribute_config.includes(attrName)
      ? f.attribute_config.filter(a => a !== attrName)
      : [...f.attribute_config, attrName]
    onChange({ ...f, attribute_config: next })
  }

  // Use only from the table as requested
  const finalPool = (attributes || []).map(a => a.name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          {fieldLabel('Category *', t)}
          <input
            value={f.category}
            onChange={e => onChange({ ...f, category: e.target.value })}
            placeholder="e.g. Dress"
            style={styles}
            list="cat-datalist"
            disabled={isEdit && target?.category_id}
          />
          <datalist id="cat-datalist">
            {allCats.filter(c => !c.category_id).map(c => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>
        <div>
          {fieldLabel('Subcategory', t)}
          <input
            value={f.subcategory}
            onChange={e => onChange({ ...f, subcategory: e.target.value })}
            placeholder="e.g. Scarf"
            style={styles}
            disabled={isEdit && !target?.category_id}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fieldLabel('Attribute Options (Select to enable)', t)}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {finalPool.map(attrName => {
            const isPredefined = (attributes || []).some(a => a.name === attrName)
            return (
              <label key={attrName} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: isPredefined ? t.text : t.accent }}>
                <input type="checkbox" checked={f.attribute_config.includes(attrName)} onChange={() => toggleAttr(attrName)} />
                {attrName}
              </label>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input
            value={customAttr}
            onChange={e => setCustomAttr(e.target.value)}
            placeholder="Add custom attribute (e.g. Occasion)"
            style={{ ...styles, flex: 1 }}
          />
          <Btn t={t} onClick={async () => {
            if (customAttr.trim()) {
              const val = customAttr.trim()
              if (!finalPool.includes(val)) {
                try {
                  const created = await createAttribute(val)
                  setAllAttrs(p => [...p, created])
                  toggleAttr(val)
                } catch (e) { notify('Error creating attribute: ' + e.message, 'error') }
              } else {
                toggleAttr(val)
              }
              setCustomAttr('')
            }
          }}>Add</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 10 }}>
        <Btn t={t} variant="ghost" onClick={() => isEdit ? setEditTarget(null) : setShowAdd(false)} style={{ flex: 1 }}>Cancel</Btn>
        <Btn t={t} onClick={() => handleSave(f, target)} disabled={!f.category.trim() || submitting} style={{ flex: 2 }}>
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : '✅ Add Entry'}
        </Btn>
      </div>
    </div>
  )
}

export const CategoryManagement = ({ t, addAudit, currentUser }) => {
  const [allCats, setAllCats] = useState([])
  const [allSubs, setAllSubs] = useState([])
  const [allAttrs, setAllAttrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Forms
  const [addForm, setAddForm] = useState(blank)
  const [editForm, setEditForm] = useState(blank)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, subs, attrs] = await Promise.all([
        fetchCategories(),
        fetchSubCategories(),
        fetchAttributes()
      ])
      setAllCats(cats || [])
      setAllSubs(subs || [])
      setAllAttrs(attrs || [])
    } catch (e) {
      notify('Failed to load: ' + (e.message || e), 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const tree = buildCombinedTree(allCats, allSubs)

  const handleSave = async (f, target = null) => {
    if (!f.category.trim()) { notify('Category name is required', 'error'); return }

    setSubmitting(true)

    try {
      if (target) {
        // Edit mode
        const isSub = !!target.category_id
        const updates = {
          name: isSub ? f.subcategory.trim() : f.category.trim(),
          attribute_config: f.attribute_config,
        }
        if (isSub) {
          const updated = await updateSubCategory(target.id, updates)
          // Handle normalized attributes
          const selectedAttrIds = allAttrs.filter(a => f.attribute_config.includes(a.name)).map(a => a.id)
          await saveSubCategoryAttributes(target.id, selectedAttrIds)

          setAllSubs(prev => prev.map(s => s.id === target.id ? { ...s, ...updated } : s))
        } else {
          const updated = await updateCategory(target.id, updates)
          setAllCats(prev => prev.map(c => c.id === target.id ? { ...c, ...updated } : c))
        }
        notify('Updated!', 'success')
        addAudit?.(currentUser, 'Category Updated', 'Categories', updates.name)
        setEditTarget(null)
      } else {
        // Add mode
        let parent = allCats.find(c => c.name.toLowerCase() === f.category.trim().toLowerCase())
        if (!parent) {
          parent = await createCategory({
            name: f.category.trim(),
            attribute_config: f.attribute_config,
          })
          setAllCats(prev => [...prev, parent])
        }

        if (f.subcategory.trim()) {
          const sub = await createSubCategory({
            name: f.subcategory.trim(),
            category_id: parent.id,
            attribute_config: f.attribute_config,
          })

          // Handle normalized attributes
          const selectedAttrIds = allAttrs.filter(a => f.attribute_config.includes(a.name)).map(a => a.id)
          await saveSubCategoryAttributes(sub.id, selectedAttrIds)

          setAllSubs(prev => [...prev, sub])
          addAudit?.(currentUser, 'Subcategory Created', 'Categories', `${f.subcategory.trim()} under ${f.category.trim()}`)
        } else {
          // If no subcategory, update parent with selected attributes
          const updated = await updateCategory(parent.id, {
            attribute_config: f.attribute_config,
          })
          setAllCats(prev => prev.map(c => c.id === parent.id ? { ...c, ...updated } : c))
          addAudit?.(currentUser, 'Category Updated', 'Categories', f.category.trim())
        }
        notify('Saved successfully!', 'success')
        // Preserve attribute selection for next addition as requested
        setAddForm(prev => ({ ...blank, attribute_config: prev.attribute_config }))
        setShowAdd(false)
      }
    } catch (e) {
      notify('Error: ' + (e.message || e), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const isSub = !!deleteTarget.category_id
      if (isSub) {
        await deleteSubCategory(deleteTarget.id)
        setAllSubs(prev => prev.filter(s => s.id !== deleteTarget.id))
      } else {
        await deleteCategory(deleteTarget.id)
        setAllCats(prev => prev.filter(c => c.id !== deleteTarget.id))
        setAllSubs(prev => prev.filter(s => s.category_id !== deleteTarget.id))
      }
      notify('Deleted', 'warning')
      addAudit?.(currentUser, 'Category Deleted', 'Categories', deleteTarget.name)
      setDeleteTarget(null)
    } catch (e) {
      notify('Error: ' + (e.message || e), 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, margin: '0 20px' }}>


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>🗂️ Category Management</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 3 }}>View and manage product categories</div>
        </div>
      </div>

      <Card t={t} style={{ padding: 0 }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>📋 Existing Categories</div>
          <Btn t={t} size="sm" onClick={() => setShowAdd(true)}>+ Add Category Entry</Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: t.text3, padding: 30 }}>Loading…</div>
        ) : allCats.length === 0 && allSubs.length === 0 ? (
          <div style={{ textAlign: 'center', color: t.text3, padding: 30 }}>No categories found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: t.bg2, borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>Categories</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>Sub category</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>Attributes</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right', fontSize: 11, fontWeight: 900, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = []
                  const tree = buildCombinedTree(allCats, allSubs)
                  tree.forEach(cat => {
                    if (cat.children && cat.children.length > 0) {
                      cat.children.forEach(sub => {
                        rows.push({ id: sub.id, catName: cat.name, subName: sub.name, raw: sub, pName: cat.name })
                      })
                    } else {
                      rows.push({ id: cat.id, catName: cat.name, subName: '—', raw: cat, pName: cat.name })
                    }
                  })

                  const cellInputStyle = {
                    width: '100%',
                    background: t.input,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: t.text,
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }

                  const formatAttrs = (r) => {
                    const cfg = r.attribute_config || []
                    if (cfg.length === 0) return 'No attributes defined'
                    return cfg.join(' | ')
                  }

                  return rows.map(row => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: '10px 18px', width: '150px' }}>
                        <input readOnly value={row.catName} style={{ ...cellInputStyle, fontWeight: 700, background: 'transparent', border: 'none' }} />
                      </td>
                      <td style={{ padding: '10px 18px', width: '150px' }}>
                        <input readOnly value={row.subName} style={{ ...cellInputStyle, color: row.subName === '—' ? t.text3 : t.text }} />
                      </td>
                      <td style={{ padding: '10px 18px' }}>
                        <input readOnly value={formatAttrs(row.raw)} style={cellInputStyle} />
                      </td>
                      <td style={{ padding: '10px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <Btn t={t} variant="ghost" size="sm" onClick={() => {
                            const isSub = !!row.raw.category_id
                            setEditTarget(row.raw)
                            setEditForm({
                              category: row.pName,
                              subcategory: isSub ? row.raw.name : '',
                              attribute_config: row.raw.attribute_config || ['Size', 'Color', 'Material', 'Length'],
                              custom_attributes: row.raw.custom_attributes || {}
                            })
                          }}>Edit</Btn>
                          <Btn t={t} variant="danger" size="sm" onClick={() => setDeleteTarget(row.raw)}>Del</Btn>
                        </div>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      {showAdd && (
        <Modal t={t} title="Add Category Entry" onClose={() => setShowAdd(false)}>
          <CategoryForm
            f={addForm}
            onChange={setAddForm}
            t={t}
            allCats={allCats}
            attributes={allAttrs}
            setAllAttrs={setAllAttrs}
            submitting={submitting}
            handleSave={handleSave}
            setShowAdd={setShowAdd}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal t={t} title={`Edit ${editTarget.category_id ? 'Subcategory' : 'Category'}`} onClose={() => setEditTarget(null)}>
          <CategoryForm
            f={editForm}
            onChange={setEditForm}
            isEdit
            target={editTarget}
            t={t}
            allCats={allCats}
            attributes={allAttrs}
            setAllAttrs={setAllAttrs}
            submitting={submitting}
            handleSave={handleSave}
            setEditTarget={setEditTarget}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal t={t} title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <div style={{ fontSize: 14, color: t.text, marginBottom: 16 }}>Delete <strong>{deleteTarget.name}</strong>? {!deleteTarget.category_id && "This will delete all subcategories too."}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn t={t} variant="ghost" onClick={() => setDeleteTarget(null)} style={{ flex: 1 }}>Cancel</Btn>
            <Btn t={t} variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>Delete</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CategoryManagement
