import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { ts } from '@/lib/utils'
import { damageLostService, productsService, sitesService, inventoryService } from '@/services'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const TYPES = ['Damage', 'Lost']

export default function DamageManagement() {
  const navigate = useNavigate()
  const { t } = useTheme()
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('All')

  // Fetch data
  const { data: dbProducts = [] } = useQuery({ queryKey: ['products'], queryFn: productsService.fetchProducts })
  const { data: dbSites = [] } = useQuery({ queryKey: ['sites'], queryFn: sitesService.fetchSites })
  const { data: dbEntries = [], refetch } = useQuery({ 
    queryKey: ['damage_lost_entries'], 
    queryFn: () => damageLostService.fetchDamageLostEntries() 
  })

  // Derived entries
  const damageEntries = useMemo(() => dbEntries || [], [dbEntries])
  
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    type: 'Damage',
    outlet: '',
    reason: ''
  })
  
  const [errors, setErrors] = useState({})

  // Validation logic
  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!form.productId) newErrors.productId = 'Product is required'
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!form.type) newErrors.type = 'Type is required'
    if (!form.outlet) newErrors.outlet = 'Outlet is required'
    if (!form.reason || form.reason.trim() === '') newErrors.reason = 'Reason is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      notify('Please fix the errors in the form', 'error')
      return
    }

    const payload = {
      product_id: form.productId,
      quantity: form.quantity,
      type: form.type,
      site_id: form.outlet, // mapped to site_id in DB
      reason: form.reason,
      created_by: currentUser?.id
    }

    try {
      if (editingId) {
        await damageLostService.updateDamageLostEntry(editingId, payload)
        notify('Entry updated successfully', 'success')
      } else {
        await damageLostService.createDamageLostEntry(payload)
        if (isSupabaseConfigured()) {
          const movementType = form.type === 'Damage' ? 'damage' : 'loss'
          await inventoryService.deductStock(
            form.productId,
            form.outlet,
            parseInt(form.quantity),
            movementType,
            form.reason,
            currentUser?.id
          )
          queryClient.invalidateQueries({ queryKey: ['products'] })
        }
        notify('Entry recorded successfully', 'success')
      }
      refetch()
      closeModal()
    } catch (err) {
      notify('Action failed: ' + err.message, 'error')
    }
  }, [form, editingId, validateForm, currentUser, refetch])

  // Handle edit
  const handleEdit = useCallback((entry) => {
    setEditingId(entry.id)
    setForm({
      productId: entry.product_id,
      quantity: entry.quantity,
      type: entry.type,
      outlet: entry.site_id,
      reason: entry.reason
    })
    setShowModal(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      // Logic would call service.delete and then refetch()
      notify('Delete functionality requires service call', 'info')
    }
  }, [])

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false)
    setForm({ productId: '', quantity: '', type: 'Damage', outlet: '', reason: '' })
    setErrors({})
    setEditingId(null)
  }, [])

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (filterType === 'All') return damageEntries
    return damageEntries.filter(e => e.type === filterType)
  }, [damageEntries, filterType])

  // Prepare table rows
  const tableRows = filteredEntries.map(entry => [
    entry.products?.name || 'Unknown',
    entry.quantity.toString(),
    <Badge key={entry.id} label={entry.type} color={entry.type === 'Damage' ? t.red : '#ea580c'} t={t} />,
    new Date(entry.created_at).toLocaleDateString(),
    entry.sites?.name || 'Unknown Store',
    entry.reason,
    <div key={entry.id} style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => handleEdit(entry)} style={{
        background: t.bg3, border: `1px solid ${t.border}`, color: t.text3, cursor: 'pointer',
        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, minWidth: 60
      }}>Edit</button>
      <button onClick={() => handleDelete(entry.id)} style={{
        background: t.red + '20', border: `1px solid ${t.red}`, color: t.red, cursor: 'pointer',
        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, minWidth: 60
      }}>Delete</button>
    </div>
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>🔴 Damage / Lost Inventory</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/inventory')}>📥 Goods Receiving</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/stocktake')}>📋 Stocktake</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/stock-transfer')}>🔄 Transfer Stock</Btn>
          <Btn t={t} onClick={() => {}} disabled>🔴 Damaged/Lost</Btn>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Total Entries</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{damageEntries.length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Damaged Items</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626 ' }}>{damageEntries.filter(e => e.type === 'Damage').length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Lost Items</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ea580c' }}>{damageEntries.filter(e => e.type === 'Lost').length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Total Units</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{damageEntries.reduce((sum, e) => sum + e.quantity, 0)}</div>
        </Card>
      </div>

      {/* Controls */}
      <div className="controls-row" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <Btn onClick={() => setShowModal(true)} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
          ➕ Add Damage / Lost Product
        </Btn>
        
        <Select
          value={filterType}
          onChange={setFilterType}
          options={[{ label: 'All Types', value: 'All' }, { label: 'Damage Only', value: 'Damage' }, { label: 'Lost Only', value: 'Lost' }]}
          t={t}
          label="Filter"
        />
      </div>

      {/* Table */}
      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table 
          cols={['Product Name', 'Qty', 'Type', 'Date', 'Outlet', 'Reason', 'Actions']}
          rows={tableRows}
          empty="No damage or lost entries found"
          t={t}
        />
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editingId ? 'Edit Entry' : 'Add Damage / Lost Entry'} onClose={closeModal} t={t} width={520} subtitle={editingId ? 'Update the damage or lost inventory entry' : 'Create a new damage or lost inventory entry'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Product Select */}
            <div>
              <Select
                label="Product Name"
                value={form.productId}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, productId: val }))
                  setErrors(prev => ({ ...prev, productId: '' }))
                }}
                options={[
                  { label: 'Select a product...', value: '' },
                  ...dbProducts.map(p => ({ label: p.name, value: p.id }))
                ]}
                t={t}
              />
              {errors.productId && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.productId}</div>}
            </div>

            {/* Quantity Input */}
            <div>
              <Input
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, quantity: parseInt(val) || '' }))
                  setErrors(prev => ({ ...prev, quantity: '' }))
                }}
                placeholder="Enter quantity"
                required
                t={t}
              />
              {errors.quantity && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.quantity}</div>}
            </div>

            {/* Type Select */}
            <div>
              <Select
                label="Type"
                value={form.type}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, type: val }))
                  setErrors(prev => ({ ...prev, type: '' }))
                }}
                options={TYPES.map(type => ({ label: type, value: type }))}
                t={t}
              />
              {errors.type && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.type}</div>}
            </div>

            {/* Outlet Select */}
            <div>
              <Select
                label="Outlet"
                value={form.outlet}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, outlet: val }))
                  setErrors(prev => ({ ...prev, outlet: '' }))
                }}
                options={[
                  { label: 'Select outlet...', value: '' },
                  ...dbSites.map(s => ({ label: s.name, value: s.id }))
                ]}
                t={t}
              />
              {errors.outlet && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.outlet}</div>}
            </div>

            {/* Reason Input */}
            <div>
              <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 }}>Reason <span style={{ color: t.red }}>*</span></label>
              <textarea
                value={form.reason}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, reason: e.target.value }))
                  setErrors(prev => ({ ...prev, reason: '' }))
                }}
                placeholder="Describe why this item is damaged or lost..."
                style={{
                  background: t.input,
                  border: `1px solid ${t.border}`,
                  borderRadius: 9,
                  padding: 12,
                  color: t.text,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                  minHeight: 100,
                  resize: 'vertical',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              {errors.reason && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.reason}</div>}
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn onClick={closeModal} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, background: t.bg3, color: t.text3 }}>
                Cancel
              </Btn>
              <Btn onClick={handleSubmit} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
                {editingId ? 'Update Entry' : 'Add Entry'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile styles */}
      <style>{`
        @media (min-width: 640px) {
          .controls-row {
            flex-direction: row !important;
            justify-content: space-between;
            align-items: center;
          }
          [style*="flexDirection: row"]  {
            flex-direction: column !important;
          }
          [data-modal-overlay="true"] {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
