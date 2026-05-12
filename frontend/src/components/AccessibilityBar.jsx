import { useState } from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { SunIcon, MoonIcon, SlidersIcon } from './Icons'

export default function AccessibilityBar() {
  const { theme, toggleTheme, fontSize, cycleFontSize } = useTheme()
  const [open, setOpen] = useState(false)

  const fontLabel = { md: 'A', lg: 'A+', xl: 'A++' }[fontSize]

  const btnCls = "w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer"
  const btnStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-center gap-1.5">
      {open && (
        <>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            className={btnCls} style={btnStyle}>
            {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
          <button onClick={cycleFontSize} title="Yazı boyutu"
            className={`${btnCls} text-xs font-bold`} style={btnStyle}>
            {fontLabel}
          </button>
        </>
      )}
      <button onClick={() => setOpen(v => !v)} title="Erişilebilirlik"
        className={`${btnCls} ${open ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={btnStyle}>
        <SlidersIcon size={15} />
      </button>
    </div>
  )
}
