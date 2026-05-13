import { useEffect, useState } from 'react'
import { APP_NAME, T } from '../constants'
import { useTheme } from '../providers/ThemeProvider'
import { useProfile } from '../providers/ProfileProvider'
import { BookOpenIcon, GitHubIcon } from './Icons'
import appPkg from '../../package.json'

const REPO_URL = 'https://github.com/Metanome/esnaf-tezgahi'

export default function Footer() {
  const { lang } = useTheme()
  const t = T[lang]
  const { profile } = useProfile()
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/health')
        if (!cancelled) setOnline(res.ok)
      } catch {
        if (!cancelled) setOnline(false)
      }
    }
    check()
    const id = setInterval(check, 10000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const linkStyle = { color: 'var(--text-muted)' }
  const linkHover = e => e.currentTarget.style.color = 'var(--accent)'
  const linkLeave = e => e.currentTarget.style.color = 'var(--text-muted)'

  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
      className="px-4 sm:px-8 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{profile.store_name || APP_NAME}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">YZTA 5.0 Hackathon</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
          {online !== null && (
            <span className="flex items-center gap-1">
              <span className="relative flex h-2.5 w-2.5">
                {online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                    style={{ background: '#22c55e' }} />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${!online ? 'animate-pulse' : ''}`}
                  style={{ background: online ? '#22c55e' : '#ef4444',
                    boxShadow: online ? '0 0 6px #22c55e88' : '0 0 6px #ef444488' }} />
              </span>
              <span className="hidden sm:inline">{online ? t.backendOnline : t.backendOffline}</span>
            </span>
          )}

          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">v{appPkg.version}</span>
          <span>·</span>

          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" title="GitHub"
            style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}
            className="flex items-center gap-1 transition-colors">
            <GitHubIcon size={13} />
            GitHub
          </a>
          <span className="hidden sm:inline">·</span>

          <a href="/docs" target="_blank" rel="noopener noreferrer"
            style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}
            className="hidden sm:flex items-center gap-1 transition-colors">
            <BookOpenIcon size={13} />
            {t.apiReference}
          </a>
          <span className="hidden sm:inline">·</span>

          <a href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank" rel="noopener noreferrer"
            style={linkStyle} onMouseEnter={linkHover} onMouseLeave={linkLeave}
            className="hidden sm:inline transition-colors">
            AGPL v3
          </a>
        </div>
      </div>
    </footer>
  )
}
