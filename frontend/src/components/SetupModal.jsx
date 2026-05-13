import { useState } from 'react'
import { useProfile } from '../providers/ProfileProvider'
import { useTheme } from '../providers/ThemeProvider'
import { T, APP_NAME } from '../constants'
import { GlobeIcon, MoonIcon, SunIcon, XIcon } from './Icons'


export default function SetupModal() {
  const { profile, saveProfile, setNeedsSetup } = useProfile()
  const { lang, theme, toggleTheme, toggleLang } = useTheme()
  const t = T[lang]
  const isEditing = !!profile.display_name

  const [displayName, setDisplayName] = useState(profile.display_name)
  const [storeName, setStoreName] = useState(profile.store_name)
  const [saving, setSaving] = useState(false)

  const valid = displayName.trim().length > 0 && storeName.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    try {
      await saveProfile({ display_name: displayName.trim(), store_name: storeName.trim(), language_preference: lang })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={isEditing ? () => setNeedsSetup(false) : undefined}
    >
      <div className="card w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >

        {/* Top row: lang toggle (left) + close button (right, edit mode only) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} title={t.appearance}
              className="p-1.5 rounded-lg transition-colors flex items-center justify-center"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <button onClick={toggleLang} title={t.language}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}>
              <GlobeIcon size={13} />{lang.toUpperCase()}
            </button>
          </div>
          {isEditing ? (
            <button
              onClick={() => setNeedsSetup(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <XIcon size={14} />
            </button>
          ) : <div />}
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--accent)' }}>
            <img src="/favicon.svg" alt={APP_NAME} className="w-9 h-9"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t.setupWelcome}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {t.setupSubtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.setupDisplayName}
            </label>
            <input
              type="text"
              className="input"
              placeholder={t.setupDisplayNamePlaceholder}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.setupStoreName}
            </label>
            <input
              type="text"
              className="input"
              placeholder={t.setupStoreNamePlaceholder}
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              maxLength={80}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            disabled={!valid || saving}
          >
            {saving ? '...' : t.setupSave}
          </button>
        </form>
      </div>
    </div>
  )
}
