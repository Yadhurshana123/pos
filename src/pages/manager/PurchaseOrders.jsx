import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { Btn, Input, Badge, Card, Select, Table, Modal } from '@/components/ui'
import { notify } from '@/components/shared'
import { ts } from '@/lib/utils'

export function PurchaseOrders({ products }) {
  const { t } = useTheme()
  const navigate = useNavigate()

  // State for Purchase Orders list
  const [orders, setOrders] = useState([
    { id: 'PO-1042', site: 'Main Stadium Store', supplier: 'Global Merch Corp', date: '2023-10-25', status: 'Delivered', total: '£1,450.00' },
    { id: 'PO-1043', site: 'East Wing Megastore', supplier: 'Scarf & Flag Co', date: '2023-10-28', status: 'Pending', total: '£420.00' }
  ])

  // View state
  const [view, setView] = useState('list') // 'list' | 'create'
  const [viewScope, setViewScope] = useState('single') 

  // Master Data
  const AVAILABLE_SITES = ['Main Stadium Store', 'East Wing Megastore', 'Airport Pop-up', 'Central Warehouse']
  const [suppliers, setSuppliers] = useState(['Global Merch Corp', 'Scarf & Flag Co', 'Elite Sportswear'])
  
  // Create PO Form State
  const [poForm, setPoForm] = useState({
    site: '',
    supplier: '',
    notes: ''
  })
  
  const [lineItems, setLineItems] = useState([])
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')

  // Derived Totals
  const totals = useMemo(() => {
    let sub = 0
    lineItems.forEach(item => {
      sub += (parseFloat(item.cost) || 0) * (parseInt(item.qty) || 0)
    })
    const tax = sub * 0.2 // 20% VAT
    return { subtotal: sub, tax, total: sub + tax }
  }, [lineItems])

  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) return
    setSuppliers([...suppliers, newSupplierName.trim()])
    setPoForm(f => ({ ...f, supplier: newSupplierName.trim() }))
    setNewSupplierName('')
    setShowAddSupplier(false)
    notify('Supplier added successfully', 'success')
  }

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), productId: '', stock: 0, qty: 1, cost: 0, notes: '' }])
  }

  const handleLineItemChange = (id, field, value) => {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item
      
      const updated = { ...item, [field]: value }
      
      // Auto-fill stock and cost if product changes
      if (field === 'productId') {
        const prod = products?.find(p => String(p.id) === String(value))
        if (prod) {
          updated.stock = prod.stock || 0
          updated.cost = prod.price ? (prod.price * 0.4).toFixed(2) : 0 // Rough cost estimate
        }
      }
      return updated
    }))
  }

  const handleRemoveLineItem = (id) => {
    setLineItems(items => items.filter(item => item.id !== id))
  }

  const handleSubmitPO = () => {
    if (!poForm.site || !poForm.supplier) {
      notify('Please select a Site and Supplier', 'error')
      return
    }
    if (lineItems.length === 0 || !lineItems.some(i => i.productId && i.qty > 0)) {
      notify('Please add at least one valid line item', 'error')
      return
    }

    const newPO = {
      id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      site: poForm.site,
      supplier: poForm.supplier,
      date: ts().split(' ')[0],
      status: 'Draft',
      total: `£${totals.total.toFixed(2)}`
    }

    setOrders([newPO, ...orders])
    setView('list')
    setPoForm({ site: '', supplier: '', notes: '' })
    setLineItems([])
    notify(`Created new Purchase Order ${newPO.id}`, 'success')
  }

  // ==== RENDER LIST VIEW ====
  if (view === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
              📜 Purchase History & Orders
            </div>
            <p style={{ color: t.text3, marginTop: 6, fontSize: 13, maxWidth: 500 }}>
              Track past inbound orders and draft new Purchase Orders to replenish site inventory.
            </p>
          </div>
          
          <div style={{ display: 'flex', background: t.bg3, borderRadius: 10, padding: 4, border: `1px solid ${t.border}` }}>
            <button onClick={() => setViewScope('single')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: viewScope === 'single' ? t.bg : 'transparent', color: viewScope === 'single' ? t.text : t.text3, boxShadow: viewScope === 'single' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Just for my site</button>
            <button onClick={() => setViewScope('multi')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: viewScope === 'multi' ? t.bg : 'transparent', color: viewScope === 'multi' ? t.text : t.text3, boxShadow: viewScope === 'multi' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Multiple sites ✨</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <Btn t={t} onClick={() => setView('create')}>+ Create Purchase Order</Btn>
        </div>

        <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
          <Table 
            t={t}
            cols={['PO Number', 'Site', 'Supplier', 'Expected Date', 'Status', 'Total Value', 'Actions']}
            rows={orders.filter(o => viewScope === 'multi' || o.site === 'Main Stadium Store').map(o => [
              <strong key={o.id} style={{ color: t.text }}>{o.id}</strong>,
              <span key={o.id} style={{ fontSize: 13, color: t.text3 }}>{o.site}</span>,
              <span key={o.id} style={{ color: t.text2 }}>{o.supplier}</span>,
              <span key={o.id} style={{ fontSize: 13, color: t.text3 }}>{o.date}</span>,
              <Badge key={o.id} t={t} text={o.status} color={o.status === 'Delivered' ? 'green' : o.status === 'Pending' ? 'yellow' : 'gray'} />,
              <span key={o.id} style={{ fontWeight: 700 }}>{o.total}</span>,
              <Btn key={o.id} t={t} variant="secondary" size="sm" onClick={() => notify('Opening PO details...', 'info')}>View</Btn>
            ])}
            empty="No purchase orders found."
          />
        </Card>
      </div>
    )
  }

  // ==== RENDER CREATE VIEW ====
  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>📝 Create Purchase Order</div>
          <p style={{ color: t.text3, marginTop: 4, fontSize: 13 }}>Draft a new PO and add line items.</p>
        </div>
        <Btn t={t} variant="secondary" onClick={() => setView('list')}>← Back to History</Btn>
      </div>

      {/* Header Info */}
      <Card t={t} style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, borderBottom: `1px solid ${t.border}`, paddingBottom: 10 }}>Order Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          <Select
            t={t} label="Receiving Site/Shop *"
            value={poForm.site}
            onChange={v => setPoForm(f => ({ ...f, site: v }))}
            options={[{ value: '', label: '— Select Site —' }, ...AVAILABLE_SITES.map(s => ({ value: s, label: s }))]}
          />
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Select
                t={t} label="Supplier *"
                value={poForm.supplier}
                onChange={v => setPoForm(f => ({ ...f, supplier: v }))}
                options={[{ value: '', label: '— Select Supplier —' }, ...suppliers.map(s => ({ value: s, label: s }))]}
              />
            </div>
            <Btn t={t} variant="secondary" onClick={() => setShowAddSupplier(true)} style={{ height: 42 }}>+ Add New</Btn>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Line Items</h3>
          <Btn t={t} size="sm" onClick={handleAddLineItem}>+ Add Row</Btn>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: t.bg3, fontSize: 12, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Product</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, width: 100 }}>Cur. Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, width: 120 }}>Order Qty</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, width: 120 }}>Unit Cost (£)</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, width: 120 }}>Line Total (£)</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Notes</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 30, textAlign: 'center', color: t.text3 }}>No items added. Click "+ Add Row"</td></tr>
              ) : (
                lineItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '8px 16px' }}>
                      <ProductSearchSelect t={t} products={products} value={item.productId} onChange={v => handleLineItemChange(item.id, 'productId', v)} />
                    </td>
                    <td style={{ padding: '8px 16px', fontWeight: 700, color: t.text3 }}>{item.stock}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <Input t={t} type="number" value={item.qty} onChange={v => handleLineItemChange(item.id, 'qty', v)} />
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <Input t={t} type="number" value={item.cost} onChange={v => handleLineItemChange(item.id, 'cost', v)} />
                    </td>
                    <td style={{ padding: '8px 16px', fontWeight: 800, color: t.text }}>
                      {((parseFloat(item.cost) || 0) * (parseInt(item.qty) || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <Input t={t} value={item.notes} onChange={v => handleLineItemChange(item.id, 'notes', v)} placeholder="e.g. Size L" />
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <button onClick={() => handleRemoveLineItem(item.id)} style={{ background: 'transparent', border: 'none', color: t.red, cursor: 'pointer', fontSize: 16 }}>×</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Footer */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card t={t} style={{ flex: '1 1 300px', padding: 20 }}>
          <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Order Notes / Terms</label>
          <textarea 
            value={poForm.notes} onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Special delivery instructions, terms, etc."
            style={{ width: '100%', height: 100, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: t.input, color: t.text, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </Card>

        <Card t={t} style={{ flex: '1 1 300px', padding: 24, background: t.bg3 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, borderBottom: `1px solid ${t.border}`, paddingBottom: 10 }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: t.text3, fontSize: 14 }}>
            <span>Subtotal</span>
            <span style={{ color: t.text }}>£{totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: t.text3, fontSize: 14 }}>
            <span>Estimated Tax (20%)</span>
            <span style={{ color: t.text }}>£{totals.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 18, fontWeight: 900, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <span>Total Value</span>
            <span style={{ color: t.accent }}>£{totals.total.toFixed(2)}</span>
          </div>

          <Btn t={t} onClick={handleSubmitPO} style={{ width: '100%', padding: '16px 0', fontSize: 16 }}>Generate Purchase Order</Btn>
        </Card>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <Modal t={t} title="Add New Supplier" onClose={() => setShowAddSupplier(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input t={t} label="Supplier Name *" value={newSupplierName} onChange={setNewSupplierName} placeholder="e.g. Acme Merchandising" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Btn t={t} variant="secondary" onClick={() => setShowAddSupplier(false)}>Cancel</Btn>
              <Btn t={t} onClick={handleAddSupplier} disabled={!newSupplierName.trim()}>Save Supplier</Btn>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

function ProductSearchSelect({ t, products, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const selectedProduct = products?.find(p => String(p.id) === String(value))
  const filtered = (products || []).filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: 220 }}>
      <div 
        onClick={() => { setOpen(!open); setSearch('') }}
        style={{ padding: '8px 12px', border: `1px solid ${open ? t.accent : t.border}`, borderRadius: 8, background: t.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: selectedProduct ? t.text : t.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>
          {selectedProduct ? selectedProduct.name : 'Search / Select product...'}
        </span>
        <span style={{ fontSize: 10, color: t.text3 }}>▼</span>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, marginTop: 4, maxHeight: 250, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ padding: 8, position: 'sticky', top: 0, background: t.bg, borderBottom: `1px solid ${t.border}` }}>
            <input 
              autoFocus
              placeholder="Type to search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${t.border}`, background: t.input, color: t.text, boxSizing: 'border-box' }}
            />
          </div>
          {filtered.map(p => (
            <div 
              key={p.id}
              onClick={() => { onChange(String(p.id)); setOpen(false) }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${t.border}40` }}
              onMouseEnter={(e) => e.currentTarget.style.background = t.bg3}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 600, color: t.text, fontSize: 13 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: t.text3 }}>SKU: {p.sku} | Stock: {p.stock}</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', color: t.text3, fontSize: 13 }}>No products found</div>}
        </div>
      )}
    </div>
  )
}

