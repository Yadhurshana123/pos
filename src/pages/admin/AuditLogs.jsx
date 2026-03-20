import { useState } from 'react'
import { Badge, Card, Table } from '@/components/ui'

export const AuditLogs = ({ auditLogs, t }) => {
  const [f, setF] = useState('all')
  const mods = ['all', ...new Set(auditLogs.map(l => l.module))]
  const fil = f === 'all' ? auditLogs : auditLogs.filter(l => l.module === f)
  const roleColors = { admin: 'red', manager: 'yellow', cashier: 'green', customer: 'blue', system: 'purple' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Audit Logs</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {mods.map(m => (
          <button
            key={m}
            onClick={() => setF(m)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${f === m ? t.accent : t.border}`,
              background: f === m ? t.accent + '15' : 'transparent',
              color: f === m ? t.accent : t.text3,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          t={t}
          cols={['ID', 'User', 'Role', 'Action', 'Module', 'Details', 'Time']}
          rows={fil.map(l => [
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: t.text3 }}>{l.id}</span>,
            l.user,
            <Badge t={t} text={l.role} color={roleColors[l.role] || 'blue'} />,
            <Badge t={t} text={l.action} color="blue" />,
            l.module,
            <span style={{ fontSize: 12 }}>{l.details}</span>,
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: t.text3 }}>{l.timestamp}</span>,
          ])}
        />
      </Card>
    </div>
  )
}
