import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, Activity } from 'lucide-react'
import { fmt } from '@/lib/utils'

const Sparkline = ({ data, color }) => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 100
  const h = 30
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ marginTop: 'auto', opacity: 0.8 }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const KPICard = ({ t, title, data, icon: Icon, isCurrency = true, settings }) => {
  const { value, trend, direction, sparkline } = data
  const isUp = direction === 'up'
  const color = isUp ? '#10b981' : '#ef4444' // Emerald or Red

  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: t.text3, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </div>
          <div style={{ color: t.text, fontSize: '24px', fontWeight: '800', marginTop: '4px' }}>
            {isCurrency ? fmt(value, settings?.sym) : value.toLocaleString()}
          </div>
        </div>
        <div style={{ background: `${t.accent}15`, padding: '10px', borderRadius: '10px', color: t.accent }}>
          <Icon size={20} />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '4px', 
          color, background: `${color}15`, padding: '4px 8px', borderRadius: '6px',
          fontSize: '12px', fontWeight: '700'
        }}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}%
        </div>
        <div style={{ flex: 1, height: '30px' }}>
          <Sparkline data={sparkline} color={color} />
        </div>
      </div>
    </div>
  )
}

export const DashboardKPIs = ({ kpis, t, settings }) => {
  return (
    <div style={{ 
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' 
    }}>
      <KPICard t={t} settings={settings} title="Today's Sales" data={kpis.todaySales} icon={DollarSign} />
      <KPICard t={t} settings={settings} title="This Month" data={kpis.monthSales} icon={Activity} />
      <KPICard t={t} settings={settings} title="This Year" data={kpis.yearSales} icon={CreditCard} />
      <KPICard t={t} settings={settings} title="Total Orders" data={kpis.totalOrders} icon={ShoppingBag} isCurrency={false} />
    </div>
  )
}
