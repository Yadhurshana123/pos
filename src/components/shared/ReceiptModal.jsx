import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Modal } from '@/components/ui'
import { Btn } from '@/components/ui'
import { fmt } from '@/lib/utils'

export const ReceiptModal = ({ order, settings, onClose, t }) => {
  const receiptRef = useRef(null)
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${order?.id || order?.order_number || 'order'}`,
    pageStyle: '@page { size: 80mm auto; margin: 4mm; }',
  })
  return (
  <Modal t={t} title="✓ Payment Successful" onClose={onClose} width={440}>
    <div ref={receiptRef} style={{ background: '#fffbf5', borderRadius: 10, padding: 24, fontFamily: 'monospace', border: '1px solid #e2d9c5' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>{settings.storeName}</div>
        <div style={{ fontSize: 11, color: '#666' }}>{settings.storeAddress}</div>
        <div style={{ fontSize: 11, color: '#666' }}>{settings.storePhone}</div>
        <div style={{ margin: '8px 0', borderTop: '1px dashed #aaa', paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: '#888' }}>Order: {order.id} · {order.date}</div>
          <div style={{ fontSize: 11, color: '#888' }}>Counter: {order.counter} · Cashier: {order.cashierName}</div>
          {order.customerName !== 'Walk-in' && <div style={{ fontSize: 11, color: '#888' }}>Customer: {order.customerName}</div>}
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #aaa', borderBottom: '1px dashed #aaa', padding: '10px 0', marginBottom: 12 }}>
        {order.items.map((i, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>{i.name} × {i.qty}{i.discount > 0 ? ` (-${i.discount}%)` : ''}</span>
            <span style={{ fontWeight: 700 }}>{fmt(i.price * (1 - (i.discount || 0) / 100) * i.qty, settings?.sym)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12 }}>
        {[['Subtotal', fmt(order.subtotal, settings?.sym)], ['Tax', fmt(order.tax, settings?.sym)], order.deliveryCharge > 0 && ['Delivery', fmt(order.deliveryCharge, settings?.sym)], order.couponDiscount > 0 && [`Coupon (${order.couponCode})`, `-${fmt(order.couponDiscount, settings?.sym)}`], order.loyaltyDiscount > 0 && ['Loyalty Discount', `-${fmt(order.loyaltyDiscount, settings?.sym)}`]].filter(Boolean).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: '#666' }}>{k}</span><span>{v}</span></div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17, borderTop: '1px dashed #aaa', marginTop: 6, paddingTop: 6 }}><span>TOTAL</span><span>{fmt(order.total, settings?.sym)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 3 }}><span>Payment</span><span style={{ fontWeight: 700 }}>{order.payment}{order.cardLast4 ? ` ****${order.cardLast4}` : ''}</span></div>
        {order.payment === 'Cash' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>Cash Given</span><span>{fmt(order.cashGiven, settings?.sym)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#16a34a' }}><span>Change</span><span>{fmt(order.cashChange, settings?.sym)}</span></div>
        </>}
        {order.loyaltyEarned > 0 && <div style={{ marginTop: 8, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '6px 10px', fontSize: 12, textAlign: 'center', color: '#a16207', fontWeight: 800 }}>⭐ +{order.loyaltyEarned} loyalty points earned!</div>}
      </div>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#888', borderTop: '1px dashed #aaa', paddingTop: 10 }}>{settings.receiptFooter}</div>
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      <Btn t={t} variant="secondary" onClick={onClose} style={{ flex: 1 }}>Close</Btn>
      <Btn t={t} onClick={handlePrint} style={{ flex: 1 }}>🖨️ Print Receipt</Btn>
    </div>
  </Modal>
  )
}
