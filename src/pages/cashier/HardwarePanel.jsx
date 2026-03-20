import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Btn, Badge, Card } from '@/components/ui'
import { notify } from '@/components/shared'

export const HardwarePanel = ({ addAudit, settings, t: tProp }) => {
  const { t: tCtx } = useTheme()
  const { currentUser } = useAuth()
  const t = tProp || tCtx
  const user = currentUser

  const [devs, setDevs] = useState([
    { id: 'scan', name: 'Barcode Scanner', type: 'Input', status: 'connected', icon: '📷', serial: 'BS-2024-001' },
    { id: 'print', name: 'Receipt Printer', type: 'Output', status: 'connected', icon: '🖨️', serial: 'RP-2024-002' },
    { id: 'card', name: 'Card Terminal', type: 'I/O', status: 'connected', icon: '💳', serial: 'CT-2024-003' },
    { id: 'drawer', name: 'Cash Drawer', type: 'Output', status: 'connected', icon: '💰', serial: 'CD-2024-004' },
  ])
  const [test, setTest] = useState({})

  const toggleDevice = (d) => {
    setDevs(ds => ds.map(x => {
      if (x.id !== d.id) return x
      const s = x.status === 'connected' ? 'disconnected' : 'connected'
      addAudit(user, `Device ${s}`, 'Hardware', x.name)
      notify(`${x.name} ${s}`, s === 'connected' ? 'success' : 'warning')
      return { ...x, status: s }
    }))
  }

  const testDevice = (d) => {
    setTest(x => ({ ...x, [d.id]: 'testing' }))
    setTimeout(() => {
      const simulatedResponses = {
        scan: 'Simulated: Barcode 123456789 read successfully',
        print: 'Simulated: Receipt printed (42 chars)',
        card: `Simulated: Card approved — ${settings?.sym || '£'}0.00`,
        drawer: 'Simulated: Drawer opened and closed OK',
      }
      setTest(x => ({ ...x, [d.id]: simulatedResponses[d.id] || 'Simulated: OK' }))
      notify(`${d.name} test passed! (Simulated)`, 'success')
      setTimeout(() => setTest(x => ({ ...x, [d.id]: null })), 2500)
    }, 1200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Hardware</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(260px,90vw),1fr))', gap: 14 }}>
        {devs.map(d => (
          <Card t={t} key={d.id} style={{ borderTop: `4px solid ${d.status === 'connected' ? t.green : t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 42, height: 42, background: d.status === 'connected' ? t.greenBg : t.bg3, border: `1px solid ${d.status === 'connected' ? t.greenBorder : t.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{d.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: t.text3 }}>{d.type} · {d.serial}</div>
                </div>
              </div>
              <Badge t={t} text={d.status} color={d.status === 'connected' ? 'green' : 'red'} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn t={t} variant={d.status === 'connected' ? 'danger' : 'success'} size="sm" style={{ flex: 1 }} onClick={() => toggleDevice(d)}>
                {d.status === 'connected' ? 'Disconnect' : 'Connect'}
              </Btn>
              <Btn t={t} variant="secondary" size="sm" style={{ flex: 1 }} disabled={d.status !== 'connected' || test[d.id] === 'testing'} onClick={() => testDevice(d)}>
                {test[d.id] === 'testing' ? 'Testing...' : typeof test[d.id] === 'string' ? '✓ Pass' : 'Test'}
              </Btn>
            </div>
            {test[d.id] && typeof test[d.id] === 'string' && test[d.id] !== 'testing' && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: t.bg3, borderRadius: 8, fontSize: 11, color: t.green, fontWeight: 700 }}>
                {test[d.id]}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
