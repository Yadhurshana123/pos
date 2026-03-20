import { useState } from 'react'
import dayjs from 'dayjs'
import { Btn, Badge, Card, StatCard } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'

export const ZReport = ({ orders, settings, t }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const reportDate = dayjs(selectedDate)
  const dateLabel = reportDate.format('DD/MM/YYYY')
  const dayOrders = orders.filter(o => {
    if (!o.date) return false
    const orderDate = dayjs(o.date, 'DD/MM/YYYY, HH:mm:ss')
    return orderDate.isValid() && orderDate.isSame(reportDate, 'day')
  })

  const total = dayOrders.reduce((s, o) => s + o.total, 0)
  const card = dayOrders.filter(o => o.payment === 'Card').reduce((s, o) => s + o.total, 0)
  const cash = dayOrders.filter(o => o.payment === 'Cash').reduce((s, o) => s + o.total, 0)
  const qr = dayOrders.filter(o => o.payment === 'QR').reduce((s, o) => s + o.total, 0)
  const split = dayOrders.filter(o => o.payment === 'Split').reduce((s, o) => s + o.total, 0)
  const tax = dayOrders.reduce((s, o) => s + (o.tax || 0), 0)
  const refunded = dayOrders.filter(o => o.status === 'refunded').reduce((s, o) => s + o.total, 0)

  const productSales = {}
  dayOrders.forEach(o => o.items.forEach(i => { productSales[i.name] = (productSales[i.name] || 0) + i.qty }))

  const counterRev = {}
  dayOrders.forEach(o => {
    const c = o.counter || 'Unknown'
    if (!counterRev[c]) counterRev[c] = { orders: 0, rev: 0 }
    counterRev[c].orders++
    counterRev[c].rev += o.total
  })

  const exportCsv = () => {
    const d = `Z-REPORT,${dateLabel}\nTotal Revenue,${fmt(total, settings?.sym)}\nCard,${fmt(card, settings?.sym)}\nCash,${fmt(cash, settings?.sym)}\nQR,${fmt(qr, settings?.sym)}\nSplit,${fmt(split, settings?.sym)}\nTax,${fmt(tax, settings?.sym)}\nOrders,${dayOrders.length}\nRefunds,${fmt(refunded, settings?.sym)}`
    const b = new Blob([d], { type: 'text/csv' })
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url
    a.download = `zreport-${dateLabel.replace(/\//g, '-')}.csv`
    a.click()
    notify('Z-Report exported!', 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>📑 End of Day Z-Report</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 3 }}>Daily trading summary — {dateLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 9, padding: '8px 12px', color: t.text, fontSize: 13, outline: 'none' }} />
          </div>
          <Btn t={t} onClick={exportCsv}>⬇ Export CSV</Btn>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg,${t.accent},${t.accent2})`, borderRadius: 16, padding: 24, color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Revenue Summary — {dateLabel}</div>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2 }}>{fmt(total, settings?.sym)}</div>
        <div style={{ fontSize: 14, opacity: 0.75, marginTop: 4 }}>{dayOrders.length} transactions processed</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(180px,45vw),1fr))', gap: 14 }}>
        {[
          ['Card Sales', fmt(card, settings?.sym), t.blue, '💳'],
          ['Cash Sales', fmt(cash, settings?.sym), t.green, '💵'],
          ['QR Sales', fmt(qr, settings?.sym), t.purple, '📱'],
          ['Split Sales', fmt(split, settings?.sym), t.teal, '✂️'],
          ['Tax Collected', fmt(tax, settings?.sym), t.yellow, '🏛️'],
          ['Refunds', fmt(refunded, settings?.sym), t.red, '↩️'],
          ['Net Revenue', fmt(total - refunded, settings?.sym), t.accent, '💰'],
        ].map(([k, v, c, i]) => <StatCard key={k} t={t} title={k} value={v} color={c} icon={i} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="grid-2">
        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>Top Products</div>
          {Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty], i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
              <span style={{ color: t.text }}>#{i + 1} {name}</span>
              <Badge t={t} text={`${qty} sold`} color="blue" />
            </div>
          ))}
          {Object.keys(productSales).length === 0 && (
            <div style={{ color: t.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>No sales for this date</div>
          )}
        </Card>

        <Card t={t}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>Counter Breakdown</div>
          {Object.entries(counterRev).sort((a, b) => b[1].rev - a[1].rev).map(([c, stats]) => (
            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
              <span style={{ color: t.text }}>{c}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: t.text3 }}>{stats.orders} orders</span>
                <span style={{ fontWeight: 800, color: t.accent }}>{fmt(stats.rev, settings?.sym)}</span>
              </div>
            </div>
          ))}
          {Object.keys(counterRev).length === 0 && (
            <div style={{ color: t.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>No counter data for this date</div>
          )}
        </Card>
      </div>
    </div>
  )
}
