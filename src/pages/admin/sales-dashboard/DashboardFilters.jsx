import React from 'react'
import { Calendar, RefreshCcw, Download } from 'lucide-react'
import { STORES } from './mockData'
import { Select, Btn } from '@/components/ui'

export const DashboardFilters = ({ timeRange, setTimeRange, storeId, setStoreId, onRefresh, onDownloadReport, t }) => {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between',
      background: t.bg, padding: '16px 20px', borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', border: `1px solid ${t.border}`
    }}>
      {/* Left side: Time toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', background: t.bg2, padding: '4px', borderRadius: '8px', border: `1px solid ${t.border}` }}>
          {['daily', 'monthly', 'yearly'].map(mode => (
            <button
              key={mode}
              onClick={() => setTimeRange(mode)}
              style={{
                background: timeRange === mode ? t.accent : 'transparent',
                color: timeRange === mode ? '#fff' : t.text2,
                border: 'none', padding: '6px 16px', borderRadius: '6px',
                fontSize: '13px', fontWeight: timeRange === mode ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.text2, fontSize: '13px', marginLeft: '12px' }}>
          <Calendar size={16} />
          <span>Today, 22 Mar 2026</span>
        </div>
      </div>

      {/* Right side: Store filter & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '200px' }}>
          <Select
            t={t}
            label=""
            value={storeId}
            onChange={setStoreId}
            options={STORES.map(s => ({ value: s.id, label: s.name }))}
            containerStyle={{ margin: 0 }}
          />
        </div>
        
        <button
          onClick={onRefresh}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: t.bg2, color: t.text, border: `1px solid ${t.border}`,
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500', transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = t.bg3}
          onMouseOut={e => e.currentTarget.style.background = t.bg2}
        >
          <RefreshCcw size={16} /> 
          <span style={{ display: 'none', '@media (min-width: 768px)': { display: 'inline' }}}>Refresh</span>
        </button>
        
        <Btn onClick={onDownloadReport} t={t} variant="primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} />
          Report
        </Btn>
      </div>
    </div>
  )
}
