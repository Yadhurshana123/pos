import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { ts } from '@/lib/utils'
import { stocktakeService, productsService, sitesService, inventoryService } from '@/services'
import { useQuery } from '@tanstack/react-query'

// Stocktake logic

export default function StocktakeManagement() {
  const navigate = useNavigate()
  const { t } = useTheme()
  const { currentUser } = useAuth()
  
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [stocktakeItems, setStocktakeItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterVariance, setFilterVariance] = useState('All')
  const [hasUrgentRequest, setHasUrgentRequest] = useState(true) // Simulate urgent request

  // Fetch data
  const { data: dbProducts = [] } = useQuery({ queryKey: ['products'], queryFn: productsService.fetchProducts })
  const { data: dbSites = [] } = useQuery({ queryKey: ['sites'], queryFn: sitesService.fetchSites })
  const { data: siteInventory = [], refetch: refetchInventory } = useQuery({
    queryKey: ['inventory', selectedSiteId],
    queryFn: () => inventoryService.fetchInventory(selectedSiteId),
    enabled: !!selectedSiteId
  })

  // Initialize stocktake items when inventory loads - only if they haven't been loaded for this site yet
  useEffect(() => {
    if (siteInventory && siteInventory.length > 0) {
      // Basic check to see if we already have items for this site to avoid reset on every background refetch
      const currentProductIds = stocktakeItems.map(i => i.productId).sort().join(',')
      const newProductIds = siteInventory.map(i => i.product_id).sort().join(',')
      
      if (currentProductIds !== newProductIds) {
        setStocktakeItems(siteInventory.map(inv => ({
          id: inv.id,
          productId: inv.product_id,
          productName: inv.products?.name || 'Unknown',
          emoji: inv.products?.emoji || '📦',
          systemStock: inv.stock_on_hand || 0,
          physicalCount: inv.stock_on_hand || 0,
          variance: 0,
          notes: ''
        })))
      }
    } else if (selectedSiteId && siteInventory.length === 0) {
      setStocktakeItems([])
    }
  }, [siteInventory, selectedSiteId]) // Removed stocktakeItems from deps to avoid loop
  
  const [form, setForm] = useState({
    productId: '',
    physicalCount: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState({})

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!form.productId) newErrors.productId = 'Product is required'
    if (form.physicalCount === '' || form.physicalCount < 0) newErrors.physicalCount = 'Physical count must be >= 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      notify('Please fix the errors in the form', 'error')
      return
    }

    const product = dbProducts.find(p => String(p.id) === String(form.productId))
    if (!product) {
      notify('Product not found', 'error')
      return
    }

    if (editingId) {
      // Update existing
      setStocktakeItems(prev => prev.map(item => 
        item.id === editingId 
          ? {
              ...item,
              physicalCount: parseInt(form.physicalCount),
              variance: parseInt(form.physicalCount) - item.systemStock,
              notes: form.notes
            }
          : item
      ))
      notify('Stocktake item updated', 'success')
    } else {
      // Add to existing item (update if exists, otherwise add)
      const existingItem = stocktakeItems.find(item => String(item.productId) === String(form.productId))
      if (existingItem) {
        setStocktakeItems(prev => prev.map(item =>
          String(item.productId) === String(form.productId)
            ? {
                ...item,
                physicalCount: parseInt(form.physicalCount),
                variance: parseInt(form.physicalCount) - item.systemStock,
                notes: form.notes
              }
            : item
        ))
        notify(`Updated ${product.name} physical count`, 'success')
      } else {
        const newItem = {
          id: `new-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          emoji: product.emoji || '📦',
          systemStock: 0, // Default for non-stocked items
          physicalCount: parseInt(form.physicalCount),
          variance: parseInt(form.physicalCount),
          notes: form.notes
        }
        setStocktakeItems(prev => [newItem, ...prev])
        notify(`Added ${product.name} to stocktake`, 'success')
      }
    }

    // Reset
    setForm({ productId: '', physicalCount: '', notes: '' })
    setErrors({})
    setShowModal(false)
    setEditingId(null)
  }, [form, editingId, validateForm, stocktakeItems])

  // Handle edit
  const handleEdit = useCallback((item) => {
    setEditingId(item.id)
    setForm({
      productId: item.productId,
      physicalCount: item.physicalCount,
      notes: item.notes
    })
    setShowModal(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback((id) => {
    if (window.confirm('Remove this item from stocktake?')) {
      setStocktakeItems(prev => prev.filter(item => item.id !== id))
      notify('Item removed from stocktake', 'success')
    }
  }, [])

  // Apply adjustments
  const applyAdjustments = useCallback(async () => {
    const adjustments = stocktakeItems.filter(item => item.variance !== 0)
    if (adjustments.length === 0) {
      notify('No adjustments needed', 'info')
      return
    }
    if (window.confirm(`Apply ${adjustments.length} stock adjustment(s) to ${dbSites.find(s => s.id === selectedSiteId)?.name}?`)) {
      try {
        await stocktakeService.submitStocktake(adjustments, selectedSiteId, currentUser?.id)
        notify(`Applied ${adjustments.length} stocktake adjustment(s)`, 'success')
        refetchInventory()
      } catch (err) {
        notify('Failed to apply adjustments: ' + err.message, 'error')
      }
    }
  }, [stocktakeItems, selectedSiteId, currentUser, dbSites, refetchInventory])

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false)
    setForm({ productId: '', physicalCount: '', notes: '' })
    setErrors({})
    setEditingId(null)
  }, [])

  // Calculate statistics
  const stats = useMemo(() => {
    const counted = stocktakeItems.filter(item => item.physicalCount !== item.systemStock).length
    const discrepancies = stocktakeItems.filter(item => item.variance !== 0).length
    const totalVariance = stocktakeItems.reduce((sum, item) => sum + item.variance, 0)
    return { counted, discrepancies, totalVariance }
  }, [stocktakeItems])

  // Filter items
  const filteredItems = useMemo(() => {
    if (filterVariance === 'All') return stocktakeItems
    if (filterVariance === 'Variance') return stocktakeItems.filter(item => item.variance !== 0)
    if (filterVariance === 'Counted') return stocktakeItems.filter(item => item.physicalCount !== item.systemStock)
    return stocktakeItems
  }, [stocktakeItems, filterVariance])

  // Table rows
  const tableRows = filteredItems.map(item => [
    `${item.emoji} ${item.productName}`,
    item.systemStock.toString(),
    <input
      key={item.id}
      type="number"
      value={item.physicalCount}
      onChange={(e) => {
        const newCount = parseInt(e.target.value) || 0
        setStocktakeItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, physicalCount: newCount, variance: newCount - i.systemStock }
            : i
        ))
      }}
      style={{
        background: t.input,
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 13,
        color: t.text,
        outline: 'none',
        width: '80px',
        textAlign: 'center'
      }}
    />,
    <div key={item.id} style={{
      fontSize: 13,
      fontWeight: 700,
      color: item.variance === 0 ? t.green : item.variance > 0 ? t.blue : t.red,
      textAlign: 'center'
    }}>
      {item.variance > 0 ? '+' : ''}{item.variance}
    </div>,
    <Badge 
      key={item.id}
      label={item.variance === 0 ? 'OK' : item.variance > 0 ? 'Excess' : 'Short'}
      color={item.variance === 0 ? '#10b981' : item.variance > 0 ? '#3b82f6' : '#dc2626'}
      t={t}
    />,
    <div key={item.id} style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => handleEdit(item)} style={{
        background: t.bg3, border: `1px solid ${t.border}`, color: t.text3, cursor: 'pointer',
        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, minWidth: 60
      }}>Edit</button>
      <button onClick={() => handleDelete(item.id)} style={{
        background: t.red + '20', border: `1px solid ${t.red}`, color: t.red, cursor: 'pointer',
        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, minWidth: 60
      }}>Delete</button>
    </div>
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>📋 Stocktake Inventory</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            value={selectedSiteId}
            onChange={setSelectedSiteId}
            options={[
              { label: 'Select Outlet/Site...', value: '' },
              ...dbSites.map(s => ({ label: s.name, value: s.id }))
            ]}
            t={t}
            style={{ minWidth: 200 }}
          />
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/inventory')}>📥 Goods Receiving</Btn>
          <Btn t={t} onClick={() => {}} disabled>📋 Stocktake</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/stock-transfer')}>🔄 Transfer Stock</Btn>
          <Btn t={t} variant="secondary" onClick={() => navigate('/app/damage-lost')}>🔴 Damaged/Lost</Btn>
        </div>
      </div>

      {hasUrgentRequest && (
        <div style={{ background: t.red + '15', border: `1px solid ${t.red}50`, padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>🚨</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: t.red }}>URGENT: Stocktake Requested</div>
              <div style={{ fontSize: 13, color: t.text }}>Area Manager requested an immediate blind stocktake for the current site.</div>
            </div>
          </div>
          <Btn t={t} style={{ background: t.red, color: '#fff', border: 'none' }} onClick={() => setHasUrgentRequest(false)}>Acknowledge & Start</Btn>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Total Items</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{stocktakeItems.length}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Discrepancies</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: stats.discrepancies > 0 ? t.red : t.green }}>{stats.discrepancies}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Counted Items</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: stats.counted > 0 ? t.blue : t.text3 }}>{stats.counted}</div>
        </Card>
        <Card t={t} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: t.text3, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.7, marginBottom: 8 }}>Total Variance</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: stats.totalVariance === 0 ? t.green : stats.totalVariance > 0 ? t.blue : t.red }}>
            {stats.totalVariance > 0 ? '+' : ''}{stats.totalVariance}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="controls-row" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <Btn onClick={() => setShowModal(true)} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
          ➕ Add/Update Item
        </Btn>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            value={filterVariance}
            onChange={setFilterVariance}
            options={[
              { label: 'All Items', value: 'All' },
              { label: 'Discrepancies Only', value: 'Variance' },
              { label: 'Counted Items', value: 'Counted' }
            ]}
            t={t}
            label="Filter"
          />
          <Btn 
            onClick={applyAdjustments} 
            t={t} 
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, background: '#10b981' }}
            disabled={stats.discrepancies === 0}
          >
            ✅ Apply Adjustments ({stats.discrepancies})
          </Btn>
        </div>
      </div>

      {/* Info box */}
      <Card t={t} style={{ padding: 12, marginBottom: 24, background: t.bg3 }}>
        <div style={{ fontSize: 12, color: t.text3 }}>
          💡 <strong>How to use:</strong> Edit physical counts in the table, click "Apply Adjustments" when done. Discrepancies will be recorded.
        </div>
      </Card>

      {/* Table */}
      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table 
          cols={['Product', 'System Stock', 'Physical Count', 'Variance', 'Status', 'Actions']}
          rows={tableRows}
          empty="No stocktake items"
          t={t}
        />
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal 
          title={editingId ? 'Edit Stocktake Item' : 'Add Stocktake Item'} 
          onClose={closeModal} 
          t={t} 
          width={480}
          subtitle={editingId ? 'Update physical count' : 'Enter physical inventory count'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Product Select */}
            <div>
              <Select
                label="Product"
                value={form.productId}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, productId: val }))
                  setErrors(prev => ({ ...prev, productId: '' }))
                }}
                options={[
                  { label: 'Select a product...', value: '' },
                  ...dbProducts.map(p => ({ label: `${p.emoji || '📦'} ${p.name}`, value: p.id }))
                ]}
                t={t}
              />
              {errors.productId && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.productId}</div>}
            </div>

            {/* Physical Count */}
            <div>
              <Input
                label="Physical Count"
                type="number"
                value={form.physicalCount}
                onChange={(val) => {
                  setForm(prev => ({ ...prev, physicalCount: parseInt(val) || '' }))
                  setErrors(prev => ({ ...prev, physicalCount: '' }))
                }}
                placeholder="Actual count in warehouse"
                required
                t={t}
              />
              {errors.physicalCount && <div style={{ fontSize: 12, color: t.red, marginTop: 4 }}>⚠ {errors.physicalCount}</div>}
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 }}>Notes (Optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Missing price tag, Location A..."
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
                {editingId ? 'Update Item' : 'Add Item'}
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
