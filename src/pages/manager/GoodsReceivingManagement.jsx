import { useState, useCallback, useMemo } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, StatCard, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { genId, ts, fmt } from '@/lib/utils'

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Biryani', sku: 'BIR-001', emoji: '🍛', stock: 45 },
  { id: 2, name: 'Dosa', sku: 'DOS-001', emoji: '🥞', stock: 120 },
  { id: 3, name: 'Idli', sku: 'IDL-001', emoji: '⚪', stock: 80 },
  { id: 4, name: 'Samosa', sku: 'SAM-001', emoji: '🥟', stock: 200 },
  { id: 5, name: 'Naan', sku: 'NAN-001', emoji: '🍞', stock: 95 },
  { id: 6, name: 'Chai', sku: 'CHA-001', emoji: '🥤', stock: 180 },
]

const SUPPLIERS = ['Local Farm Co', 'Metro Supplies', 'Fresh Foods Inc', 'Wholesale Hub', 'Daily Delivery']

const INITIAL_RECEIVING = [
  {
    id: genId(),
    productId: 1,
    productName: 'Biryani',
    productEmoji: '🍛',
    quantity: 50,
    supplier: 'Local Farm Co',
    poNumber: 'PO-2026-001',
    date: '2026-03-16',
    notes: 'Bulk order received on time',
    status: 'completed',
  },
  {
    id: genId(),
    productId: 2,
    productName: 'Dosa',
    productEmoji: '🥞',
    quantity: 100,
    supplier: 'Metro Supplies',
    poNumber: 'PO-2026-002',
    date: '2026-03-15',
    notes: 'Partial shipment, rest pending',
    status: 'pending',
  },
  {
    id: genId(),
    productId: 4,
    productName: 'Samosa',
    productEmoji: '🥟',
    quantity: 150,
    supplier: 'Fresh Foods Inc',
    poNumber: 'PO-2026-003',
    date: '2026-03-14',
    notes: 'Quality check passed',
    status: 'completed',
  },
]

export default function GoodsReceivingManagement() {
  const { t } = useTheme()
  const { currentUser } = useAuth()

  const [receivings, setReceivings] = useState(INITIAL_RECEIVING)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ productId: '', quantity: '', supplier: '', poNumber: '', notes: '', status: 'completed' })

  const validateForm = useCallback(() => {
    if (!form.productId) { notify('Select a product', 'error'); return false }
    if (!form.quantity || parseInt(form.quantity) <= 0) { notify('Enter a valid quantity', 'error'); return false }
    if (!form.supplier) { notify('Select a supplier', 'error'); return false }
    if (!form.poNumber) { notify('Enter PO number', 'error'); return false }
    return true
  }, [form])

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return
    const product = SAMPLE_PRODUCTS.find(p => String(p.id) === String(form.productId))
    if (!product) return

    if (editingId) {
      setReceivings(rs => rs.map(r => r.id === editingId ? {
        ...r,
        productId: form.productId,
        productName: product.name,
        productEmoji: product.emoji,
        quantity: parseInt(form.quantity),
        supplier: form.supplier,
        poNumber: form.poNumber,
        notes: form.notes,
        status: form.status,
      } : r))
      notify('Goods receiving updated', 'success')
      setEditingId(null)
    } else {
      setReceivings(rs => [
        {
          id: genId(),
          productId: form.productId,
          productName: product.name,
          productEmoji: product.emoji,
          quantity: parseInt(form.quantity),
          supplier: form.supplier,
          poNumber: form.poNumber,
          date: fmt(new Date(), 'YYYY-MM-DD'),
          notes: form.notes,
          status: form.status,
        },
        ...rs,
      ])
      notify(`Received ${form.quantity}× ${product.name}`, 'success')
    }
    setForm({ productId: '', quantity: '', supplier: '', poNumber: '', notes: '', status: 'completed' })
    setShowForm(false)
  }, [form, editingId, validateForm])

  const handleEdit = useCallback(r => {
    setEditingId(r.id)
    setForm({
      productId: String(r.productId),
      quantity: String(r.quantity),
      supplier: r.supplier,
      poNumber: r.poNumber,
      notes: r.notes,
      status: r.status,
    })
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(id => {
    if (confirm('Delete this goods receiving record?')) {
      setReceivings(rs => rs.filter(r => r.id !== id))
      notify('Record deleted', 'success')
    }
  }, [])

  const stats = useMemo(() => {
    const completed = receivings.filter(r => r.status === 'completed').length
    const pending = receivings.filter(r => r.status === 'pending').length
    const totalQty = receivings.reduce((s, r) => s + r.quantity, 0)
    return { total: receivings.length, completed, pending, totalQty }
  }, [receivings])

  const tableRows = useMemo(() => {
    return receivings.map(r => [
      <span style={{ fontWeight: 600, color: t.text }}>{r.productEmoji} {r.productName}</span>,
      <span style={{ fontWeight: 700, color: t.text }}>{r.quantity}</span>,
      <span style={{ fontSize: 12, color: t.text3 }}>{r.supplier}</span>,
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.text3 }}>{r.poNumber}</span>,
      <span style={{ fontSize: 11, color: t.text3 }}>{r.date}</span>,
      <Badge
        t={t}
        text={r.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
        color={r.status === 'completed' ? 'green' : 'yellow'}
      />,
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn t={t} variant="secondary" size="sm" onClick={() => handleEdit(r)}>Edit</Btn>
        <Btn t={t} variant="secondary" size="sm" onClick={() => handleDelete(r.id)}>Delete</Btn>
      </div>,
    ])
  }, [receivings, t, handleEdit, handleDelete])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 clamp(12px, 3vw, 24px)', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>📥 Goods Receiving</div>
        <Btn t={t} onClick={() => { setEditingId(null); setForm({ productId: '', quantity: '', supplier: '', poNumber: '', notes: '', status: 'completed' }); setShowForm(true) }}>
          ➕ New Receipt
        </Btn>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,45vw),1fr))', gap: 12 }}>
        <StatCard t={t} title="Total Receipts" value={stats.total} color={t.blue} icon="📦" />
        <StatCard t={t} title="Completed" value={stats.completed} color={t.green} icon="✓" />
        <StatCard t={t} title="Pending" value={stats.pending} color={t.yellow} icon="⏳" />
        <StatCard t={t} title="Total Qty" value={stats.totalQty} color={t.purple} icon="🔢" />
      </div>

      {/* Info Box */}
      <Card t={t} style={{ background: t.blueBg || t.bg2, border: `1px solid ${t.blue || t.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, color: t.blue || t.text, lineHeight: 1.6 }}>
          ℹ️ Track all incoming goods. Record PO numbers, supplier details, and notes for complete traceability.
        </div>
      </Card>

      {/* Table */}
      <Card t={t} style={{ padding: 0, overflow: 'hidden', minHeight: 200 }}>
        {receivings.length === 0 ? (
          <div style={{ padding: 20, color: t.text3, textAlign: 'center' }}>No goods receiving records yet</div>
        ) : (
          <Table
            t={t}
            cols={['Product', 'Qty', 'Supplier', 'PO Number', 'Date', 'Status', 'Actions']}
            rows={tableRows}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal
          t={t}
          title={editingId ? 'Edit Goods Receiving' : 'Record Goods Receiving'}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          width={500}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.greenBg || t.bg3, border: `1px solid ${t.green || t.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: t.green || t.text }}>
              📥 Record incoming stock with supplier and PO details.
            </div>
            <Select
              t={t}
              label="Product"
              value={form.productId}
              onChange={v => setForm(f => ({ ...f, productId: v }))}
              options={[{ value: '', label: '— Select Product —' }, ...SAMPLE_PRODUCTS.map(p => ({ value: String(p.id), label: `${p.emoji} ${p.name}` }))]}
            />
            <Input
              t={t}
              label="Quantity Received"
              type="number"
              value={form.quantity}
              onChange={v => setForm(f => ({ ...f, quantity: v }))}
              placeholder="Units to receive"
            />
            <Select
              t={t}
              label="Supplier"
              value={form.supplier}
              onChange={v => setForm(f => ({ ...f, supplier: v }))}
              options={[{ value: '', label: '— Select Supplier —' }, ...SUPPLIERS.map(s => ({ value: s, label: s }))]}
            />
            <Input
              t={t}
              label="PO Number"
              value={form.poNumber}
              onChange={v => setForm(f => ({ ...f, poNumber: v }))}
              placeholder="e.g. PO-2026-001"
            />
            <Input
              t={t}
              label="Notes (optional)"
              value={form.notes}
              onChange={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Delivery notes, quality check, etc."
            />
            <Select
              t={t}
              label="Status"
              value={form.status}
              onChange={v => setForm(f => ({ ...f, status: v }))}
              options={[
                { value: 'completed', label: '✓ Completed' },
                { value: 'pending', label: '⏳ Pending' },
              ]}
            />
            <Btn
              t={t}
              onClick={handleSubmit}
              disabled={!form.productId || !form.quantity || !form.supplier || !form.poNumber}
            >
              {editingId ? 'Update Receipt' : '📥 Record Receipt'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
