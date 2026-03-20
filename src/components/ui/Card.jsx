import { useState } from 'react'
import { THEMES } from '@/lib/theme'

export const Card = ({ children, t, style = {}, onClick, hover = false }) => {
  const [hov, setHov] = useState(false)
  const theme = t || THEMES.light
  return (
    <div onClick={onClick} onMouseEnter={() => hover && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? theme.cardHover : theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, boxShadow: theme.shadow, transition: "all 0.15s", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  )
}
