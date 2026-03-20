import { THEMES } from '@/lib/theme'

export const Input = ({ label, value, onChange, type = "text", placeholder, t, required, note, readOnly, prefix }) => {
  const theme = t || THEMES.light
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: theme.text3, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}{required && <span style={{ color: theme.red }}> *</span>}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && <span style={{ position: "absolute", left: 12, fontSize: 13, color: theme.text3, pointerEvents: "none" }}>{prefix}</span>}
        <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} readOnly={readOnly}
          style={{ background: readOnly ? theme.bg4 : theme.input, border: `1px solid ${theme.border}`, borderRadius: 9, padding: `10px ${prefix ? "10px 10px 36px" : "14px"}`, color: theme.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", paddingLeft: prefix ? "36px" : "14px" }} />
      </div>
      {note && <span style={{ fontSize: 11, color: theme.text4 }}>{note}</span>}
    </div>
  )
}
