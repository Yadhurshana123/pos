import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { Btn, Badge, Card, StatCard, Select } from '@/components/ui'
import { notify } from '@/components/shared'
import { fmt } from '@/lib/utils'
import { ordersService } from '@/services'
import { isSupabaseConfigured } from '@/lib/supabase'

const exportCsvHelper = (filename, headers, rows) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const b = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(b)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  notify('Report exported as CSV!', 'success')
}

function getOrderItems(o) {
  const items = o?.items || o?.order_items || []
  return Array.isArray(items) ? items : []
}

function itemName(i) { return i?.product_name || i?.name || 'Unknown' }
function itemQty(i) { return i?.quantity ?? i?.qty ?? 0 }
function itemPrice(i) { return i?.unit_price ?? i?.price ?? 0 }

export const ReportsPage = ({ products = [], t, settings }) => {
  const [activeReport, setActiveReport] = useState('sales-category')
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'))
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      const data = await ordersService.fetchOrders({
        dateFrom: dayjs(dateFrom).startOf('day').toISOString(),
        dateTo: dayjs(dateTo).endOf('day').toISOString()
      })
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      notify('Failed to load data from Supabase', 'error')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = orders // Since we fetch specifically for the range
  const totalRev = filtered.reduce((s, o) => s + (o.total ?? 0), 0)
  const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0d9488']

  const reports = [
    { id: 'sales-category', label: 'Sales by Category', i: '📊' },
    { id: 'sales-product', label: 'Sales by Product', i: '📦' },
    { id: 'sales-counter', label: 'Sales by Counter', i: '🏪' },
    { id: 'sales-operator', label: 'Sales by Operator', i: '👤' },
    { id: 'returns', label: 'Returns Summary', i: '↩️' },
    { id: 'stock', label: 'Stock Report', i: '📦' },
    { id: 'discounts', label: 'Discount/Coupon Usage', i: '🏷️' },
    { id: 'cash-recon', label: 'Cash Reconciliation', i: '💰' },
    { id: 'detailed', label: 'Detailed Transactions', i: '🧾' },
  ]

  const catRev = {}
  filtered.forEach(o => {
    getOrderItems(o).forEach(i => {
      const name = itemName(i)
      const p = (products || []).find(x => x.name === name)
      const cat = p?.category || 'Other'
      catRev[cat] = (catRev[cat] || 0) + itemPrice(i) * itemQty(i)
    })
  })
  const totalCatRev = Object.values(catRev).reduce((s, v) => s + v, 0)

  const productSales = {}
  filtered.forEach(o => {
    getOrderItems(o).forEach(i => {
      const name = itemName(i)
      if (!productSales[name]) productSales[name] = { qty: 0, rev: 0 }
      productSales[name].qty += itemQty(i)
      productSales[name].rev += itemPrice(i) * itemQty(i)
    })
  })
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].rev - a[1].rev)

  const counterRev = {}
  filtered.forEach(o => {
    const c = o.counter || 'Unknown'
    if (!counterRev[c]) counterRev[c] = { orders: 0, rev: 0 }
    counterRev[c].orders++
    counterRev[c].rev += o.total ?? 0
  })

  const operatorPerf = {}
  filtered.forEach(o => {
    const name = o.cashier_name || o.cashierName || 'Unknown'
    if (!operatorPerf[name]) operatorPerf[name] = { orders: 0, rev: 0 }
    operatorPerf[name].orders++
    operatorPerf[name].rev += o.total ?? 0
  })
  const sortedOperators = Object.entries(operatorPerf).sort((a, b) => b[1].rev - a[1].rev)

  const returnOrders = filtered.filter(o => o.status === 'refunded')
  const discountOrders = filtered.filter(o => (o.discount_amount ?? o.discountAmt ?? 0) > 0 || (o.couponDiscount ?? 0) > 0)

  const cashOrders = filtered.filter(o => (o.payment_method || o.payment) === 'Cash' || (o.payment_method || o.payment) === 'Split')
  const cashReceived = cashOrders.reduce((s, o) => s + ((o.payment_method || o.payment) === 'Cash' ? (o.payment_details?.cash_given ?? o.cashGiven ?? 0) : (o.payment_details?.split_cash ?? o.splitCash ?? 0)), 0)
  const cashChangeGiven = cashOrders.reduce((s, o) => s + (o.payment_details?.cash_change ?? o.cashChange ?? 0), 0)
  const cashSales = cashOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const cashRefunds = returnOrders.filter(o => (o.payment_method || o.payment) === 'Cash').reduce((s, o) => s + (o.total ?? 0), 0)

  const handleExport = () => {
    if (activeReport === 'sales-category') {
      exportCsvHelper('sales-by-category.csv', ['Category', 'Revenue', '% Share'], Object.entries(catRev).map(([cat, rev]) => [cat, rev.toFixed(2), totalCatRev > 0 ? (rev / totalCatRev * 100).toFixed(1) + '%' : '0%']))
    } else if (activeReport === 'sales-product') {
      exportCsvHelper('sales-by-product.csv', ['Product', 'Qty Sold', 'Revenue'], topProducts.map(([name, s]) => [name, s.qty, s.rev.toFixed(2)]))
    } else if (activeReport === 'sales-counter') {
      exportCsvHelper('sales-by-counter.csv', ['Counter', 'Orders', 'Revenue'], Object.entries(counterRev).map(([c, s]) => [c, s.orders, s.rev.toFixed(2)]))
    } else if (activeReport === 'sales-operator') {
      exportCsvHelper('sales-by-operator.csv', ['Operator', 'Orders', 'Revenue'], sortedOperators.map(([name, s]) => [name, s.orders, s.rev.toFixed(2)]))
    } else if (activeReport === 'returns') {
      exportCsvHelper('returns-summary.csv', ['Order ID', 'Total', 'Date', 'Counter', 'Cashier'], returnOrders.map(o => [o.order_number || o.id, (o.total ?? 0).toFixed(2), o.date || o.created_at, o.counter || 'Unknown', o.cashier_name || o.cashierName || 'Unknown']))
    } else if (activeReport === 'stock') {
      exportCsvHelper('stock-report.csv', ['Product', 'Category', 'Stock', 'Status'], (products || []).map(p => [p.name, p.category || 'Other', p.stock ?? 0, (p.stock ?? 0) === 0 ? 'Out' : (p.stock ?? 0) < 15 ? 'Low' : 'OK']))
    } else if (activeReport === 'detailed') {
      exportCsvHelper('detailed-transactions.csv', ['Order #', 'Customer', 'Total', 'Method', 'Date', 'Counter', 'Status'], filtered.map(o => [o.order_number || o.id, o.customer_name || o.customerName || 'Walk-in', o.total ?? 0, o.payment_method || o.payment || 'N/A', o.date || o.created_at, o.counter || 'Unknown', o.status]))
    } else if (activeReport === 'discounts') {
      const couponUse = {}
      discountOrders.forEach(o => {
        const code = o.coupon_code || o.couponCode
        if (code) {
          if (!couponUse[code]) couponUse[code] = { count: 0, savings: 0 }
          couponUse[code].count++
          couponUse[code].savings += o.couponDiscount ?? 0
        }
      })
      const totalDiscountAmt = discountOrders.reduce((sum, o) => sum + (o.discount_amount ?? o.discountAmt ?? 0) + (o.couponDiscount ?? 0), 0)
      const rows = [...Object.entries(couponUse).map(([code, s]) => ['Coupon', code, s.count, s.savings.toFixed(2)])]
      if (rows.length === 0) rows.push(['Discount', 'N/A', discountOrders.length, totalDiscountAmt.toFixed(2)])
      else rows.push(['Total Discounts', 'All', discountOrders.length, totalDiscountAmt.toFixed(2)])
      exportCsvHelper('discount-coupon-usage.csv', ['Type', 'Code', 'Count', 'Amount'], rows)
    } else if (activeReport === 'cash-recon') {
      exportCsvHelper('cash-reconciliation.csv', ['Metric', 'Amount'], [
        ['Cash Sales', cashSales.toFixed(2)],
        ['Cash Received', cashReceived.toFixed(2)],
        ['Change Given', cashChangeGiven.toFixed(2)],
        ['Cash Refunds', cashRefunds.toFixed(2)],
        ['Net Cash', (cashSales - cashRefunds).toFixed(2)]
      ])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, opacity: loading ? 0.7 : 1, pointerEvents: loading ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: t.text, marginBottom: 4 }}>Standard Reports</h1>
          <p style={{ fontSize: 13, color: t.text3 }}>Review your business performance with direct data from Supabase</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {loading && <div style={{ fontSize: 12, color: t.accent, fontWeight: 800, alignSelf: 'center', marginRight: 12 }}>🔄 FETCHING DATA...</div>}
          <Btn t={t} onClick={handleExport} disabled={loading}>⬇ Export Current View</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }} className="reports-layout">
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card t={t} style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingLeft: 8 }}>Available Reports</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reports.map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: activeReport === r.id ? t.accent + '15' : 'transparent',
                    color: activeReport === r.id ? t.accent : t.text2,
                    fontSize: 13,
                    fontWeight: activeReport === r.id ? 800 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{r.i}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </Card>

          <Card t={t} style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Key Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 10, background: t.bg3, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: t.text3, fontWeight: 700, marginBottom: 2 }}>PERIOD REVENUE</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: t.accent }}>{fmt(totalRev, settings?.sym)}</div>
              </div>
              <div style={{ padding: 10, background: t.bg3, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: t.text3, fontWeight: 700, marginBottom: 2 }}>ORDER COUNT</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: t.blue }}>{filtered.length}</div>
              </div>
            </div>
            <p style={{ fontSize: 10, color: t.text4, marginTop: 12, fontStyle: 'italic' }}>* Fresh data fetched from Supabase</p>
          </Card>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card t={t}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>From Date</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>To Date</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 14, outline: 'none' }} />
                </div>
                <Btn t={t} style={{ marginBottom: 2 }} onClick={loadData}>🔄 Refresh</Btn>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: t.text4, fontWeight: 700 }}>REPORTING PERIOD</div>
                <div style={{ fontSize: 13, color: t.text2, fontWeight: 600 }}>{dayjs(dateFrom).format('MMM D, YYYY')} - {dayjs(dateTo).format('MMM D, YYYY')}</div>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
            {activeReport === 'sales-category' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Revenue Coverage</div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                      <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        {Object.entries(catRev).reduce((acc, [cat, rev], i) => {
                          const pct = totalCatRev > 0 ? rev / totalCatRev * 100 : 0
                          const prev = acc.offset
                          acc.offset += pct
                          acc.els.push(<circle key={cat} cx="21" cy="21" r="15.9" fill="none" stroke={colors[i % colors.length]} strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={100 - prev} />)
                          return acc
                        }, { offset: 0, els: [] }).els}
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <div style={{ fontSize: 10, color: t.text4, fontWeight: 800 }}>REVENUE</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: t.text }}>{fmt(totalCatRev, settings?.sym)}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(catRev).map(([cat, rev], i) => (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: t.text2, fontWeight: 600 }}>{cat}</span>
                            <span style={{ fontWeight: 800, color: t.text }}>{Math.round(totalCatRev > 0 ? (rev / totalCatRev) * 100 : 0)}%</span>
                          </div>
                          <div style={{ height: 6, background: t.bg3, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${totalCatRev > 0 ? (rev / totalCatRev) * 100 : 0}%`, background: colors[i % colors.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 16 }}>Category Performance</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {Object.entries(catRev).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14 }}>
                        <span style={{ color: t.text, fontWeight: 500 }}>{cat}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: t.accent }}>{fmt(rev, settings?.sym)}</div>
                          <div style={{ fontSize: 11, color: t.text4 }}>{totalCatRev > 0 ? (rev / totalCatRev * 100).toFixed(1) : 0}% share</div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(catRev).length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: t.text4, fontStyle: 'italic' }}>No category data found</div>}
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'sales-product' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>🏆 Top Performers</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {topProducts.slice(0, 8).map(([name, stats], i) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? t.accent + '20' : t.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                          <div style={{ fontSize: 11, color: t.text3 }}>{stats.qty} units sold</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: t.accent }}>{fmt(stats.rev, settings?.sym)}</div>
                      </div>
                    ))}
                    {topProducts.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: t.text4, fontStyle: 'italic' }}>No product sales recorded</div>}
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Product Sales Metrics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${t.border}`, background: t.bg }}>
                      <div style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Total Product Variety</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{topProducts.length}</div>
                      <div style={{ fontSize: 12, color: t.text4, marginTop: 4 }}>Active products sold in this period</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${t.border}`, background: t.bg }}>
                      <div style={{ fontSize: 11, color: t.text3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Inventory movement</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: t.text }}>{topProducts.reduce((s, [, st]) => s + st.qty, 0)}</div>
                      <div style={{ fontSize: 12, color: t.text4, marginTop: 4 }}>Total physical units dispatched</div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'sales-counter' && (
              <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {Object.entries(counterRev).map(([counter, stats]) => {
                  const pct = totalRev > 0 ? Math.round(stats.rev / totalRev * 100) : 0
                  return (
                    <Card t={t} key={counter}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>🏪 {counter}</div>
                        <Badge t={t} text={`${stats.orders} Orders`} color="blue" />
                      </div>
                      <div style={{ padding: '16px 0', textAlign: 'center', borderBottom: `1px solid ${t.border}`, marginBottom: 16 }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: t.accent }}>{fmt(stats.rev, settings?.sym)}</div>
                        <div style={{ fontSize: 12, color: t.text3, fontWeight: 600 }}>Period Revenue</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.text3, marginBottom: 6 }}>
                        <span>REVENUE SHARE</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: t.bg3, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: t.accent }} />
                      </div>
                    </Card>
                  )
                })}
                {Object.keys(counterRev).length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 0', color: t.text4, fontStyle: 'italic' }}>No counter activity recorded</div>}
              </div>
            )}

            {activeReport === 'sales-operator' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Performance Leaderboard</div>
                  {sortedOperators.map(([name, stats], i) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 10px', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? t.yellow + '20' : t.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: i === 0 ? t.yellow : t.text3 }}>
                        {i === 0 ? '🏆' : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{name}</div>
                        <div style={{ fontSize: 12, color: t.text3 }}>{stats.orders} completed orders</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: t.accent }}>{fmt(stats.rev, settings?.sym)}</div>
                        <div style={{ fontSize: 10, color: t.text4 }}>AVG {fmt(stats.rev / stats.orders, settings?.sym)}</div>
                      </div>
                    </div>
                  ))}
                  {sortedOperators.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: t.text4, fontStyle: 'italic' }}>No operator data available</div>}
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 16 }}>Efficiency Analytics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <StatCard t={t} title="Active Operators" value={sortedOperators.length} color={t.blue} icon="👤" />
                    <StatCard t={t} title="Avg. Revenue / Head" value={fmt(sortedOperators.length > 0 ? totalRev / sortedOperators.length : 0, settings?.sym)} color={t.green} icon="📊" />
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'returns' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Refund Overview</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <StatCard t={t} title="Refunded Orders" value={returnOrders.length} color={t.red} icon="↩️" />
                    <StatCard t={t} title="Total Value" value={fmt(returnOrders.reduce((s, o) => s + (o.total || 0), 0), settings?.sym)} color={t.red} icon="💸" />
                  </div>
                  {returnOrders.length === 0 && <div style={{ color: t.text4, fontSize: 14, padding: '40px 0', textAlign: 'center', fontStyle: 'italic' }}>No refund data for this period</div>}
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 16 }}>Return Metrics</div>
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: t.red }}>
                      {filtered.length > 0 ? (returnOrders.length / filtered.length * 100).toFixed(1) : 0}%
                    </div>
                    <div style={{ fontSize: 13, color: t.text3, fontWeight: 600, marginTop: 4 }}>PERCENTAGE OF TOTAL ORDERS REJECTED</div>
                  </div>
                  <div style={{ height: 4, background: t.bg3, borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                    <div style={{ height: '100%', width: `${filtered.length > 0 ? (returnOrders.length / filtered.length * 100) : 0}%`, background: t.red }} />
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'stock' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Inventory Health</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <StatCard t={t} title="Total SKUs" value={(products || []).length} color={t.blue} icon="📦" />
                    <StatCard t={t} title="Total Units" value={(products || []).reduce((s, p) => s + (p.stock ?? 0), 0)} color={t.green} icon="🔢" />
                    <StatCard t={t} title="Low Stock" value={(products || []).filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 15).length} color={t.yellow} icon="⚠️" />
                    <StatCard t={t} title="Out of Stock" value={(products || []).filter(p => (p.stock ?? 0) === 0).length} color={t.red} icon="❌" />
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 16 }}>Critical Alerts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(products || []).filter(p => (p.stock ?? 0) < 15).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 8).map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${t.border}` }}>
                        <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{p.emoji} {p.name}</span>
                        <Badge t={t} text={`${p.stock ?? 0} left`} color={(p.stock ?? 0) === 0 ? 'red' : (p.stock ?? 0) < 5 ? 'red' : 'yellow'} />
                      </div>
                    ))}
                    {(products || []).filter(p => (p.stock ?? 0) < 15).length === 0 && <div style={{ color: t.green, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>✅ Inventory levels are within healthy thresholds</div>}
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'cash-recon' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Cash Activity</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <StatCard t={t} title="Cash Sales" value={fmt(cashSales, settings?.sym)} color={t.green} icon="💵" />
                    <StatCard t={t} title="Total Received" value={fmt(cashReceived, settings?.sym)} color={t.blue} icon="📥" />
                    <StatCard t={t} title="Change Given" value={fmt(cashChangeGiven, settings?.sym)} color={t.yellow} icon="🔄" />
                    <StatCard t={t} title="Refunds Paid" value={fmt(cashRefunds, settings?.sym)} color={t.red} icon="↩️" />
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Drawer Balance</div>
                  <div style={{ padding: 24, borderRadius: 12, border: `2px dashed ${t.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: t.text4, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Estimated Net Cash in Drawer</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: t.accent }}>{fmt(cashReceived - cashChangeGiven - cashRefunds, settings?.sym)}</div>
                    <div style={{ fontSize: 13, color: t.text3, marginTop: 8 }}>From {cashOrders.length} cash/split transactions</div>
                  </div>
                </Card>
              </>
            )}

            {activeReport === 'discounts' && (
              <>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Savings Performance</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <StatCard t={t} title="Discounted Orders" value={discountOrders.length} color={t.yellow} icon="🏷️" />
                    <StatCard t={t} title="Total Given" value={fmt(discountOrders.reduce((s, o) => s + (o.discountAmt || 0) + (o.couponDiscount || 0), 0), settings?.sym)} color={t.accent} icon="💸" />
                  </div>
                </Card>
                <Card t={t}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Active Coupon Usage</div>
                  {(() => {
                    const couponUse = {}
                    discountOrders.forEach(o => {
                      if (o.couponCode) {
                        if (!couponUse[o.couponCode]) couponUse[o.couponCode] = { count: 0, savings: 0 }
                        couponUse[o.couponCode].count++
                        couponUse[o.couponCode].savings += o.couponDiscount || 0
                      }
                    })
                    const entries = Object.entries(couponUse)
                    if (entries.length === 0) return <div style={{ color: t.text4, fontSize: 14, textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>No coupon codes used in this period</div>
                    return entries.map(([code, s]) => (
                      <div key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${t.border}` }}>
                        <div>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: t.text, background: t.bg3, padding: '3px 8px', borderRadius: 4 }}>{code}</span>
                          <span style={{ fontSize: 12, color: t.text3, marginLeft: 12 }}>{s.count} redemptions</span>
                        </div>
                        <div style={{ fontWeight: 800, color: t.accent, fontSize: 15 }}>{fmt(s.savings, settings?.sym)}</div>
                      </div>
                    ))
                  })()}
                </Card>
              </>
            )}

            {activeReport === 'detailed' && (
              <Card t={t} style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: t.text, marginBottom: 20 }}>Detailed Transaction Log (Original Data)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: `2px solid ${t.border}` }}>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Order #</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Customer</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Total</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Method</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Date</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Counter</th>
                        <th style={{ padding: '12px 8px', color: t.text3 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 100).map(o => (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                          <td style={{ padding: '10px 8px', fontWeight: 800, color: t.text }}>{o.order_number || o.id.slice(0, 8)}</td>
                          <td style={{ padding: '10px 8px', color: t.text2 }}>{o.customer_name || o.customerName || 'Walk-in'}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 800, color: t.accent }}>{fmt(o.total, settings?.sym)}</td>
                          <td style={{ padding: '10px 8px', color: t.text2 }}>{o.payment_method || o.payment || 'N/A'}</td>
                          <td style={{ padding: '10px 8px', color: t.text3, fontSize: 11 }}>{o.date || o.created_at}</td>
                          <td style={{ padding: '10px 8px', color: t.text2 }}>{o.counter || '—'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <Badge t={t} text={o.status} color={o.status === 'completed' ? 'green' : o.status === 'refunded' ? 'red' : 'yellow'} />
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px 0', textAlign: 'center', color: t.text4, fontStyle: 'italic' }}>No transactions found for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filtered.length > 100 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: t.text4, fontSize: 12 }}>
                      Showing first 100 of {filtered.length} records. Export to CSV for the full dataset.
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
