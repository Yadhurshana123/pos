import { useState } from 'react'
import { Badge, Card, Table, Btn } from '@/components/ui'
import { UserPlus, X } from 'lucide-react'

export const UserManagement = ({ users, setUsers, addAudit, addGlobalNotif, t }) => {
  const [f, setF] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const fil = f === 'all' ? users : users.filter(u => u.role === f)
  const roles = ['all', 'admin', 'manager', 'cashier', 'customer']
  const roleColors = { admin: 'red', manager: 'yellow', cashier: 'green', customer: 'blue' }
  const addableRoles = ['admin', 'manager', 'cashier', 'staff']

  // Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('manager')

  const handleCreateUser = (e) => {
    e.preventDefault()
    if(!newName || !newEmail || !newPassword) {
      if(addGlobalNotif) addGlobalNotif("Please fill all required fields", "error")
      return
    }

    const newUser = {
      id: Date.now(), // Generate a mock ID
      name: newName,
      email: newEmail,
      password: newPassword, // Note: plain text only for mock purposes
      role: newRole,
      avatar: newName.substring(0, 2).toUpperCase(),
      active: true,
      joinDate: new Date().toISOString().split('T')[0],
      loyaltyPoints: newRole === 'customer' ? 0 : undefined,
      tier: newRole === 'customer' ? 'N/A' : undefined
    }

    if(setUsers) setUsers(prev => [newUser, ...prev])
    if(addAudit) addAudit({ name: 'System', role: 'system' }, 'create', 'Users', `Created new ${newRole} account: ${newName}`)
    if(addGlobalNotif) addGlobalNotif(`Successfully created new ${newRole}: ${newName}`, "success")
    
    // Reset and close
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('manager')
    setShowModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>User Management</div>
        <Btn variant="primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} /> Add User
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setF(r)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${f === r ? t.accent : t.border}`,
              background: f === r ? t.accent + '15' : 'transparent',
              color: f === r ? t.accent : t.text3,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          t={t}
          cols={['User', 'Email', 'Role', 'Loyalty', 'Status']}
          rows={fil.map(u => [
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: t.accent + '15', border: `2px solid ${t.accent}30`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: t.accent }}>
                {u.avatar}
              </div>
              <span style={{ fontWeight: 600, color: t.text }}>{u.name}</span>
            </div>,
            u.email,
            <Badge t={t} text={u.role} color={roleColors[u.role] || 'blue'} />,
            u.role === 'customer'
              ? <span style={{ color: t.yellow, fontWeight: 700 }}>⭐{u.loyaltyPoints || 0}</span>
              : '—',
            <Badge t={t} text={u.active ? 'Active' : 'Off'} color={u.active ? 'green' : 'red'} />,
          ])}
        />
      </Card>

      {/* Create User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: t.bg, borderRadius: 12, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: 0 }}>Create New User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: t.text3, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text3, marginBottom: 4 }}>FULL NAME</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text3, marginBottom: 4 }}>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="e.g. john@example.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text3, marginBottom: 4 }}>PASSWORD</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Create a strong password"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text3, marginBottom: 4 }}>ROLE</label>
                <select 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, textTransform: 'capitalize', boxSizing: 'border-box' }}
                >
                  {addableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Btn type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Btn>
                <Btn type="submit" variant="primary" style={{ flex: 1 }}>Create User</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
