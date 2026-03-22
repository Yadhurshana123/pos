import { useState, useEffect } from 'react'
import { fmt, genId } from '@/lib/utils'
import { Input, Btn } from '@/components/ui'
import { CardPaymentModal } from './CardPaymentModal'
import { QrPaymentModal } from './QrPaymentModal'

export function SplitPaymentDetailModal({
  open,
  onClose,
  cartTotal,
  settings,
  t,
  onCompleteSplitPayment,
}) {
  const [payments, setPayments] = useState([])
  const [activeTab, setActiveTab] = useState('cash')
  
  // Tab-specific inputs
  const [cashAmount, setCashAmount] = useState('')
  
  // Card inputs
  const [cardAmount, setCardAmount] = useState('')
  const [cardPhase, setCardPhase] = useState('initial')
  const [generatedLast4, setGeneratedLast4] = useState('')
  const [generatedRef, setGeneratedRef] = useState('')
  const [generatedExpiry, setGeneratedExpiry] = useState('')

  // QR inputs
  const [qrAmount, setQrAmount] = useState('')
  const [qrRef, setQrRef] = useState('')

  useEffect(() => {
    if (open) {
      setPayments([])
      setActiveTab('cash')
      setCashAmount(String(cartTotal))
      setCardAmount('')
      setCardPhase('initial')
      setGeneratedLast4('')
      setGeneratedRef('')
      setGeneratedExpiry('')
      setQrAmount('')
      setQrRef('')
    }
  }, [open, cartTotal])

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, cartTotal - totalPaid)
  const canComplete = totalPaid >= cartTotal - 0.01

  // Update default inputs when remaining changes
  useEffect(() => {
    if (activeTab === 'cash' && !cashAmount) setCashAmount(remaining > 0 ? String(remaining) : '')
    if (activeTab === 'card' && !cardAmount) setCardAmount(remaining > 0 ? String(remaining) : '')
    if (activeTab === 'qr' && !qrAmount) setQrAmount(remaining > 0 ? String(remaining) : '')
  }, [remaining, activeTab])

  if (!open) return null

  const handleAddPayment = (method, data) => {
    setPayments([...payments, { id: genId(), method: method, ...data }])
    
    // Clear inputs for the added method
    if (method === 'Cash') setCashAmount(remaining - data.amount > 0 ? String(remaining - data.amount) : '')
    if (method === 'Card') {
      setCardAmount(remaining - data.amount > 0 ? String(remaining - data.amount) : '')
      setCardPhase('initial')
      setGeneratedLast4('')
      setGeneratedRef('')
      setGeneratedExpiry('')
    }
    if (method === 'QR') {
      setQrAmount(remaining - data.amount > 0 ? String(remaining - data.amount) : '')
      setQrRef('')
    }
  }

  const removePayment = (id) => {
    setPayments(payments.filter(p => p.id !== id))
  }

  const onConfirm = () => {
    onCompleteSplitPayment(payments)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: t.card || '#fff',
          borderRadius: 16,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Split Payment
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{fmt(cartTotal, settings?.sym)}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: t.text3, fontWeight: 700 }}>Remaining Balance</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: remaining > 0 ? '#f87171' : '#4ade80' }}>
                {fmt(remaining, settings?.sym)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Left panel: Add Payment Form */}
          <div style={{ flex: 1, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.bg3 }}>
              {['cash', 'card', 'qr'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    border: 'none',
                    borderBottom: activeTab === tab ? `3px solid ${t.accent}` : '3px solid transparent',
                    background: activeTab === tab ? t.bg : 'transparent',
                    color: activeTab === tab ? t.text : t.text3,
                    fontWeight: activeTab === tab ? 900 : 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab === 'cash' ? '💵 Cash' : tab === 'card' ? '💳 Card' : '🤳 QR'}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {activeTab === 'cash' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>
                  <Input t={t} label="Cash Amount" value={cashAmount} onChange={setCashAmount} placeholder="0.00" type="number" />
                  <Btn t={t} disabled={!parseFloat(cashAmount) || parseFloat(cashAmount) <= 0} onClick={() => handleAddPayment('Cash', { amount: parseFloat(cashAmount) || 0 })} fullWidth>
                    Add Cash Payment
                  </Btn>
                </div>
              )}

              {activeTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>
                  <Input t={t} label="Amount to charge" value={cardAmount} onChange={(val) => { setCardAmount(val); setCardPhase('initial'); }} placeholder="0.00" type="number" />
                  
                  {cardPhase === 'initial' && (
                    <div style={{ marginTop: 8, padding: 18, border: `2px dashed ${t.border}`, borderRadius: 10, background: t.bg3, textAlign: 'center', cursor: 'pointer' }}
                         onClick={() => {
                           if (!parseFloat(cardAmount) || parseFloat(cardAmount) <= 0) return
                           setCardPhase('processing')
                           setTimeout(() => {
                             setGeneratedLast4(String(Math.floor(1000 + Math.random() * 9000)))
                             setGeneratedRef(String(Math.floor(100000 + Math.random() * 900000)))
                             const year = String((new Date().getFullYear() % 100) + Math.floor(Math.random() * 4) + 1).padStart(2, '0')
                             setGeneratedExpiry(`12/${year}`)
                             setCardPhase('detected')
                           }, 800)
                         }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Tap Card to Authorize</div>
                      <div style={{ fontSize: 11, color: t.text3, marginTop: 4 }}>Click here to simulate tapping {fmt(parseFloat(cardAmount) || 0, settings?.sym)} on the card reader</div>
                    </div>
                  )}

                  {cardPhase === 'processing' && (
                    <div style={{ marginTop: 8, padding: 24, border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg3, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.text2 }}>Processing... reading card</div>
                    </div>
                  )}

                  {cardPhase === 'detected' && (
                    <div style={{ marginTop: 8, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f172a', borderRadius: 8, color: '#e2e8f0' }}>
                          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Amount due</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#f87171' }}>{fmt(parseFloat(cardAmount) || 0, settings?.sym)}</span>
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: t.text3, fontWeight: 700 }}>Card (masked)</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.text }}>•••• •••• •••• {generatedLast4}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: t.text3, fontWeight: 700 }}>Expiry</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.text }}>{generatedExpiry}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ color: t.text3, fontWeight: 700 }}>Auth / ref #</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: t.accent, textAlign: 'right', wordBreak: 'break-all' }}>{generatedRef}</span>
                          </div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.green}50`, background: t.greenBg || '#ecfdf5' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: t.green }}>✓ Sufficient balance for this sale</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Btn t={t} 
                    disabled={cardPhase !== 'detected' || !parseFloat(cardAmount) || parseFloat(cardAmount) <= 0} 
                    onClick={() => {
                      handleAddPayment('Card', { 
                        amount: parseFloat(cardAmount) || 0,
                        last4: generatedLast4,
                        authRef: generatedRef
                      })
                      setCardPhase('initial')
                    }} 
                    fullWidth>
                    Proceed Pay
                  </Btn>
                </div>
              )}

              {activeTab === 'qr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>
                  <Input t={t} label="QR / Wallet Amount" value={qrAmount} onChange={setQrAmount} placeholder="0.00" type="number" />
                  <Input t={t} label="Transaction Reference (Optional)" value={qrRef} onChange={setQrRef} placeholder="e.g. TXN-123" />
                  <div style={{ fontSize: 12, color: t.text3, background: t.bg3, padding: 10, borderRadius: 8 }}>
                    Scan code from customer app or enter details above when received.
                  </div>
                  <Btn t={t} disabled={!parseFloat(qrAmount) || parseFloat(qrAmount) <= 0} onClick={() => handleAddPayment('QR', { 
                      amount: parseFloat(qrAmount) || 0,
                      txnRef: qrRef || `TXT-${Date.now().toString(36).toUpperCase()}`
                    })} fullWidth>
                    Add QR Payment
                  </Btn>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Added Payments List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.bg3 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, fontSize: 12, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Payments Added ({payments.length})
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {payments.length === 0 ? (
                <div style={{ color: t.text4, fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  No payments added yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {payments.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>
                          {p.method === 'Cash' ? '💵' : p.method === 'Card' ? '💳' : '🤳'}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{p.method}</div>
                          <div style={{ fontSize: 11, color: t.text3 }}>
                            {p.method === 'Card' ? `•••• ${p.last4} (${p.authRef})` : p.method === 'QR' ? `Ref: ${p.txnRef}` : 'Physical'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 900, fontSize: 15, color: t.text }}>{fmt(p.amount, settings?.sym)}</span>
                        <button onClick={() => removePayment(p.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px 0', borderTop: `2px solid ${t.border}`, marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: t.text3 }}>Total Paid</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: t.text }}>{fmt(totalPaid, settings?.sym)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', padding: '20px 28px 24px', borderTop: `1px solid ${t.border}`, background: t.bg, gap: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: 12,
              border: `1px solid ${t.border}`,
              background: t.bg3,
              color: t.text2,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Cancel Split
          </button>
          <button
            type="button"
            disabled={!canComplete}
            onClick={onConfirm}
            style={{
              flex: 1.5,
              padding: '16px 20px',
              borderRadius: 12,
              border: 'none',
              background: canComplete ? '#10b981' : '#94a3b8',
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              cursor: canComplete ? 'pointer' : 'not-allowed',
            }}
          >
            {canComplete ? 'Proceed Pay' : `Pay ${fmt(remaining, settings?.sym)} remaining`}
          </button>
        </div>
      </div>
    </div>
  )
}
