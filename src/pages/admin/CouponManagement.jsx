import { useState } from 'react'
import { Btn, Input, Badge, Card, Modal, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'

export const CouponManagement = ({ coupons, setCoupons, addAudit, currentUser, t, settings }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', type: 'percent', value: 10,
    minOrder: 0, maxUses: 100, active: true, expiry: '2026-12-31',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>🎟️ Coupons & Vouchers</div>
        <Btn t={t} onClick={() => setShowAdd(true)}>+ Add Coupon</Btn>
      </div>

      <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: t.yellow, fontWeight: 700 }}>
        💡 Demo codes to test at POS checkout: &nbsp;
        <code style={{ letterSpacing: 2 }}>FANDAY10</code> ·{' '}
        <code style={{ letterSpacing: 2 }}>WELCOME20</code> ·{' '}
        <code style={{ letterSpacing: 2 }}>FREESHIP</code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,90vw),1fr))', gap: 14 }}>
        {coupons.map(c => (
          <Card t={t} key={c.id} style={{ borderLeft: `4px solid ${c.active ? t.accent : t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: t.text, fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</span>
              <Badge t={t} text={c.active ? 'Active' : 'Inactive'} color={c.active ? 'green' : 'red'} />
            </div>
            <div style={{ fontSize: 13, color: t.text2, marginBottom: 10 }}>{c.description}</div>
            {[
              ['Type', c.type === 'percent' ? `${c.value}% off` : c.type === 'fixed' ? `${fmt(c.value, settings?.sym)} off` : 'Free delivery'],
              ['Min Order', fmt(c.minOrder, settings?.sym)],
              ['Uses', `${c.uses}/${c.maxUses}`],
              ['Expires', c.expiry],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: t.text3 }}>{k}</span>
                <span style={{ color: t.text, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn t={t} variant={c.active ? 'danger' : 'success'} size="sm" style={{ flex: 1 }} onClick={() => setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, active: !x.active } : x))}>
                {c.active ? 'Disable' : 'Enable'}
              </Btn>
              <Btn t={t} variant="ghost" size="sm" onClick={() => { setCoupons(cs => cs.filter(x => x.id !== c.id)); notify('Coupon deleted', 'warning') }}>
                Delete
              </Btn>
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Modal t={t} title="Add Coupon" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input t={t} label="Code" value={form.code} onChange={v => setForm(f => ({ ...f, code: v.toUpperCase() }))} placeholder="SAVE20" required />
              <Input t={t} label="Discount Value" value={form.value} onChange={v => setForm(f => ({ ...f, value: +v }))} type="number" />
              <Input t={t} label={`Min Order (${settings?.sym || '£'})`} value={form.minOrder} onChange={v => setForm(f => ({ ...f, minOrder: +v }))} type="number" />
              <Input t={t} label="Max Uses" value={form.maxUses} onChange={v => setForm(f => ({ ...f, maxUses: +v }))} type="number" />
              <Input t={t} label="Expiry Date" value={form.expiry} onChange={v => setForm(f => ({ ...f, expiry: v }))} type="date" />
            </div>
            <Input t={t} label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            <Select t={t} label="Discount Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: 'percent', label: 'Percentage Off' }, { value: 'fixed', label: 'Fixed Amount Off' }, { value: 'delivery', label: 'Free Delivery' }]} />
            <Btn t={t} onClick={() => {
              setCoupons(cs => [...cs, { id: Date.now(), ...form, uses: 0 }])
              addAudit(currentUser, 'Coupon Created', 'Coupons', `${form.code} created`)
              notify(`Coupon ${form.code} created!`, 'success')
              setShowAdd(false)
            }} disabled={!form.code}>
              Add Coupon
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
