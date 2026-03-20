import { useState } from 'react'
import { Btn, Input, Badge, Card, StatCard, Modal, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { ts } from '@/lib/utils'

export const StaffManagement = ({ users, setUsers, counters, addAudit, currentUser, t }) => {
  const [showAdd, setShowAdd] = useState(false)
  const [editStaff, setEditStaff] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'staff123', role: 'cashier', counter: counters[0]?.name || '' })
  const allStaff = users.filter(u => u.role === 'cashier' || u.role === 'staff')

  const resetForm = () => { setForm({ name: '', email: '', phone: '', password: 'staff123', role: 'cashier', counter: counters[0]?.name || '' }); setEditStaff(null) }

  const save = () => {
    if (editStaff) {
      setUsers(us => us.map(u => u.id === editStaff.id ? { ...u, ...form } : u))
      addAudit(currentUser, 'Staff Updated', 'Staff', form.name)
      notify(form.name + ' updated!', 'success')
    } else {
      const s = { id: Date.now(), ...form, avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), active: true, joinDate: ts(), loyaltyPoints: 0, tier: 'N/A' }
      setUsers(us => [...us, s])
      addAudit(currentUser, 'Staff Added', 'Staff', form.name + ' (' + form.role + ') at ' + form.counter)
      notify(form.name + ' added!', 'success')
    }
    setShowAdd(false)
    resetForm()
  }

  const remove = (s) => { setUsers(us => us.filter(u => u.id !== s.id)); addAudit(currentUser, 'Staff Removed', 'Staff', s.name); notify(s.name + ' removed', 'warning') }
  const toggle = (s) => { setUsers(us => us.map(u => u.id === s.id ? { ...u, active: !u.active } : u)); notify(s.name + ' ' + (s.active ? 'deactivated' : 'activated'), 'info') }

  const roleC = { cashier: t.green, staff: t.teal }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Staff Management</div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard t={t} title="Total Staff" value={allStaff.length} color={t.blue} icon="👥" />
          <StatCard t={t} title="Cashiers" value={allStaff.filter(s => s.role === 'cashier').length} color={t.green} icon="🛒" />
          <StatCard t={t} title="Staff" value={allStaff.filter(s => s.role === 'staff').length} color={t.teal} icon="🖥️" />
        </div>
        <Btn t={t} onClick={() => { resetForm(); setShowAdd(true) }}>+ Add Staff</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,90vw),1fr))', gap: 14 }}>
        {allStaff.map(s => (
          <Card t={t} key={s.id} style={{ borderTop: `4px solid ${roleC[s.role] || t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, background: (roleC[s.role] || t.accent) + '20', border: `2px solid ${(roleC[s.role] || t.accent)}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: roleC[s.role] || t.accent }}>{s.avatar}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{s.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                  <Badge t={t} text={s.role} color={s.role === 'cashier' ? 'green' : 'teal'} />
                  <Badge t={t} text={s.active ? 'Active' : 'Inactive'} color={s.active ? 'green' : 'red'} />
                </div>
              </div>
            </div>
            {[['Email', s.email], ['Phone', s.phone || '—'], ['Counter', s.counter || 'Unassigned'], ['Joined', s.joinDate || '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: t.text3 }}>{k}</span>
                <span style={{ color: t.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <Btn t={t} variant="secondary" size="sm" onClick={() => { setEditStaff(s); setForm({ name: s.name, email: s.email, phone: s.phone || '', password: s.password || '', role: s.role, counter: s.counter || '' }); setShowAdd(true) }}>✏️ Edit</Btn>
              <Btn t={t} variant={s.active ? 'danger' : 'success'} size="sm" onClick={() => toggle(s)}>{s.active ? 'Deactivate' : 'Activate'}</Btn>
              <Btn t={t} variant="ghost" size="sm" onClick={() => remove(s)}>🗑</Btn>
            </div>
          </Card>
        ))}
        {allStaff.length === 0 && (
          <Card t={t}>
            <div style={{ textAlign: 'center', padding: 30, color: t.text3 }}>No staff added yet. Click + Add Staff to get started.</div>
          </Card>
        )}
      </div>

      {showAdd && (
        <Modal t={t} title={editStaff ? 'Edit Staff Member' : 'Add Staff Member'} onClose={() => { setShowAdd(false); resetForm() }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Input t={t} label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Input t={t} label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
              <Input t={t} label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input t={t} label="Password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" />
            </div>
            <Select t={t} label="Role" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={[{ value: 'cashier', label: 'Cashier — POS access' }, { value: 'staff', label: 'Staff — Order management' }]} />
            <Select t={t} label="Assigned Counter" value={form.counter} onChange={v => setForm(f => ({ ...f, counter: v }))} options={[{ value: '', label: '— Unassigned —' }, ...counters.filter(c => c.active).map(c => ({ value: c.name, label: `${c.name} — ${c.location}` }))]} />
            <Btn t={t} onClick={save} disabled={!form.name || !form.email}>{editStaff ? 'Update Staff' : 'Add Staff Member'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
