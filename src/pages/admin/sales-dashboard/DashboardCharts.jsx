import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { fmt } from '@/lib/utils'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9']

const ChartCard = ({ title, children, t }) => (
  <div style={{
    background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px',
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1, minWidth: '350px'
  }}>
    <div style={{ fontSize: '16px', fontWeight: '800', color: t.text }}>{title}</div>
    <div style={{ height: '300px', width: '100%' }}>
      {children}
    </div>
  </div>
)

export const DashboardCharts = ({ lineData, donutData, t, settings }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      {/* Line Chart */}
      <ChartCard title="Sales Trend" t={t}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis dataKey="name" stroke={t.text3} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
              stroke={t.text3} fontSize={12} tickLine={false} axisLine={false}
              tickFormatter={(value) => `${settings?.sym || '$'}${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value, name) => [name === 'sales' ? fmt(value, settings?.sym) : value, name === 'sales' ? 'Sales' : 'Orders']}
            />
            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Donut Chart */}
      <ChartCard title="Store Contribution (%)" t={t}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="45%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
            >
              {donutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}%`]}
              contentStyle={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '8px' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: t.text2 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
