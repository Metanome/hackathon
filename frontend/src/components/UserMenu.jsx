import { useRef, useState, useEffect } from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { useProfile } from '../providers/ProfileProvider'
import { T } from '../constants'
import { SunIcon, MoonIcon } from './Icons'

const getInitials = (name) =>
  name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'A'

export default function UserMenu() {
  const { theme, toggleTheme, lang, toggleLang, fontSize, cycleFontSize } = useTheme()
  const { profile, setNeedsSetup } = useProfile()
  const t = T[lang]
  const displayName = profile.display_name || 'Admin'
  const initials = getInitials(displayName)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const rowCls = "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors text-left"
  const badgeCls = "text-xs font-semibold px-2 py-0.5 rounded"
  const badgeStyle = { background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors"
      >
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.store_name || '—'}</div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {initials}
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.store_name || '—'}</div>
          </div>

          <button
            onClick={toggleTheme}
            className={rowCls}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <MoonIcon size={14} /> : <SunIcon size={14} />}
              {t.appearance}
            </span>
            <span className={badgeCls} style={badgeStyle}>
              {theme === 'dark' ? t.dark : t.light}
            </span>
          </button>

          <button
            onClick={toggleLang}
            className={rowCls}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span>{t.language}</span>
            <span className={badgeCls} style={badgeStyle}>
              {lang.toUpperCase()}
            </span>
          </button>

          <button
            onClick={cycleFontSize}
            className={rowCls}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span>{t.fontSizeLabel}</span>
            <span className={badgeCls} style={badgeStyle}>
              {{ md: 'A', lg: 'A+', xl: 'A++' }[fontSize]}
            </span>
          </button>
          <div style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { setNeedsSetup(true); setOpen(false) }}
              className={rowCls}
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              {t.editProfile}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
