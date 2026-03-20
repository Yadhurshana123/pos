import { THEMES } from '@/lib/theme'

export const Badge = ({ text, color = "blue", t, size = "sm" }) => {
  const theme = t || THEMES.light
  const M = {
    green: [theme.greenBg, theme.green, theme.greenBorder],
    red: [theme.redBg, theme.red, theme.redBorder],
    yellow: [theme.yellowBg, theme.yellow, theme.yellowBorder],
    blue: [theme.blueBg, theme.blue, theme.blueBorder],
    purple: [theme.purpleBg, theme.purple, theme.purpleBorder],
    orange: [theme.orangeBg, theme.orange, theme.orangeBorder],
    teal: [theme.tealBg, theme.teal, theme.tealBorder],
  }
  const [bg, fg, bdr] = M[color] || M.blue
  return <span style={{ background: bg, color: fg, border: `1px solid ${bdr}`, padding: size === "lg" ? "4px 14px" : "2px 10px", borderRadius: 20, fontSize: size === "lg" ? 12 : 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>{text}</span>
}
