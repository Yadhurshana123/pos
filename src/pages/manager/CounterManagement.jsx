import { useState } from 'react'
import { Btn, Input, Badge, Card, Modal } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'

export const CounterManagement = ({ counters, setCounters, orders, addAudit, currentUser, t, settings }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', location: '' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Counter Management</div>
        <Btn t={t} onClick={() => setShowAdd(true)}>+ Add Counter</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,90vw),1fr))', gap: 14 }}>
        {counters.map(c => {
          const rev = orders.filter(o => o.counter === c.name).reduce((s, o) => s + o.total, 0)
          const cnt = orders.filter(o => o.counter === c.name).length
          return (
            <Card t={t} key={c.id} style={{ borderTop: `4px solid ${c.active ? t.green : t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>🏪 {c.name}</div>
                  <div style={{ fontSize: 12, color: t.text3 }}>📍{c.location}</div>
                </div>
                <Badge t={t} text={c.active ? 'Active' : 'Off'} color={c.active ? 'green' : 'red'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[['Revenue', fmt(rev, settings?.sym), t.accent], ['Orders', cnt, t.blue]].map(([k, v, col]) => (
                  <div key={k} style={{ background: t.bg3, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: col }}>{v}</div>
                    <div style={{ fontSize: 10, color: t.text3 }}>{k}</div>
                  </div>
                ))}
              </div>
              <Btn
                t={t} variant={c.active ? 'danger' : 'success'} size="sm" fullWidth
                onClick={() => {
                  setCounters(cs => cs.map(x => x.id === c.id ? { ...x, active: !x.active } : x))
                  notify(`Counter ${c.name} ${c.active ? 'deactivated' : 'activated'}`, 'info')
                }}
              >
                {c.active ? 'Deactivate' : 'Activate'}
              </Btn>
            </Card>
          )
        })}
      </div>

      {showAdd && (
        <Modal t={t} title="Add Counter" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Input t={t} label="Counter Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Counter 4" required />
            <Input t={t} label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="e.g. North Entrance" required />
            <Btn t={t} onClick={() => {
              setCounters(cs => [...cs, { id: `c${Date.now()}`, ...form, active: true }])
              addAudit(currentUser, 'Counter Added', 'Counters', form.name)
              notify(`Counter ${form.name} added!`, 'success')
              setShowAdd(false)
              setForm({ name: '', location: '' })
            }} disabled={!form.name}>
              Add Counter
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
