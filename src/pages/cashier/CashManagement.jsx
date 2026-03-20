import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useCashStore } from '@/stores/cashStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Btn, Input, Badge, Card, StatCard, Modal, Table } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt, ts, genId } from '@/lib/utils'

export const CashManagement = ({ addAudit, settings, t: tProp }) => {
  const { t: tCtx } = useTheme()
  const { currentUser } = useAuth()
  const t = tProp || tCtx

  const { session, movements, history, openTill: storeOpenTill, addMovement, closeTill: storeCloseTill, loadSession } = useCashStore()
  
  const [openFloat, setOpenFloat] = useState('100')
  const [showDrop, setShowDrop] = useState(false)
  const [showLift, setShowLift] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [dropAmt, setDropAmt] = useState('')
  const [dropNote, setDropNote] = useState('')
  const [liftAmt, setLiftAmt] = useState('')
  const [liftNote, setLiftNote] = useState('')
  const [closeActual, setCloseActual] = useState('')

  // Load active session from Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      const counterId = currentUser?.counter_id || 'c0000000-0000-0000-0000-000000000001'
      loadSession(counterId)
    }
  }, [currentUser])

  const cashIn = movements.filter(m => m.type === 'cash-in' || m.type === 'lift' || m.type === 'sale').reduce((s, m) => s + Number(m.amount), 0)
  const cashOut = movements.filter(m => m.type === 'cash-out' || m.type === 'drop' || m.type === 'refund').reduce((s, m) => s + Number(m.amount), 0)
  const expected = session ? Number(session.openFloat) + cashIn - cashOut : 0

  const openTill = async () => {
    const amt = parseFloat(openFloat)
    if (isNaN(amt) || amt < 0) { notify('Enter a valid float amount', 'error'); return }
    await storeOpenTill(currentUser, amt)
    if (addAudit) addAudit({ action: 'Till Opened', detail: `Float: ${fmt(amt, settings?.sym)}`, user: currentUser?.name || 'Cashier' })
    notify(`Till opened with ${fmt(amt, settings?.sym)} float`, 'success')
  }

  const doCashDrop = async () => {
    const amt = parseFloat(dropAmt)
    if (isNaN(amt) || amt <= 0) { notify('Enter a valid amount', 'error'); return }
    if (amt > expected) { notify('Cannot drop more than expected balance', 'error'); return }
    await addMovement('drop', amt, dropNote.trim() || 'Cash drop', currentUser)
    if (addAudit) addAudit({ action: 'Cash Drop', detail: `${fmt(amt, settings?.sym)} — ${dropNote || 'No note'}`, user: currentUser?.name || 'Cashier' })
    notify(`Cash drop: ${fmt(amt, settings?.sym)}`, 'success')
    setShowDrop(false); setDropAmt(''); setDropNote('')
  }

  const doCashLift = async () => {
    const amt = parseFloat(liftAmt)
    if (isNaN(amt) || amt <= 0) { notify('Enter a valid amount', 'error'); return }
    await addMovement('lift', amt, liftNote.trim() || 'Cash lift', currentUser)
    if (addAudit) addAudit({ action: 'Cash Lift', detail: `${fmt(amt, settings?.sym)} — ${liftNote || 'No note'}`, user: currentUser?.name || 'Cashier' })
    notify(`Cash lift: ${fmt(amt, settings?.sym)}`, 'success')
    setShowLift(false); setLiftAmt(''); setLiftNote('')
  }

  const closeTill = async () => {
    const actual = parseFloat(closeActual)
    if (isNaN(actual) || actual < 0) { notify('Enter actual cash amount', 'error'); return }
    // Close modal first to avoid null session crash during re-render
    setShowClose(false); setCloseActual('')
    const savedExpected = expected
    const closed = await storeCloseTill(actual, savedExpected, currentUser)
    if (closed) {
      if (addAudit) addAudit({ action: 'Till Closed', detail: `Expected: ${fmt(savedExpected, settings?.sym)}, Actual: ${fmt(actual, settings?.sym)}, Variance: ${fmt(closed.variance, settings?.sym)}`, user: currentUser?.name || 'Cashier' })
      notify(`Till closed. Variance: ${fmt(closed.variance, settings?.sym)}`, closed.variance === 0 ? 'success' : 'warning')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Cash Management</div>

      {!session ? (
        <Card t={t}>
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 6 }}>Till is Closed</div>
            <div style={{ fontSize: 13, color: t.text3, marginBottom: 20 }}>Open the till to start a new cash session</div>
            <div style={{ maxWidth: 260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input t={t} label="Opening Float" value={openFloat} onChange={setOpenFloat} placeholder="100.00" type="number" />
              <Btn t={t} variant="success" fullWidth onClick={openTill}>🔓 Open Till</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Shift already started – compact message with option to close and start new */}
          <Card t={t} style={{ background: t.bg3, borderLeft: `4px solid ${t.green}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 4 }}>Shift already started today</div>
                <div style={{ fontSize: 13, color: t.text3 }}>Opened at {session.openedAt} by {session.openedBy}</div>
              </div>
              <Btn t={t} variant="danger" onClick={() => setShowClose(true)}>🔒 Close & Start New Shift</Btn>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,45vw),1fr))', gap: 14 }}>
            <StatCard t={t} title="Opening Float" value={fmt(session.openFloat, settings?.sym)} color={t.blue} icon="💵" />
            <StatCard t={t} title="Cash In" value={fmt(cashIn, settings?.sym)} color={t.green} icon="📥" />
            <StatCard t={t} title="Cash Out" value={fmt(cashOut, settings?.sym)} color={t.red} icon="📤" />
            <StatCard t={t} title="Expected Balance" value={fmt(expected, settings?.sym)} color={t.accent} icon="🧮" />
          </div>

          <Card t={t}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Active Session</div>
                <div style={{ fontSize: 12, color: t.text3 }}>Opened at {session.openedAt} by {session.openedBy}</div>
              </div>
              <Badge t={t} text="Open" color="green" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn t={t} variant="secondary" onClick={() => setShowDrop(true)}>📤 Cash Drop</Btn>
              <Btn t={t} variant="secondary" onClick={() => setShowLift(true)}>📥 Cash Lift</Btn>
              <Btn t={t} variant="secondary" onClick={() => setShowClose(true)}>🔒 Close Till</Btn>
            </div>
          </Card>

          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Session Movements</div>
            </div>
            <Table t={t} cols={['Time', 'Type', 'Amount', 'Note', 'By']}
              rows={movements.map(m => [
                m.time,
                <Badge t={t} text={m.type} color={m.type === 'lift' || m.type === 'open' ? 'green' : m.type === 'drop' ? 'red' : 'blue'} />,
                <span style={{ fontWeight: 800, color: m.type === 'drop' ? t.red : t.green }}>{m.type === 'drop' ? '-' : '+'}{fmt(m.amount, settings?.sym)}</span>,
                m.note,
                m.by
              ])} empty="No movements yet" />
          </Card>
        </>
      )}

      {history.length > 0 && (
        <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Session History</div>
          </div>
          <Table t={t} cols={['Session', 'Opened', 'Closed', 'Float', 'Expected', 'Actual', 'Variance']}
            rows={history.map(h => [
              h.id,
              h.openedAt,
              h.closedAt,
              fmt(h.openFloat, settings?.sym),
              fmt(h.expectedCash, settings?.sym),
              fmt(h.actualCash, settings?.sym),
              <span style={{ fontWeight: 800, color: h.variance === 0 ? t.green : h.variance > 0 ? t.blue : t.red }}>
                {h.variance >= 0 ? '+' : ''}{fmt(h.variance, settings?.sym)}
              </span>
            ])} empty="No session history" />
        </Card>
      )}

      {showDrop && (
        <Modal t={t} title="📤 Cash Drop" subtitle="Remove cash from the till" onClose={() => { setShowDrop(false); setDropAmt(''); setDropNote('') }} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.bg3, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: t.text2 }}>
              Current expected balance: <strong style={{ color: t.accent }}>{fmt(expected, settings?.sym)}</strong>
            </div>
            <Input t={t} label="Amount" value={dropAmt} onChange={setDropAmt} placeholder="0.00" type="number" />
            <Input t={t} label="Note (optional)" value={dropNote} onChange={setDropNote} placeholder="Reason for drop" />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="secondary" fullWidth onClick={() => { setShowDrop(false); setDropAmt(''); setDropNote('') }}>Cancel</Btn>
              <Btn t={t} variant="danger" fullWidth onClick={doCashDrop}>Confirm Drop</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showLift && (
        <Modal t={t} title="📥 Cash Lift" subtitle="Add cash to the till" onClose={() => { setShowLift(false); setLiftAmt(''); setLiftNote('') }} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input t={t} label="Amount" value={liftAmt} onChange={setLiftAmt} placeholder="0.00" type="number" />
            <Input t={t} label="Note (optional)" value={liftNote} onChange={setLiftNote} placeholder="Reason for lift" />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="secondary" fullWidth onClick={() => { setShowLift(false); setLiftAmt(''); setLiftNote('') }}>Cancel</Btn>
              <Btn t={t} variant="success" fullWidth onClick={doCashLift}>Confirm Lift</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showClose && session && (
        <Modal t={t} title="🔒 Close & Start New Shift" subtitle="End current session, then you can open a new shift" onClose={() => { setShowClose(false); setCloseActual('') }} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: t.bg3, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.text2, marginBottom: 4 }}>
                <span>Opening Float</span><span style={{ fontWeight: 700 }}>{fmt(session.openFloat, settings?.sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.green, marginBottom: 4 }}>
                <span>Cash In</span><span style={{ fontWeight: 700 }}>+{fmt(cashIn, settings?.sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.red, marginBottom: 8 }}>
                <span>Cash Out</span><span style={{ fontWeight: 700 }}>-{fmt(cashOut, settings?.sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: t.text, paddingTop: 8, borderTop: `2px solid ${t.border}` }}>
                <span>Expected</span><span style={{ color: t.accent }}>{fmt(expected, settings?.sym)}</span>
              </div>
            </div>

            <Input t={t} label="Actual Cash in Till" value={closeActual} onChange={setCloseActual} placeholder="0.00" type="number" />

            {closeActual && !isNaN(parseFloat(closeActual)) && (
              <div style={{
                background: parseFloat(closeActual) === expected ? t.greenBg : t.yellowBg,
                border: `1px solid ${parseFloat(closeActual) === expected ? t.greenBorder : t.yellowBorder}`,
                borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(closeActual) === expected ? t.green : t.yellow }}>Variance</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: parseFloat(closeActual) === expected ? t.green : t.yellow }}>
                  {(parseFloat(closeActual) - expected) >= 0 ? '+' : ''}{fmt(Math.round((parseFloat(closeActual) - expected) * 100) / 100, settings?.sym)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="secondary" fullWidth onClick={() => { setShowClose(false); setCloseActual('') }}>Cancel</Btn>
              <Btn t={t} variant="danger" fullWidth onClick={closeTill}>🔒 Close & Start New Shift</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
