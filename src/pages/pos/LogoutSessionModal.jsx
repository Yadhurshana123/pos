import { useState, useEffect } from 'react'
import { Modal, Btn, Input, Card, Badge } from '@/components/ui'
import { fmt } from '@/lib/utils'
import { ordersService } from '@/services'
import { notify } from '@/components/shared'

export const LogoutSessionModal = ({ t, user, session, cart, onClose, onConfirm, settings }) => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalSales: 0, cashPayments: 0, cardPayments: 0, refunds: 0, discounts: 0 })
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [managerPin, setManagerPin] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      if (!session || !user?.id) return
      try {
        let dateFrom = session.openedAtRaw
        if (!dateFrom) {
          console.warn('LogoutSessionModal: session.openedAtRaw missing, attempting to parse openedAt:', session.openedAt)
          const d = new Date(session.openedAt)
          if (!isNaN(d.getTime())) {
            dateFrom = d.toISOString()
          } else {
            console.error('LogoutSessionModal: Could not parse session.openedAt:', session.openedAt)
            // Fallback to 24h ago to at least show something, or keep it null to show 0
            dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        }
        
        console.log('LogoutSessionModal: Fetching summary for user', user.id, 'since', dateFrom)
        const data = await ordersService.fetchSessionSummary(user.id, dateFrom)
        setSummary(data || { totalSales: 0, cashPayments: 0, cardPayments: 0, refunds: 0, discounts: 0 })
      } catch (err) {
        console.error('LogoutSessionModal: Error loading summary:', err)
        notify('Failed to load session summary', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [user?.id, session])

  const expectedCash = Number(session?.openFloat || 0) + summary.cashPayments - summary.refunds
  const actual = actualCash === '' ? 0 : Number(actualCash)
  const variance = actual - expectedCash
  const hasMismatch = Math.abs(variance) > 0.01

  const openCartAlert = cart && cart.length > 0
  const pendingTxAlert = false // Placeholder for pending transactions if applicable

  const canLogout = !loading && 
                    actualCash !== '' && 
                    (!hasMismatch || notes.trim() !== '') &&
                    !openCartAlert

  const handleConfirm = () => {
    if (!canLogout) return
    onConfirm({
      actualCash: actual,
      expectedCash,
      notes,
      managerPin
    })
  }

  return (
    <Modal t={t} title="Close Shift & Logout" subtitle="Review and confirm your session before logging out" onClose={onClose} width={550}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Section 1: Sales Summary */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 700, color: t.text }}>
            <span>📊</span> Sales Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: t.bg3, padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.text3, marginBottom: 2 }}>Total Sales</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.text }}>{fmt(summary.totalSales, settings?.sym)}</div>
            </div>
            <div style={{ background: t.bg3, padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.text3, marginBottom: 2 }}>Discounts</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.orange }}>{fmt(summary.discounts, settings?.sym)}</div>
            </div>
            <div style={{ background: t.bg3, padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.text3, marginBottom: 2 }}>Cash Payments</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.green }}>{fmt(summary.cashPayments, settings?.sym)}</div>
            </div>
            <div style={{ background: t.bg3, padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.text3, marginBottom: 2 }}>Card/Other</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.blue }}>{fmt(summary.cardPayments, settings?.sym)}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Cash Reconciliation */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 700, color: t.text }}>
            <span>💰</span> Cash Reconciliation
          </div>
          <div style={{ background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: t.text2 }}>Expected Cash in Till</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: t.text }}>{fmt(expectedCash, settings?.sym)}</span>
            </div>
            
            <Input 
              t={t} 
              label="Actual Cash in Hand" 
              value={actualCash} 
              onChange={setActualCash} 
              placeholder="0.00" 
              type="number" 
              style={{ fontSize: 18, fontWeight: 800 }}
            />

            {actualCash !== '' && (
              <div style={{ 
                marginTop: 4,
                padding: '12px 16px', 
                borderRadius: 12, 
                background: hasMismatch ? t.red + '10' : t.green + '10',
                border: `1px solid ${hasMismatch ? t.red + '30' : t.green + '30'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: hasMismatch ? t.red : t.green }}>
                  {hasMismatch ? 'Difference Detected' : 'Cash Matched'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: hasMismatch ? t.red : t.green }}>
                  {variance > 0 ? '+' : ''}{fmt(variance, settings?.sym)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Notes (Conditional) */}
        {hasMismatch && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 700, color: t.red }}>
              <span>📝</span> Reason for Difference
            </div>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Please explain the mismatch..."
              style={{ 
                width: '100%', 
                height: 80, 
                padding: 12, 
                borderRadius: 10, 
                border: `1.5px solid ${t.red + '50'}`, 
                background: t.bg, 
                color: t.text,
                fontSize: 13,
                outline: 'none',
                resize: 'none'
              }}
            />
            <div style={{ marginTop: 10 }}>
              <Input 
                t={t} 
                label="Manager PIN (Required for Mismatch)" 
                value={managerPin} 
                onChange={setManagerPin} 
                placeholder="****" 
                type="password" 
              />
            </div>
          </div>
        )}

        {/* Section 4: Pending Alerts */}
        {(openCartAlert || pendingTxAlert) && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: t.red + '10', border: `1px solid ${t.red}40`, display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.red, marginBottom: 2 }}>System Alerts</div>
              {openCartAlert && <div style={{ fontSize: 12, color: t.text2 }}>• Cannot logout with items in the cart</div>}
              {pendingTxAlert && <div style={{ fontSize: 12, color: t.text2 }}>• Pending transaction in progress</div>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <Btn t={t} variant="ghost" fullWidth onClick={onClose} style={{ height: 48 }}>Cancel</Btn>
          <Btn 
            t={t} 
            variant="danger" 
            fullWidth 
            onClick={handleConfirm} 
            disabled={!canLogout}
            style={{ height: 48, opacity: canLogout ? 1 : 0.6 }}
          >
            🔒 Close Shift & Logout
          </Btn>
        </div>

      </div>
    </Modal>
  )
}
