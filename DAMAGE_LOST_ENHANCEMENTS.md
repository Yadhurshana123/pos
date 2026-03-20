// ═══════════════════════════════════════════════════════════════
// ADVANCED ENHANCEMENTS FOR DAMAGE/LOST MANAGEMENT
// Optional features you can add to extend functionality
// ═══════════════════════════════════════════════════════════════

/**
 * ENHANCEMENT 1: Export to CSV
 * 
 * Add this function to your component:
 */

const exportToCSV = useCallback(() => {
  const headers = ['Product Name', 'Quantity', 'Type', 'Date', 'Outlet', 'Reason', 'Operator']
  const rows = filteredEntries.map(e => [
    e.productName,
    e.quantity,
    e.type,
    e.date,
    e.outlet,
    e.reason,
    e.operator
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `damage-lost-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
})

// Add button in controls section:
<Btn onClick={exportToCSV} t={t} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}>
  📥 Export CSV
</Btn>

/**
 * ENHANCEMENT 2: Date Range Filtering
 * 
 * Add state for date range:
 */

const [dateRange, setDateRange] = useState({
  startDate: '',
  endDate: ''
})

// Filter function:
const getFilteredEntries = useCallback(() => {
  let filtered = filterType === 'All' ? entries : entries.filter(e => e.type === filterType)
  
  if (dateRange.startDate) {
    filtered = filtered.filter(e => new Date(e.date) >= new Date(dateRange.startDate))
  }
  if (dateRange.endDate) {
    filtered = filtered.filter(e => new Date(e.date) <= new Date(dateRange.endDate))
  }
  
  return filtered
}, [entries, filterType, dateRange])

// Add date inputs in controls:
<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
  <Input
    label="From Date"
    type="date"
    value={dateRange.startDate}
    onChange={date => setDateRange(prev => ({ ...prev, startDate: date }))}
    t={t}
  />
  <Input
    label="To Date"
    type="date"
    value={dateRange.endDate}
    onChange={date => setDateRange(prev => ({ ...prev, endDate: date }))}
    t={t}
  />
</div>

/**
 * ENHANCEMENT 3: Search/Filter by Product Name
 * 
 * Add state and filter:
 */

const [searchTerm, setSearchTerm] = useState('')

const filteredWithSearch = useMemo(() => {
  return filteredEntries.filter(e => 
    e.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [filteredEntries, searchTerm])

// Add search input:
<Input
  label="Search Product"
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Type product name..."
  t={t}
/>

/**
 * ENHANCEMENT 4: Bulk Delete with Selection
 * 
 * Track selected entries:
 */

const [selectedIds, setSelectedIds] = useState(new Set())

const toggleSelect = useCallback((id) => {
  setSelectedIds(prev => {
    const newSet = new Set(prev)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    return newSet
  })
}, [])

const bulkDelete = useCallback(() => {
  if (window.confirm(`Delete ${selectedIds.size} entries?`)) {
    setEntries(prev => prev.filter(e => !selectedIds.has(e.id)))
    setSelectedIds(new Set())
    notify('Entries deleted', 'success')
  }
}, [selectedIds])

// Add checkboxes in table rows:
const tableRows = filteredEntries.map(entry => [
  <input
    type="checkbox"
    checked={selectedIds.has(entry.id)}
    onChange={() => toggleSelect(entry.id)}
    style={{ cursor: 'pointer' }}
  />,
  // ... rest of columns
])

/**
 * ENHANCEMENT 5: Quick Stats with Breakdown
 * 
 * Enhanced statistics:
 */

const stats = useMemo(() => {
  const byType = entries.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + e.quantity
    return acc
  }, {})
  
  const byOutlet = entries.reduce((acc, e) => {
    acc[e.outlet] = (acc[e.outlet] || 0) + 1
    return acc
  }, {})
  
  const byReason = entries.reduce((acc, e) => {
    acc[e.reason] = (acc[e.reason] || 0) + 1
    return acc
  }, {})
  
  return { byType, byOutlet, byReason }
}, [entries])

// Display in modal/tooltip:
<div style={{ fontSize: 11, color: t.text3, padding: 12, background: t.bg3, borderRadius: 8 }}>
  <h4 style={{ margin: '0 0 8px 0' }}>Breakdown</h4>
  <div>Damage: {stats.byType.Damage || 0} items</div>
  <div>Lost: {stats.byType.Lost || 0} items</div>
  {Object.entries(stats.byOutlet).map(([outlet, count]) => (
    <div key={outlet}>{outlet}: {count} entries</div>
  ))}
</div>

/**
 * ENHANCEMENT 6: Auto-Deduct from Inventory
 * 
 * When creating damage entry, optionally reduce stock:
 */

const [autoDeductStock, setAutoDeductStock] = useState(false)

const handleSubmit = useCallback(() => {
  // ... validation code ...
  
  const product = SAMPLE_PRODUCTS.find(p => String(p.id) === String(form.productId))
  
  // Create entry
  const newEntry = {
    id: genId('dmg'),
    ...form,
    productName: product.name,
    date: ts().split(',')[0],
    operator: currentUser?.name || 'System'
  }
  
  setEntries(prev => [newEntry, ...prev])
  
  // Optional: Auto-deduct from inventory
  if (autoDeductStock) {
    // Call inventory service to reduce stock:
    // adjustStock(product.id, form.quantity * -1)
    notify(`Reduced ${product.name} stock by ${form.quantity}`, 'success')
  }
  
  // Reset form
  setForm({ productId: '', quantity: '', type: 'Damage', outlet: '', reason: '' })
  setShowModal(false)
}, [form, autoDeductStock, currentUser])

// Add checkbox in modal:
<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
  <input
    type="checkbox"
    checked={autoDeductStock}
    onChange={e => setAutoDeductStock(e.target.checked)}
  />
  <span>Auto-deduct from inventory stock</span>
</label>

/**
 * ENHANCEMENT 7: Reason Categories/Presets
 * 
 * Instead of textarea, use preset reasons:
 */

const REASON_PRESETS = [
  'Water damaged during transit',
  'Punctured/torn item',
  'Defective/faulty',
  'Lost in warehouse',
  'Lost in inventory count',
  'Fire/environmental damage',
  'Wrong item received',
  'Customer reported damaged',
  'Expired/off-spec',
  'Other (specify in notes)'
]

// Replace reason textarea with select:
<Select
  label="Reason Category"
  value={form.reason}
  onChange={val => setForm(prev => ({ ...prev, reason: val }))}
  options={REASON_PRESETS.map(r => ({ label: r, value: r }))}
  t={t}
/>

// Add optional notes field:
<Input
  label="Additional Notes"
  value={form.notes}
  onChange={val => setForm(prev => ({ ...prev, notes: val }))}
  placeholder="Any additional details..."
  t={t}
/>

/**
 * ENHANCEMENT 8: Approval Workflow
 * 
 * Track approval status:
 */

const handleStatus = useCallback((id, newStatus) => {
  setEntries(prev => prev.map(e => 
    e.id === id 
      ? { ...e, status: newStatus, reviewedBy: currentUser?.name, reviewedAt: ts() }
      : e
  ))
}, [currentUser])

// Add status badges:
const getStatusColor = (status) => {
  switch(status) {
    case 'recorded': return '#9ca3af'
    case 'reviewed': return '#3b82f6'
    case 'resolved': return '#10b981'
    default: return '#6b7280'
  }
}

// Add in table or actions:
<div style={{ display: 'flex', gap: 8 }}>
  {['recorded', 'reviewed', 'resolved'].map(status => (
    <button
      key={status}
      onClick={() => handleStatus(entry.id, status)}
      style={{
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        background: entry.status === status ? getStatusColor(status) : '#e5e7eb',
        color: entry.status === status ? 'white' : '#6b7280'
      }}
    >
      {status}
    </button>
  ))}
</div>

/**
 * ENHANCEMENT 9: Attach Images/Documentation
 * 
 * In form:
 */

const [imageUrl, setImageUrl] = useState('')

// Add file input:
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0]
    if (file) {
      // Upload to storage backend
      // setImageUrl(uploadedUrl)
      notify('Image attached', 'success')
    }
  }}
  style={{ padding: '10px 14px' }}
/>

/**
 * ENHANCEMENT 10: Generate Report
 * 
 * Create summary report:
 */

const generateReport = useCallback(() => {
  const report = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    totalItems: entries.reduce((sum, e) => sum + e.quantity, 0),
    byType: {
      damage: entries.filter(e => e.type === 'Damage').length,
      lost: entries.filter(e => e.type === 'Lost').length
    },
    byOutlet: Object.values(
      entries.reduce((acc, e) => {
        acc[e.outlet] = (acc[e.outlet] || 0) + e.quantity
        return acc
      }, {})
    ),
    details: entries
  }
  
  console.log(JSON.stringify(report, null, 2))
  
  // Can be sent to email/saved to DB
  notify('Report generated', 'success')
}, [entries])

/**
 * ═══════════════════════════════════════════════════════════════
 * IMPLEMENTATION PRIORITY:
 * ═══════════════════════════════════════════════════════════════
 * 
 * HIGH PRIORITY (Add First):
 * 1. Export to CSV
 * 2. Search/Filter by product
 * 3. Reason categories
 * 4. Date range filter
 * 
 * MEDIUM PRIORITY:
 * 5. Auto-deduct inventory
 * 6. Bulk selection
 * 7. Advanced stats
 * 
 * LOW PRIORITY (Advanced):
 * 8. Approval workflow
 * 9. Image attachments
 * 10. Report generation
 * 
 * ═══════════════════════════════════════════════════════════════
 */
