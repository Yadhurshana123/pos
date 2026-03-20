import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { Btn, Input, Badge, Card, Select, Table } from '@/components/ui'
import { notify } from '@/components/shared'

export function SupplierReturns({ products, t: tProp }) {
  const { t: tTheme } = useTheme()
  const t = tProp ?? tTheme
  const navigate = useNavigate()

  const [form, setForm] = useState({ productId: '', qty: '', reason: '', authCode: '', notes: '' })
  const [returns, setReturns] = useState([
    { id: 'RTN-5501', product: 'Home Shirt 23/24', qty: 2, status: 'Dispatched', reason: 'Defective Stitching', authCode: 'AUTH-X912' },
    { id: 'RTN-5502', product: 'Training Jacket', qty: 1, status: 'Pending Auth', reason: 'Wrong size delivered', authCode: 'Pending' }
  ])

  const RETURN_REASONS = ['Defective/Damaged', 'Wrong Item Received', 'Overstock Recall', 'Expired/Obsolete', 'Other']

  const handleReturn = () => {
    if (!form.productId || !form.qty || !form.reason) {
      notify('Please fill required fields (Product, Qty, Reason)', 'error')
      return
    }
    const product = products?.find(p => String(p.id) === form.productId)
    if (!product) return

    const newRtn = {
      id: `RTN-${Math.floor(5500 + Math.random() * 1000)}`,
      product: product.name,
      qty: parseInt(form.qty) || 0,
      status: form.authCode ? 'Ready to Dispatch' : 'Pending Auth',
      reason: form.reason,
      authCode: form.authCode || 'Pending'
    }

    setReturns([newRtn, ...returns])
    notify(`Return ${newRtn.id} logged. Wait for dispatch.`, 'success')
    setForm({ productId: '', qty: '', reason: '', authCode: '', notes: '' })
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>🚚 Supplier Returns</div>
          <p style={{ color: t.text3, marginTop: 4, fontSize: 13 }}>Send defective or recalled items back to suppliers.</p>
        </div>
        <Btn t={t} variant="secondary" onClick={() => navigate('/app/inventory')}>Back to Inventory</Btn>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Return Form */}
        <Card t={t} style={{ flex: '1 1 350px', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Log New Return</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select
              t={t} label="Product to Return *"
              value={form.productId}
              onChange={v => setForm({ ...form, productId: v })}
              options={[{ value: '', label: '— Select Product —' }, ...(products || []).map(p => ({ value: String(p.id), label: `${p.name} (Stock: ${p.stock})` }))]}
            />

            <Input t={t} label="Quantity *" value={form.qty} onChange={v => setForm({ ...form, qty: v })} type="number" placeholder="0" />

            <Select
              t={t} label="Reason for Return *"
              value={form.reason}
              onChange={v => setForm({ ...form, reason: v })}
              options={[{ value: '', label: '— Select Reason —' }, ...RETURN_REASONS.map(r => ({ value: r, label: r }))]}
            />

            <Input 
              t={t} 
              label="Return Authorisation Code (RMA)" 
              value={form.authCode} 
              onChange={v => setForm({ ...form, authCode: v })} 
              placeholder="Leave blank if pending" 
              note="Required before physical dispatch to supplier."
            />

            <Btn t={t} onClick={handleReturn} style={{ marginTop: 8 }}>Log Return</Btn>
          </div>
        </Card>

        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Policy Box */}
          <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, padding: 16, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.yellow, marginBottom: 8 }}>⚠️ Supplier Return Policy Reminder</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: t.text3, lineHeight: 1.6 }}>
              <li>Items from customers must first be placed in the "Local Returns Bin".</li>
              <li>A Return Authorisation Code (RMA/RAC) must be obtained from the supplier.</li>
              <li>Do not dispatch goods without an auth code; they may be rejected.</li>
            </ul>
          </div>

          {/* Return History */}
          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, fontWeight: 800 }}>Active Returns</div>
            <Table 
              t={t}
              cols={['Return ID', 'Product', 'Qty', 'Reason', 'RMA Code', 'Status']}
              rows={returns.map(r => [
                <strong key={r.id} style={{ color: t.text }}>{r.id}</strong>,
                <span key={r.id} style={{ color: t.text2 }}>{r.product}</span>,
                <span key={r.id} style={{ fontWeight: 800 }}>{r.qty}</span>,
                <span key={r.id} style={{ fontSize: 12, color: t.text3 }}>{r.reason}</span>,
                <span key={r.id} style={{ fontFamily: 'monospace', color: r.authCode === 'Pending' ? t.red : t.text }}>{r.authCode}</span>,
                <Badge key={r.id} t={t} text={r.status} color={r.status === 'Dispatched' ? 'green' : r.status === 'Ready to Dispatch' ? 'blue' : 'yellow'} />
              ])}
            />
          </Card>
        </div>

      </div>
    </div>
  )
}
