import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { updateProfile } from '../api/profile'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('et-theme') || 'dark')
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('et-lang')
    if (saved) return saved
    const browser = (navigator.language || navigator.languages?.[0] || '').toLowerCase()
    return browser.startsWith('tr') ? 'tr' : 'en'
  })
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('et-fontsize') || 'md')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('et-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-fontsize', fontSize)
    localStorage.setItem('et-fontsize', fontSize)
  }, [fontSize])

  const langMounted = useRef(false)
  useEffect(() => {
    localStorage.setItem('et-lang', lang)
    if (langMounted.current) {
      updateProfile({ language_preference: lang }).catch(() => {})
    } else {
      langMounted.current = true
    }
  }, [lang])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition) { setTheme(next); return }
    document.startViewTransition(() => setTheme(next))
  }
  const toggleLang = () => setLang(l => l === 'tr' ? 'en' : 'tr')
  const cycleFontSize = () => setFontSize(f => ({ md: 'lg', lg: 'xl', xl: 'md' }[f]))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, setLang, toggleLang, fontSize, cycleFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
