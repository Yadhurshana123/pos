import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Input, Badge, Card, Select } from '@/components/ui'
import { notify, ImgWithFallback } from '@/components/shared'
import { inventoryService, serialsService } from '@/services'
import { isSupabaseConfigured } from '@/lib/supabase'
import { PRODUCT_IMAGES } from '@/lib/seed-data'

export function ReceiveStock({ products, setProducts, addAudit, currentUser, t: tProp, siteId }) {
  const { t: tTheme } = useTheme()
  const { currentUser: authUser } = useAuth()
  const t = tProp ?? tTheme
  const navigate = useNavigate()
  const user = currentUser ?? authUser

  const [form, setForm] = useState({ productId: '', qty: '', notes: '', serials: [] })
  const [loading, setLoading] = useState(false)

  const effectiveSiteId = siteId || 'b0000000-0000-0000-0000-000000000001'

  const selectedProduct = products?.find(p => String(p.id) === form.productId)
  const qtyNum = parseInt(form.qty) || 0
  const needsSerials = selectedProduct?.track_serial && qtyNum > 0

  const handleReceiving = async () => {
    if (!selectedProduct) { notify('Select a product to receive', 'error'); return }
    if (qtyNum <= 0) { notify('Enter a valid quantity > 0', 'error'); return }

    const serials = (form.serials || []).map(s => String(s).trim()).filter(Boolean)
    if (needsSerials && serials.length !== qtyNum) {
      notify(`Please scan/enter all ${qtyNum} serial numbers. Currently have ${serials.length}.`, 'error')
      return
    }

    setLoading(true)
    const newStock = selectedProduct.stock + qtyNum
    try {
      if (isSupabaseConfigured()) {
        await inventoryService.receiveStock(selectedProduct.id, effectiveSiteId, qtyNum, form.notes, user?.id)
        if (needsSerials && serials.length) {
          await serialsService.registerSerials(selectedProduct.id, effectiveSiteId, serials)
        }
      }
      
      // Update local state
      setProducts?.(ps => ps.map(p => String(p.id) === String(selectedProduct.id) ? { ...p, stock: newStock } : p))
      addAudit?.(user, 'Goods Received', 'Inventory', form.notes ? `+${qtyNum} — ${form.notes}` : `+${qtyNum}`)
      
      notify(`Successfully received ${qtyNum}× ${selectedProduct.name}${needsSerials ? ` (${serials.length} serials captured)` : ''}`, 'success')
      setForm({ productId: '', qty: '', notes: '', serials: [] })
    } catch (err) {
      notify(err?.message || 'Failed to record receipt', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text }}>📥 Receive Stock</div>
          <p style={{ color: t.text3, marginTop: 4, fontSize: 13 }}>Scan incoming items into your site inventory.</p>
        </div>
        <Btn t={t} variant="secondary" onClick={() => navigate('/app/inventory')}>Back to Inventory</Btn>
      </div>

      <Card t={t} style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <Select
            t={t} label="Product to Receive"
            value={form.productId}
            onChange={v => setForm({ ...form, productId: v, qty: '', serials: [] })}
            options={[
              { value: '', label: '— Search or select product —' }, 
              ...(products || []).map(p => ({ value: String(p.id), label: `${p.emoji || '📦'} ${p.name} (Current stock: ${p.stock})` }))
            ]}
          />

          {selectedProduct && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: t.bg3, padding: 12, borderRadius: 12 }}>
              <ImgWithFallback src={selectedProduct.image_url || selectedProduct.image || PRODUCT_IMAGES[selectedProduct.name]} alt={selectedProduct.name} emoji={selectedProduct.emoji} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 800, color: t.text }}>{selectedProduct.name}</div>
                <div style={{ fontSize: 13, color: t.text3 }}>SKU: {selectedProduct.sku} | Track Serials: {selectedProduct.track_serial ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          <Input 
            t={t} 
            label="Quantity Received" 
            value={form.qty} 
            onChange={v => {
              const q = parseInt(v) || 0
              setForm(f => ({ ...f, qty: v, serials: Array.from({ length: q }, (_, i) => f.serials[i] || '') }))
            }} 
            type="number" 
            placeholder="0"
          />

          {needsSerials && (
            <div style={{ background: t.accent + '15', border: `1px solid ${t.accent}40`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Scan Serial Numbers (Required: {qtyNum})</span>
                <Badge t={t} text={`${form.serials.filter(Boolean).length} / ${qtyNum} scanned`} color={form.serials.filter(Boolean).length === qtyNum ? 'green' : 'yellow'} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {Array.from({ length: qtyNum }).map((_, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <input 
                      style={{ 
                        width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, 
                        border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontFamily: 'monospace' 
                      }}
                      placeholder={`Serial #${i + 1}`}
                      value={form.serials[i] || ''}
                      onChange={e => setForm(f => ({ ...f, serials: f.serials.map((s, idx) => idx === i ? e.target.value : s) }))}
                    />
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔢</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Notes (Optional)</label>
            <textarea 
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Received from Supplier X, PO #1234"
              style={{ width: '100%', height: 80, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: t.input, color: t.text, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <Btn t={t} onClick={handleReceiving} disabled={loading || !selectedProduct || qtyNum <= 0} style={{ padding: '16px 20px', fontSize: 15 }}>
            {loading ? 'Processing...' : `Confirm Receipt of ${qtyNum} Units`}
          </Btn>
        </div>
      </Card>
    </div>
  )
}
