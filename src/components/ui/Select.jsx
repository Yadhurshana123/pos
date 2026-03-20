import { THEMES } from '@/lib/theme'

export const Select = ({ label, value, onChange, options, t }) => {
  const theme = t || THEMES.light
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: theme.text3, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 9, padding: "10px 14px", color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  )
}
