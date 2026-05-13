import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { resetDatabase } from '../api/settings'
import { useToast } from '../providers/ToastProvider'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'
import ConfirmDialog from '../components/ConfirmDialog'
import { EyeIcon, EyeOffIcon, SaveIcon, RotateCcwIcon } from '../components/Icons'

export default function Settings() {
  const { settings, loading, saving, error, save } = useSettings()
  const { lang } = useTheme()
  const t = T[lang]
  const toast = useToast()
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSave = async () => {
    const payload = {}
    if (model && model !== settings?.default_model) payload.default_model = model
    if (apiKey.trim()) payload.gemini_api_key = apiKey.trim()
    if (!Object.keys(payload).length) return
    try {
      await save(payload)
      setApiKey('')
      setSaved(true)
      toast(t.settingsSaved, 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {
      toast(t.settingsSaveFailed, 'error')
    }
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.loading}</div>

  const currentModel = model || settings?.default_model || ''

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.settings}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t.settingsDesc}
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Gemini Model
          </label>
          <select className="select" value={currentModel} onChange={e => setModel(e.target.value)}>
            {(settings?.available_models ?? []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="input pr-16"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.api_key_set ? t.apiKeySetPlaceholder : t.apiKeyPlaceholder}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setShowKey(v => !v)} type="button">
              {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {t.apiKeyNote}
          </p>
        </div>

        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{t.error}: {error}</p>}

        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
          {saving
            ? <><RotateCcwIcon size={15} className="animate-spin" /> {t.saving}</>
            : saved
            ? <><SaveIcon size={15} /> {t.savedBang}</>
            : <><SaveIcon size={15} /> {t.saveSettings}</>}
        </button>
      </div>

      <div className="card text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
        <div>{t.currentModel} <span style={{ color: 'var(--text-secondary)' }}>{settings?.default_model}</span></div>
        <div>API key: <span style={{ color: 'var(--text-secondary)' }}>{settings?.api_key_set ? t.keySet : t.keyNotSet}</span></div>
      </div>

      <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--danger)' }}>
          {t.dangerZone}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t.dangerZoneDesc}
        </p>
        <button
          className="btn-ghost flex items-center gap-2 py-2 px-4 transition-colors"
          style={{ color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}
          disabled={resetting}
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcwIcon size={15} />
          {resetting
            ? t.resetting
            : t.resetDb}
        </button>

        <ConfirmDialog
          open={confirmReset}
          title={t.resetConfirmTitle}
          message={t.resetConfirmMsg}
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => {
            setConfirmReset(false)
            setResetting(true)
            try {
              await resetDatabase()
              window.location.reload()
            } catch (e) {
              toast(`${t.resetFailed} ${e.response?.data?.detail || e.message}`, 'error')
              setResetting(false)
            }
          }}
        />
      </div>
    </div>
  )
}
