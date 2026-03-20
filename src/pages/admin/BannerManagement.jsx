import { useState } from 'react'
import { Btn, Input, Badge, Card, Modal, Select, Toggle } from '@/components/ui'
import { notify } from '@/components/shared'
import { isBannerActive } from '@/lib/utils'
import { CATEGORIES } from '@/lib/constants'

export const BannerManagement = ({ banners, setBanners, addAudit, currentUser, t }) => {
  const [showAdd, setShowAdd] = useState(false)
  const empty = {
    title: '', subtitle: '', cta: 'Shop Now', color: '#dc2626',
    grad: 'linear-gradient(135deg,#dc2626,#7f1d1d)', emoji: '⚽', active: true,
    offerType: 'none', offerTarget: '', offerDiscount: 0,
    startDate: new Date().toISOString().slice(0, 16), endDate: '2026-12-31T23:59', image: '',
  }
  const [form, setForm] = useState(empty)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setForm(f => ({ ...f, image: ev.target.result }))
      reader.readAsDataURL(file)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>🖼️ Banner & Offer Management</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 3 }}>Active banners display on the login & guest pages</div>
        </div>
        <Btn t={t} onClick={() => setShowAdd(true)}>+ Add Banner</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
        {banners.map(b => {
          const active = isBannerActive(b)
          return (
            <Card t={t} key={b.id} style={{ borderTop: `4px solid ${b.color}`, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 120, borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
                {b.image ? (
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ background: b.grad, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32 }}>{b.emoji}</span>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{b.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{b.subtitle}</div>
                  </div>
                </div>
              </div>
              {b.offerType !== 'none' && (
                <div style={{ background: t.greenBg, border: `1px solid ${t.greenBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: t.green, fontWeight: 700 }}>
                  🎁 Offer: {b.offerDiscount}% off {b.offerTarget}
                </div>
              )}
              <div style={{ fontSize: 12, color: t.text3, marginBottom: 10 }}>
                <div>📅 Start: {b.startDate}</div>
                <div>📅 End: {b.endDate}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge t={t} text={active ? 'Live Now' : b.active ? 'Scheduled' : 'Hidden'} color={active ? 'green' : b.active ? 'yellow' : 'red'} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Toggle t={t} value={b.active} onChange={v => { setBanners(bs => bs.map(x => x.id === b.id ? { ...x, active: v } : x)); notify(`Banner ${v ? 'activated' : 'hidden'}`, 'info') }} />
                  <Btn t={t} variant="danger" size="sm" onClick={() => { setBanners(bs => bs.filter(x => x.id !== b.id)); notify('Banner deleted', 'warning') }}>Del</Btn>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showAdd && (
        <Modal t={t} title="Add New Banner" onClose={() => setShowAdd(false)} width={600}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input t={t} label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
              <Input t={t} label="Subtitle" value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} />
              <Input t={t} label="CTA Text" value={form.cta} onChange={v => setForm(f => ({ ...f, cta: v }))} />
              <Input t={t} label="Emoji" value={form.emoji} onChange={v => setForm(f => ({ ...f, emoji: v }))} />
              <Input t={t} label="Image URL" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://..." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>Upload Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none' }} />
                {form.image && (
                  <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                    <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <Input t={t} label="Start Date & Time" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="datetime-local" />
              <Input t={t} label="End Date & Time" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} type="datetime-local" />
            </div>
            <Select t={t} label="Offer Type" value={form.offerType} onChange={v => setForm(f => ({ ...f, offerType: v }))} options={[{ value: 'none', label: 'No Offer' }, { value: 'category', label: 'Category Discount' }]} />
            {form.offerType === 'category' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Select t={t} label="Category" value={form.offerTarget} onChange={v => setForm(f => ({ ...f, offerTarget: v }))} options={CATEGORIES.filter(c => c !== 'All').map(c => ({ value: c, label: c }))} />
                <Input t={t} label="Discount %" value={form.offerDiscount} onChange={v => setForm(f => ({ ...f, offerDiscount: +v }))} type="number" />
              </div>
            )}
            {form.title && (
              <div style={{ position: 'relative', height: 120, borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                {form.image ? (
                  <img src={form.image} alt={form.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ background: form.grad, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32 }}>{form.emoji}</span>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{form.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>{form.subtitle}</div>
                  </div>
                </div>
              </div>
            )}
            <Btn t={t} onClick={() => {
              setBanners(bs => [...bs, { id: Date.now(), ...form }])
              addAudit(currentUser, 'Banner Created', 'Banners', `${form.title} banner added`)
              notify('Banner added!', 'success')
              setShowAdd(false)
              setForm(empty)
            }} disabled={!form.title}>
              Add Banner
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
