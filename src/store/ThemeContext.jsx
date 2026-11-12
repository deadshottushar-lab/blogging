import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

/** Light/dark theme toggle, persisted alongside the rest of the app state. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lumen.theme.v1'))
      if (stored === 'light' || stored === 'dark') return stored
    } catch {
      /* ignore */
    }
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('lumen.theme.v1', JSON.stringify(theme))
    } catch {
      /* ignore */
    }
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
