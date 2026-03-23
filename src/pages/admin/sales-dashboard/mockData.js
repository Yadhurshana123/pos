export const STORES = [
  { id: 'all', name: 'All Stores' },
  { id: 'store-a', name: 'Main Stadium Store' },
  { id: 'store-b', name: 'East Wing Megastore' },
  { id: 'store-c', name: 'Airport Pop-up' }
]

// Helper to generate a sparkline array
const randomSpark = (len, min, max) => Array.from({ length: len }, () => Math.floor(Math.random() * (max - min) + min))

// Mock generator function
export const getDashboardData = ({ timeRange = 'daily', storeId = 'all' }) => {
  // A slight multiplier to make data look different per store & timeRange
  const storeMult = storeId === 'all' ? 3 : (storeId === 'store-a' ? 1.5 : (storeId === 'store-b' ? 1 : 0.5))
  const rangeMult = timeRange === 'yearly' ? 365 : (timeRange === 'monthly' ? 30 : 1)

  const baseSales = 2500 * storeMult * rangeMult
  const baseOrders = 45 * storeMult * rangeMult

  // KPIs
  const kpis = {
    todaySales: {
      value: baseSales,
      trend: 12.5,
      direction: 'up',
      sparkline: randomSpark(7, baseSales * 0.8, baseSales * 1.2)
    },
    monthSales: {
      value: baseSales * 28, // approx current month
      trend: -2.3,
      direction: 'down',
      sparkline: randomSpark(30, baseSales * 25, baseSales * 35)
    },
    yearSales: {
      value: baseSales * 340,
      trend: 18.2,
      direction: 'up',
      sparkline: randomSpark(12, baseSales * 300, baseSales * 400)
    },
    totalOrders: {
      value: baseOrders,
      trend: 5.1,
      direction: 'up',
      sparkline: randomSpark(7, baseOrders * 0.8, baseOrders * 1.2)
    }
  }

  // Determine line chart logic
  let lineChartData = []
  if (timeRange === 'daily') {
    // 24 hours
    lineChartData = Array.from({ length: 12 }, (_, i) => ({
      name: `${(i * 2).toString().padStart(2, '0')}:00`,
      sales: Math.floor(Math.random() * 500 * storeMult),
      orders: Math.floor(Math.random() * 20 * storeMult)
    }))
  } else if (timeRange === 'monthly') {
    // 30 days
    lineChartData = Array.from({ length: 30 }, (_, i) => ({
      name: `Day ${i + 1}`,
      sales: Math.floor(Math.random() * 3000 * storeMult),
      orders: Math.floor(Math.random() * 50 * storeMult)
    }))
  } else {
    // 12 months
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    lineChartData = months.map(m => ({
      name: m,
      sales: Math.floor(Math.random() * 90000 * storeMult),
      orders: Math.floor(Math.random() * 1500 * storeMult)
    }))
  }

  // Donut chart logic (Store contribution)
  let donutData = []
  if (storeId === 'all') {
    donutData = [
      { name: 'Main Stadium Store', value: 45 },
      { name: 'East Wing Megastore', value: 35 },
      { name: 'Airport Pop-up', value: 20 }
    ]
  } else {
    donutData = [
      { name: STORES.find(s => s.id === storeId)?.name || 'Selected', value: 100 }
    ]
  }

  // Table Data: Always show all stores in the comparison table, 
  // but values reflect the selected timeRange
  const storeComparison = STORES.filter(s => s.id !== 'all').map((s) => {
    const sMult = s.id === 'store-a' ? 1.5 : (s.id === 'store-b' ? 1 : 0.5)
    const rawGross = 2500 * sMult * rangeMult * (Math.random() * 0.4 + 0.8) // +/- 20%
    const tax = rawGross * 0.1
    return {
      id: s.id,
      name: s.name,
      orders: Math.floor(45 * sMult * rangeMult * (Math.random() * 0.4 + 0.8)),
      gross: rawGross,
      tax: tax,
      net: rawGross - tax,
      growth: parseFloat(((Math.random() * 30) - 10).toFixed(1)) // -10% to +20%
    }
  })

  return { kpis, lineChartData, donutData, storeComparison }
}
