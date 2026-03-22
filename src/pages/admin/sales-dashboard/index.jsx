import React, { useState, useEffect } from 'react'
import { DashboardFilters } from './DashboardFilters'
import { DashboardKPIs } from './DashboardKPIs'
import { DashboardCharts } from './DashboardCharts'
import { DashboardTable } from './DashboardTable'
import { getDashboardData } from './mockData'

// Skeleton loaders for individual sections
const SkeletonCard = ({ t, height = '120px' }) => (
  <div style={{
    background: t.bg2, height: height, borderRadius: '12px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    border: `1px solid ${t.border}`
  }} />
)

export default function AdminSalesDashboard({ settings, t, addGlobalNotif }) {
  const [timeRange, setTimeRange] = useState('daily')
  const [storeId, setStoreId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  
  // Real-time refresh simulation
  const loadData = () => {
    setLoading(true)
    // Simulate network latency
    setTimeout(() => {
      try {
        const newData = getDashboardData({ timeRange, storeId })
        setData(newData)
        setLoading(false)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        addGlobalNotif && addGlobalNotif("Failed to load dashboard data", "error")
        setLoading(false)
      }
    }, 800) 
  }

  useEffect(() => {
    loadData()
  }, [timeRange, storeId])

  const handleRefresh = () => {
    addGlobalNotif && addGlobalNotif("Refreshing data...", "info")
    loadData()
  }

  const handleDownloadReport = () => {
    if (!data || !data.storeComparison) return
    const headers = ['Store Name', 'Orders', 'Gross Sales', 'Tax', 'Net Sales', 'Growth %']
    const rows = data.storeComparison.map(s => [
      `"${s.name}"`, 
      s.orders, 
      s.gross.toFixed(2), 
      s.tax.toFixed(2), 
      s.net.toFixed(2), 
      s.growth
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Sales_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addGlobalNotif && addGlobalNotif("Report downloaded successfully!", "success")
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: t.text, margin: '0 0 8px 0' }}>Overview</h1>
        <p style={{ color: t.text3, fontSize: '14px', margin: 0 }}>Analyze store performance, sales trends, and key metrics.</p>
      </div>

      {/* Filters (Top Section) */}
      <DashboardFilters 
        timeRange={timeRange} 
        setTimeRange={setTimeRange} 
        storeId={storeId} 
        setStoreId={setStoreId} 
        onRefresh={handleRefresh}
        onDownloadReport={handleDownloadReport}
        t={t}
      />

      {loading || !data ? (
        /* Loading Skeletons */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <SkeletonCard t={t} height="130px" />
            <SkeletonCard t={t} height="130px" />
            <SkeletonCard t={t} height="130px" />
            <SkeletonCard t={t} height="130px" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '350px' }}><SkeletonCard t={t} height="390px" /></div>
            <div style={{ flex: 1, minWidth: '350px' }}><SkeletonCard t={t} height="390px" /></div>
          </div>
          <SkeletonCard t={t} height="400px" />
        </div>
      ) : (
        /* Main Application Content */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease' }}>
          {/* Style block for pulse animation since it's hardcoded inline */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          `}} />

          {/* Section 2: KPIs */}
          <DashboardKPIs kpis={data.kpis} t={t} settings={settings} />

          {/* Section 3: Charts */}
          <DashboardCharts 
            lineData={data.lineChartData} 
            donutData={data.donutData} 
            t={t} settings={settings} 
          />

          {/* Section 4: Table */}
          <DashboardTable 
            data={data.storeComparison} 
            t={t} settings={settings} 
          />
        </div>
      )}
    </div>
  )
}
