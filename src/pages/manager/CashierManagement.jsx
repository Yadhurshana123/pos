import { useState } from 'react'
import { Btn, Input, Badge, Card, StatCard, Modal, Table, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts } from '@/lib/utils'

export const CashierManagement = ({ users, setUsers, counters, orders, addAudit, currentUser, t, settings }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [editC, setEditC] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'cash123', counter: counters[0]?.name || '' })
  const cashiers = users.filter(u => u.role === 'cashier')

  const resetForm = () => { setForm({ name: '', email: '', phone: '', password: 'cash123', counter: counters[0]?.name || '' }); setEditC(null) }

  const save = () => {
    if (editC) {
      setUsers(us => us.map(u => u.id === editC.id ? { ...u, ...form } : u))
      addAudit(currentUser, 'Cashier Updated', 'Staff', form.name)
      notify(form.name + ' updated!', 'success')
    } else {
      const c2 = { id: Date.now(), ...form, role: 'cashier', avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), active: true, joinDate: ts(), loyaltyPoints: 0, tier: 'N/A' }
      setUsers(us => [...us, c2])
      addAudit(currentUser, 'Cashier Added', 'Staff', form.name + ' at ' + form.counter)
      notify(form.name + ' added as cashier!', 'success')
    }
    setShowAdd(false)
    resetForm()
  }

  const remove = (c2) => { setUsers(us => us.filter(u => u.id !== c2.id)); addAudit(currentUser, 'Cashier Removed', 'Staff', c2.name); notify(c2.name + ' removed', 'warning') }
  const toggle = (c2) => { setUsers(us => us.map(u => u.id === c2.id ? { ...u, active: !u.active } : u)); notify(c2.name + ' ' + (c2.active ? 'deactivated' : 'activated'), 'info') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Cashier Management</div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,45vw),1fr))', gap: 12, flex: 1 }}>
          <StatCard t={t} title="Total Cashiers" value={cashiers.length} color={t.green} icon="🛒" />
          <StatCard t={t} title="Active" value={cashiers.filter(c => c.active).length} color={t.blue} icon="✅" />
          <StatCard t={t} title="Inactive" value={cashiers.filter(c => !c.active).length} color={t.red} icon="⏸️" />
        </div>
        <Btn t={t} onClick={() => { resetForm(); setShowAdd(true) }}>+ Add Cashier</Btn>
      </div>

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          t={t}
          cols={['Cashier', 'Email', 'Counter', 'Orders', 'Revenue', 'Status', 'Actions']}
          rows={cashiers.map(c2 => {
            const myOrds = orders.filter(o => o.cashierId === c2.id)
            const rev = myOrds.reduce((s, o) => s + o.total, 0)
            return [
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: t.green + '20', border: `2px solid ${t.green}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: t.green }}>{c2.avatar}</div>
                <span style={{ fontWeight: 700, color: t.text }}>{c2.name}</span>
              </div>,
              <span style={{ fontSize: 12, color: t.text3 }}>{c2.email}</span>,
              <span style={{ fontSize: 12, color: t.text2 }}>{c2.counter || '—'}</span>,
              <span style={{ fontWeight: 700, color: t.blue }}>{myOrds.length}</span>,
              <span style={{ fontWeight: 700, color: t.accent }}>{fmt(rev, settings?.sym)}</span>,
              <Badge t={t} text={c2.active ? 'Active' : 'Inactive'} color={c2.active ? 'green' : 'red'} />,
              <div style={{ display: 'flex', gap: 5 }}>
                <Btn t={t} variant="secondary" size="sm" onClick={() => { setEditC(c2); setForm({ name: c2.name, email: c2.email, phone: c2.phone || '', password: c2.password || '', counter: c2.counter || '' }); setShowAdd(true) }}>Edit</Btn>
                <Btn t={t} variant={c2.active ? 'danger' : 'success'} size="sm" onClick={() => toggle(c2)}>{c2.active ? 'Off' : 'On'}</Btn>
                <Btn t={t} variant="ghost" size="sm" onClick={() => remove(c2)}>🗑</Btn>
              </div>,
            ]
          })}
          empty="No cashiers added yet"
        />
      </Card>

      {showAdd && (
        <Modal t={t} title={editC ? 'Edit Cashier' : 'Add New Cashier'} onClose={() => { setShowAdd(false); resetForm() }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Input t={t} label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Input t={t} label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
              <Input t={t} label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input t={t} label="Password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" />
            </div>
            <Select t={t} label="Assigned Counter" value={form.counter} onChange={v => setForm(f => ({ ...f, counter: v }))} options={[{ value: '', label: '— Unassigned —' }, ...counters.filter(c => c.active).map(c => ({ value: c.name, label: `${c.name} — ${c.location}` }))]} />
            <div style={{ background: t.blueBg, border: `1px solid ${t.blueBorder}`, borderRadius: 9, padding: '10px 14px', fontSize: 12, color: t.blue }}>
              ℹ️ Cashier will be able to login with their email and password to access the POS Terminal.
            </div>
            <Btn t={t} onClick={save} disabled={!form.name || !form.email}>{editC ? 'Update Cashier' : 'Add Cashier'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
