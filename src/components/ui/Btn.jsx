import { THEMES } from '@/lib/theme'

export const Btn = ({ onClick, children, variant = "primary", size = "md", disabled = false, style = {}, t, fullWidth = false }) => {
  const theme = t || THEMES.light
  const V = {
    primary: { background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, color: "#fff", border: "none", boxShadow: `0 2px 8px ${theme.accent}40` },
    secondary: { background: theme.bg3, color: theme.text2, border: `1px solid ${theme.border}` },
    success: { background: `linear-gradient(135deg,${theme.green},#15803d)`, color: "#fff", border: "none" },
    danger: { background: `linear-gradient(135deg,${theme.red},#b91c1c)`, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: theme.text3, border: `1px solid ${theme.border}` },
    outline: { background: "transparent", color: theme.accent, border: `2px solid ${theme.accent}` },
    teal: { background: `linear-gradient(135deg,${theme.teal},#0f766e)`, color: "#fff", border: "none" },
  }
  const S = { sm: { padding: "5px 12px", fontSize: 11, borderRadius: 7 }, md: { padding: "9px 18px", fontSize: 13, borderRadius: 9 }, lg: { padding: "13px 26px", fontSize: 14, borderRadius: 10 } }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...V[variant], ...S[size], fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", width: fullWidth ? "100%" : undefined, fontFamily: "inherit", ...style }}>
      {children}
    </button>
  )
}
