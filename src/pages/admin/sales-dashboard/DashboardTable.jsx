import React, { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { fmt } from '@/lib/utils'

export const DashboardTable = ({ data, t, settings }) => {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'net', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const filteredData = useMemo(() => {
    return data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  const sortedData = useMemo(() => {
    const sortableData = [...filteredData]
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableData
  }, [filteredData, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const thStyle = {
    padding: '16px', textAlign: 'left', color: t.text3, fontSize: '12px', 
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
    cursor: 'pointer', userSelect: 'none'
  }
  const tdStyle = { padding: '16px', fontSize: '14px', color: t.text, borderBottom: `1px solid ${t.border}` }

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp size={14} style={{ opacity: 0.2 }} />
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: '16px', fontWeight: '800', color: t.text }}>Store Performance</div>
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.text3 }} />
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
              border: `1px solid ${t.border}`, background: t.bg2, color: t.text,
              fontSize: '13px', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead style={{ background: t.bg2, borderBottom: `1px solid ${t.border}` }}>
            <tr>
              <th style={thStyle} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Store Name {sortIcon('name')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('orders')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Orders {sortIcon('orders')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('gross')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Gross Sales {sortIcon('gross')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('tax')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Tax {sortIcon('tax')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('net')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Net Sales {sortIcon('net')}</div>
              </th>
              <th style={thStyle} onClick={() => handleSort('growth')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Growth % {sortIcon('growth')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row) => (
              <tr key={row.id} style={{ transition: 'background 0.2s', ':hover': { background: t.bg2 } }}>
                <td style={{ ...tdStyle, fontWeight: '600' }}>{row.name}</td>
                <td style={tdStyle}>{row.orders.toLocaleString()}</td>
                <td style={tdStyle}>{fmt(row.gross, settings?.sym)}</td>
                <td style={tdStyle}>{fmt(row.tax, settings?.sym)}</td>
                <td style={{ ...tdStyle, fontWeight: '700', color: t.text }}>{fmt(row.net, settings?.sym)}</td>
                <td style={{ ...tdStyle }}>
                  <span style={{ 
                    color: row.growth >= 0 ? '#10b981' : '#ef4444', 
                    background: row.growth >= 0 ? '#10b98115' : '#ef444415',
                    padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'
                  }}>
                    {row.growth > 0 ? '+' : ''}{row.growth}%
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: t.text3, fontSize: '14px' }}>
                  No stores found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: t.text3 }}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            style={{ 
              padding: '6px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg2,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, color: t.text
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
            style={{ 
              padding: '6px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg2,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, color: t.text
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
