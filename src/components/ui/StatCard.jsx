import { Card } from './Card'
import { THEMES } from '@/lib/theme'

export const StatCard = ({ title, value, sub, color, icon, t, trend }) => {
  const theme = t || THEMES.light
  return (
    <Card t={t}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: theme.text3, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 }}>{title}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: color || theme.accent, letterSpacing: -0.5, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: theme.text4 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 12, color: trend > 0 ? theme.green : theme.red, marginTop: 4, fontWeight: 700 }}>{trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week</div>}
    </Card>
  )
}
