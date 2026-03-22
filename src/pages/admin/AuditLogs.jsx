import React, { useState, useMemo } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, FileText, Activity, ShieldAlert } from 'lucide-react'

export const AuditLogs = ({ auditLogs, t }) => {
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const modules = ['all', ...new Set(auditLogs.map(l => l.module))]
  
  // Calculate Stats
  const todayLogs = auditLogs.filter(l => {
    // Assuming timestamp format "DD/MM/YYYY, HH:MM:SS" from ts() utility
    const logDate = l.timestamp.split(',')[0].trim()
    const today = new Date().toLocaleString("en-GB", { hour12: false }).split(',')[0].trim()
    return logDate === today
  }).length

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter
      const searchStr = `${log.user} ${log.action} ${log.details} ${log.id}`.toLowerCase()
      const matchSearch = searchStr.includes(search.toLowerCase())
      return matchModule && matchSearch
    })
  }, [auditLogs, moduleFilter, search])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    if (!filteredLogs.length) return
    const headers = ['Log ID', 'User', 'Role', 'Action', 'Module', 'Details', 'Timestamp']
    const rows = filteredLogs.map(l => [
      `"${l.id}"`, `"${l.user}"`, `"${l.role}"`, `"${l.action}"`, `"${l.module}"`, `"${l.details}"`, `"${l.timestamp}"`
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const roleColors = { admin: '#ef4444', manager: '#f59e0b', cashier: '#10b981', customer: '#3b82f6', system: '#8b5cf6' }
  const actionColors = { login: '#10b981', logout: '#6b7280', create: '#3b82f6', update: '#f59e0b', delete: '#ef4444' }

  const thStyle = { padding: '16px', textAlign: 'left', color: t.text3, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }
  const tdStyle = { padding: '16px', fontSize: '13px', color: t.text, borderBottom: `1px solid ${t.border}` }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: t.text, margin: '0 0 8px 0' }}>Audit Logs</h1>
        <p style={{ color: t.text3, fontSize: '14px', margin: 0 }}>Monitor system activities, user actions, and security events.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ background: `${t.accent}15`, padding: '12px', borderRadius: '10px', color: t.accent }}><FileText size={24} /></div>
          <div>
            <div style={{ color: t.text3, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Total Logs</div>
            <div style={{ color: t.text, fontSize: '24px', fontWeight: '800' }}>{auditLogs.length.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#10b98115', padding: '12px', borderRadius: '10px', color: '#10b981' }}><Activity size={24} /></div>
          <div>
            <div style={{ color: t.text3, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Today's Activity</div>
            <div style={{ color: t.text, fontSize: '24px', fontWeight: '800' }}>{todayLogs.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#ef444415', padding: '12px', borderRadius: '10px', color: '#ef4444' }}><ShieldAlert size={24} /></div>
          <div>
            <div style={{ color: t.text3, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Security Events</div>
            <div style={{ color: t.text, fontSize: '24px', fontWeight: '800' }}>{auditLogs.filter(l => l.module === 'Auth' || l.action === 'delete').length}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', background: t.bg, padding: '16px 20px', borderRadius: '12px', border: `1px solid ${t.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: t.text3, marginRight: '8px' }}>MODULE:</div>
          {modules.map(m => (
            <button
              key={m}
              onClick={() => { setModuleFilter(m); setCurrentPage(1); }}
              style={{
                background: moduleFilter === m ? t.accent : t.bg2,
                color: moduleFilter === m ? '#fff' : t.text,
                border: `1px solid ${moduleFilter === m ? t.accent : t.border}`,
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
              }}
            >
              {m}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.text3 }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: t.accent, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = 0.9}
            onMouseOut={e => e.currentTarget.style.opacity = 1}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ background: t.bg2, borderBottom: `1px solid ${t.border}` }}>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Module</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? paginatedLogs.map((l) => {
                const rColor = roleColors[l.role] || '#3b82f6'
                let aColor = actionColors[l.action.toLowerCase()] || '#3b82f6'
                if (l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove')) aColor = '#ef4444'
                if (l.action.toLowerCase().includes('update') || l.action.toLowerCase().includes('edit')) aColor = '#f59e0b'
                
                return (
                  <tr key={l.id} style={{ transition: 'background 0.2s', ':hover': { background: t.bg2 } }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: t.text3, fontSize: '11px' }}>{l.id}</td>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{l.user}</td>
                    <td style={tdStyle}>
                      <span style={{ color: rColor, background: `${rColor}15`, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {l.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: aColor, border: `1px solid ${aColor}40`, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: t.text2 }}>{l.module}</td>
                    <td style={tdStyle}>{l.details}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: t.text3, fontSize: '11px' }}>{l.timestamp}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: t.text3, fontSize: '14px' }}>
                    No audit logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: '13px', color: t.text3 }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg2, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, color: t.text }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg2, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, color: t.text }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
