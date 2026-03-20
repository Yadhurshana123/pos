import { THEMES } from '@/lib/theme'

export const Table = ({ cols, rows, empty = "No records found", t }) => {
  const theme = t || THEMES.light
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: theme.tableHead }}>
            {cols.map((c, i) => <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, color: theme.text3, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `2px solid ${theme.border}`, whiteSpace: "nowrap" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: "48px 20px", color: theme.text4, fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>{empty}
            </td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? theme.tableRow : theme.tableRowAlt, transition: "background 0.1s" }}>
                {row.map((cell, j) => <td key={j} style={{ padding: "11px 14px", color: theme.text2, borderBottom: `1px solid ${theme.border}`, verticalAlign: "middle" }}>{cell}</td>)}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
