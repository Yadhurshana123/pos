import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { Btn, Badge, Card, StatCard } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'
import { 
  Printer, Download, Calendar, TrendingUp, 
  CreditCard, Banknote, QrCode, Split, 
  ShieldCheck, ArrowLeftRight, Clock, Package,
  ChevronRight, BarChart3
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts'

export const ZReport = ({ orders = [], settings, t }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const reportDate = dayjs(selectedDate)
  const dateLabel = reportDate.format('DD/MM/YYYY')

  // Filter orders for the selected day
  const dayOrders = useMemo(() => orders.filter(o => {
    if (!o.date) return false
    // Handle multiple date formats: "DD/MM/YYYY, HH:mm:ss" or ISO
    let d = dayjs(o.date, 'DD/MM/YYYY, HH:mm:ss')
    if (!d.isValid()) d = dayjs(o.date)
    return d.isValid() && d.isSame(reportDate, 'day')
  }), [orders, reportDate])

  // Metrics calculation
  const stats = useMemo(() => {
    const total = dayOrders.reduce((s, o) => s + (o.total || 0), 0)
    const card = dayOrders.filter(o => o.payment === 'Card').reduce((s, o) => s + (o.total || 0), 0)
    const cash = dayOrders.filter(o => o.payment === 'Cash').reduce((s, o) => s + (o.total || 0), 0)
    const qr = dayOrders.filter(o => o.payment === 'QR').reduce((s, o) => s + (o.total || 0), 0)
    const split = dayOrders.filter(o => o.payment === 'Split').reduce((s, o) => s + (o.total || 0), 0)
    const tax = dayOrders.reduce((s, o) => s + (o.tax || 0), 0)
    const refunded = dayOrders.filter(o => o.status === 'refunded').reduce((s, o) => s + (o.total || 0), 0)
    
    const productSales = {}
    dayOrders.forEach(o => (o.items || o.order_items || []).forEach(i => { 
      const name = i.product_name || i.name
      productSales[name] = (productSales[name] || 0) + (i.quantity || i.qty || 0)
    }))

    const counterRev = {}
    dayOrders.forEach(o => {
      const c = o.counter || 'Unknown'
      if (!counterRev[c]) counterRev[c] = { orders: 0, rev: 0 }
      counterRev[c].orders++
      counterRev[c].rev += (o.total || 0)
    })

    // Hourly Breakdown for Chart
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, total: 0 }))
    dayOrders.forEach(o => {
      let d = dayjs(o.date, 'DD/MM/YYYY, HH:mm:ss')
      if (!d.isValid()) d = dayjs(o.date)
      const h = d.hour()
      if (h >= 0 && h < 24) hourlyData[h].total += (o.total || 0)
    })

    return { total, card, cash, qr, split, tax, refunded, productSales, counterRev, hourlyData }
  }, [dayOrders])

  const exportCsv = () => {
    const d = `Z-REPORT,${dateLabel}\nTotal Revenue,${fmt(stats.total, settings?.sym)}\nCard,${fmt(stats.card, settings?.sym)}\nCash,${fmt(stats.cash, settings?.sym)}\nQR,${fmt(stats.qr, settings?.sym)}\nSplit,${fmt(stats.split, settings?.sym)}\nTax,${fmt(stats.tax, settings?.sym)}\nOrders,${dayOrders.length}\nRefunds,${fmt(stats.refunded, settings?.sym)}`
    const b = new Blob([d], { type: 'text/csv' })
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url
    a.download = `zreport-${dateLabel.replace(/\//g, '-')}.csv`
    a.click()
    notify('Z-Report exported!', 'success')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header & Controls */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 950, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>Z-Report</h1>
          <p style={{ fontSize: 14, color: t.text3, margin: '4px 0 0 0' }}>End of day financial audit for {dateLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.text4 }} />
            <input 
              type="date" value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              style={{ 
                background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 10, 
                padding: '10px 12px 10px 36px', color: t.text, fontSize: 14, fontWeight: 600,
                outline: 'none', cursor: 'pointer', boxShadow: t.shadowSm
              }} 
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Export
            </Btn>
            <Btn variant="primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Printer size={16} /> Print Z-Report
            </Btn>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={{ 
          background: `linear-gradient(135deg, ${t.accent}, ${t.blue})`, 
          borderRadius: 20, padding: 32, color: '#fff', boxShadow: `0 10px 30px -10px ${t.accent}66`,
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <TrendingUp size={160} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Net Daily Revenue</div>
          <div style={{ fontSize: 48, fontWeight: 950, letterSpacing: '-2px' }}>{fmt(stats.total, settings?.sym)}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {dayOrders.length} Orders
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {fmt(stats.tax, settings?.sym)} Tax
            </div>
          </div>
        </div>

        <Card t={t} style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text3, marginBottom: 16, textTransform: 'uppercase' }}>Payment Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Card', val: stats.card, icon: <CreditCard size={14} />, col: t.blue },
              { label: 'Cash', val: stats.cash, icon: <Banknote size={14} />, col: t.green },
              { label: 'QR', val: stats.qr, icon: <QrCode size={14} />, col: t.purple },
              { label: 'Split', val: stats.split, icon: <Split size={14} />, col: t.teal },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.col}15`, color: p.col, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: t.text4, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{fmt(p.val, settings?.sym)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly Chart */}
      <Card t={t} className="no-print" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Hourly Revenue Impact</h3>
            <p style={{ fontSize: 12, color: t.text3, margin: '2px 0' }}>Sales distribution for {dateLabel}</p>
          </div>
          <BarChart3 size={20} color={t.text4} />
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.hourlyData.filter(d => d.total > 0 || (parseInt(d.hour) > 8 && parseInt(d.hour) < 22))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.border} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: t.text3 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: t.text3 }} />
              <Tooltip 
                cursor={{ fill: t.bg3, opacity: 0.4 }}
                contentStyle={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 8 }}
              />
              <Bar dataKey="total" fill={t.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Secondary Data Grid */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Top Products */}
        <Card t={t} style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Top Selling Items</h3>
            <Package size={18} color={t.text4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(stats.productSales).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}44` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: t.text4, width: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{name}</span>
                </div>
                <Badge t={t} text={`${qty} units`} color="blue" />
              </div>
            ))}
            {Object.keys(stats.productSales).length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: t.text4, fontSize: 13 }}>No items sold today</div>
            )}
          </div>
        </Card>

        {/* Counter Performance */}
        <Card t={t} style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Counter Settlement</h3>
            <ShieldCheck size={18} color={t.text4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(stats.counterRev).sort((a, b) => b[1].rev - a[1].rev).map(([c, cData]) => (
              <div key={c} style={{ background: t.bg2, padding: 16, borderRadius: 12, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{c}</span>
                  <span style={{ fontSize: 15, fontWeight: 950, color: t.accent }}>{fmt(cData.rev, settings?.sym)}</span>
                </div>
                <div style={{ fontSize: 11, color: t.text3 }}>{cData.orders} orders processed</div>
              </div>
            ))}
            {Object.keys(stats.counterRev).length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: t.text4, fontSize: 13 }}>No operational data available</div>
            )}
          </div>
        </Card>
      </div>

      {/* PRINT-ONLY RECEIPT LAYOUT */}
      <div className="print-only" style={{ 
        width: '80mm', margin: '0 auto', padding: '20px 10px', 
        fontFamily: 'Courier New, Courier, monospace', color: '#000', fontSize: '12px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{settings?.storeName || 'SCS TIX'}</div>
          <div>Location: Main Store</div>
          <div style={{ margin: '10px 0' }}>*** Z-REPORT ***</div>
          <div>Date: {dateLabel}</div>
          <div>Time: {dayjs().format('HH:mm:ss')}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL REVENUE</span>
            <span>{fmt(stats.total, settings?.sym)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL ORDERS</span>
            <span>{dayOrders.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL TAX</span>
            <span>{fmt(stats.tax, settings?.sym)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', padding: '10px 0' }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>PAYMENT METHODS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CARD:</span> <span>{fmt(stats.card, settings?.sym)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CASH:</span> <span>{fmt(stats.cash, settings?.sym)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>QR:</span>   <span>{fmt(stats.qr, settings?.sym)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SPLIT:</span><span>{fmt(stats.split, settings?.sym)}</span></div>
        </div>

        <div style={{ borderTop: '1px dashed #000', padding: '10px 0' }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>REFUNDS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>REFUNDED AMT</span>
            <span>{fmt(stats.refunded, settings?.sym)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', padding: '10px 0', textAlign: 'center' }}>
          <div style={{ margin: '10px 0' }}>END OF REPORT</div>
          <div style={{ fontSize: '10px' }}>Audit ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
        </div>
      </div>

      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #white !important; }
          @page { margin: 0; }
        }
      `}</style>
    </div>
  )
}
