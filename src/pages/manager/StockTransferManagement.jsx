import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { ts } from '@/lib/utils'
import { inventoryService, productsService, sitesService } from '@/services'
import { useQuery } from '@tanstack/react-query'

const STATUSES = ['pending', 'in-transit', 'completed', 'cancelled']

export default function StockTransferManagement() {
  const navigate = useNavigate()
  const { t } = useTheme()
  const { currentUser } = useAuth()
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')

  // Fetch data
  const { data: dbProducts = [] } = useQuery({ queryKey: ['products'], queryFn: productsService.fetchProducts })
  const { data: dbSites = [] } = useQuery({ queryKey: ['sites'], queryFn: sitesService.fetchSites })
  const { data: movements = [], refetch: refetchMovements } = useQuery({ 
    queryKey: ['inventory_movements', 'transfer'], 
    queryFn: () => inventoryService.fetchMovements(null, null).then(data => data.filter(m => m.movement_type === 'transfer'))
  })

  // Derived movements
  const transferItems = useMemo(() => movements || [], [movements])
  
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    fromOutlet: '',
    toOutlet: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState({})

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!form.productId) newErrors.productId = 'Product is required'
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!form.fromOutlet) newErrors.fromOutlet = 'From outlet is required'
    if (!form.toOutlet) newErrors.toOutlet = 'To outlet is required'
    if (form.fromOutlet === form.toOutlet) newErrors.toOutlet = 'Cannot transfer to same outlet'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      notify('Please fix the errors in the form', 'error')
      return
    }

    const product = dbProducts.find(p => p.id === form.productId)
    if (!product) {
      notify('Product not found', 'error')
      return
    }

    try {
      await inventoryService.transferStock(
        form.productId,
        form.fromOutlet, // site_id
        form.toOutlet,   // site_id
        form.quantity,
        form.notes,
        currentUser?.id
      )
      
      notify(`Transfer initiated: ${form.quantity}× ${product.name}`, 'success')
      refetchMovements()
      
      // Reset
      setForm({ productId: '', quantity: '', fromOutlet: '', toOutlet: '', notes: '' })
      setErrors({})
      setShowModal(false)
      setEditingId(null)
    } catch (err) {
      notify('Failed to initiate transfer: ' + err.message, 'error')
    }
  }, [form, editingId, validateForm, currentUser, dbProducts, refetchMovements])

  // Handle edit
  const handleEdit = useCallback((transfer) => {
    setEditingId(transfer.id)
    setForm({
      productId: transfer.productId,
      quantity: transfer.quantity,
      fromOutlet: transfer.fromOutlet,
      toOutlet: transfer.toOutlet,
      notes: transfer.notes || ''
    })
    setShowModal(true)
  }, [])

  // Update status (Note: Currently movements are read-only, status updates would need a service)
  const updateStatus = useCallback((id, newStatus) => {
    // This would call a service and then refetch
    notify(`Status update to ${newStatus} is handled on the backend`, 'info')
  }, [])

  // Handle delete
  const handleDelete = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this transfer?')) {
      // Call service and refetch
      notify('Delete functionality to be implemented in service', 'info')
    }
  }, [])

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false)
    setForm({ productId: '', quantity: '', fromOutlet: '', toOutlet: '', notes: '' })
    setErrors({})
    setEditingId(null)
  }, [])

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    if (filterStatus === 'All') return transferItems
    // Note: movement record might not have 'status' directly in the same way mock did
    // Mapping movement type or other fields if needed
    return transferItems.filter(t => t.status === filterStatus)
  }, [transferItems, filterStatus])

  // Table rows
  const tableRows = filteredTransfers.map(transfer => [
    transfer.product?.name || 'Unknown Product',
    transfer.quantity.toString(),
    transfer.from_site?.name || 'External/New',
    transfer.to_site?.name || 'External/Loss',
    new Date(transfer.created_at).toLocaleDateString(),
    <Badge key={transfer.id} label={transfer.movement_type} color={
      transfer.movement_type === 'transfer' ? '#3b82f6' : '#6b7280'
    } t={t} />,
    <div key={transfer.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={() => handleEdit(transfer)} style={{
        background: t.bg3, border: `1px solid ${t.border}`, color: t.text3, cursor: 'pointer',
        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, minWidth: 60
      }}>View</button>
    </div>
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>🔄 Stock Transfer</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/inventory')}>📥 Goods Receiving</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/stocktake')}>📋 Stocktake</Btn>
          <Btn t={t} onClick={() => {}} disabled>🔄 Transfer Stock</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/damage-lost')}>🔴 Damaged/Lost</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Total Transfers</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{transferItems.length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{transferItems.filter(t => t.status === 'pending').length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>In Transit</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6' }}>{transferItems.filter(t => t.status === 'in-transit').length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{transferItems.filter(t => t.status === 'completed').length}</div>
        </Card>
      </div>

      {/* Controls */}
      <div className="controls-row" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <Btn onClick={() => setShowModal(true)} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
          ➕ New Transfer
        </Btn>
        
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { label: 'All Status', value: 'All' },
            { label: 'Pending', value: 'pending' },
            { label: 'In Transit', value: 'in-transit' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' }
          ]}
          t={t}
          label="Filter"
        />
      </div>

      {/* Table */}
      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table 
          cols={['Product Name', 'Qty', 'From', 'To', 'Date', 'Status', 'Actions']}
          rows={tableRows}
          empty="No stock transfers found"
          t={t}
        />
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal 
          title={editingId ? 'Edit Transfer' : 'New Stock Transfer'} 
          onClose={closeModal} 
          t={t} 
          width={520}
          subtitle={editingId ? 'Update the transfer details' : 'Create a new stock transfer'}
        >
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
                  ...dbProducts.map(p => ({ label: `${p.name} (SKU: ${p.sku})`, value: p.id }))
                ]}
                t={t}
              />
              {errors.productId && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.productId}</div>}
            </div>

            {/* Quantity */}
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

            {/* From Outlet */}
            <div>
              <Select
                label="From Outlet"
                value={form.fromOutlet}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, fromOutlet: val }))
                  setErrors(prev => ({ ...prev, fromOutlet: '' }))
                }}
                options={[
                  { label: 'Select outlet...', value: '' },
                  ...dbSites.map(s => ({ label: s.name, value: s.id }))
                ]}
                t={t}
              />
              {errors.fromOutlet && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.fromOutlet}</div>}
            </div>

            {/* To Outlet */}
            <div>
              <Select
                label="To Outlet"
                value={form.toOutlet}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, toOutlet: val }))
                  setErrors(prev => ({ ...prev, toOutlet: '' }))
                }}
                options={[
                  { label: 'Select outlet...', value: '' },
                  ...dbSites.map(s => ({ label: s.name, value: s.id }))
                ]}
                t={t}
              />
              {errors.toOutlet && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.toOutlet}</div>}
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 }}>Notes (Optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this transfer..."
                style={{
                  background: t.input,
                  border: `1px solid ${t.border}`,
                  borderRadius: 9,
                  padding: 12,
                  color: t.text,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                  minHeight: 80,
                  resize: 'vertical',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn onClick={closeModal} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, background: t.bg3, color: t.text3 }}>
                Cancel
              </Btn>
              <Btn onClick={handleSubmit} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
                {editingId ? 'Update Transfer' : 'Create Transfer'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @media (min-width: 640px) {
          .controls-row {
            flex-direction: row !important;
            justify-content: space-between;
            align-items: center;
          }
          [style*="flexDirection: row"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
