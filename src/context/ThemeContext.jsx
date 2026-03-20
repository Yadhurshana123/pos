import { createContext, useContext, useState, useCallback } from 'react'
import { THEMES } from '@/lib/theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)
  const t = darkMode ? THEMES.dark : THEMES.light
  const toggleDark = useCallback(() => setDarkMode(d => !d), [])

  return (
    <ThemeContext.Provider value={{ t, darkMode, setDarkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
