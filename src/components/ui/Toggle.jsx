import { THEMES } from '@/lib/theme'

export const Toggle = ({ value, onChange, label, t }) => {
  const theme = t || THEMES.light
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onChange(!value)}>
      <div style={{ width: 42, height: 23, borderRadius: 12, background: value ? theme.accent : theme.border2, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
      </div>
      {label && <span style={{ fontSize: 13, color: theme.text2, userSelect: "none" }}>{label}</span>}
    </div>
  )
}
