import { useState } from 'react'
import { Badge, Card, Table } from '@/components/ui'

export const UserManagement = ({ users, t }) => {
  const [f, setF] = useState('all')
  const fil = f === 'all' ? users : users.filter(u => u.role === f)
  const roles = ['all', 'admin', 'manager', 'cashier', 'customer']
  const roleColors = { admin: 'red', manager: 'yellow', cashier: 'green', customer: 'blue' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>User Management</div>

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
            <Badge t={t} text={u.role} color={roleColors[u.role]} />,
            u.role === 'customer'
              ? <span style={{ color: t.yellow, fontWeight: 700 }}>⭐{u.loyaltyPoints || 0}</span>
              : '—',
            <Badge t={t} text={u.active ? 'Active' : 'Off'} color={u.active ? 'green' : 'red'} />,
          ])}
        />
      </Card>
    </div>
  )
}
