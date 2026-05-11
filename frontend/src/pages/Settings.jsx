import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { resetDatabase } from '../api/settings'

export default function Settings() {
  const { settings, loading, saving, error, save } = useSettings()
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSave = async () => {
    const payload = {}
    if (model && model !== settings?.default_model) payload.default_model = model
    if (apiKey.trim()) payload.gemini_api_key = apiKey.trim()
    if (!Object.keys(payload).length) return

    try {
      await save(payload)
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {}
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading settings...</div>

  const currentModel = model || settings?.default_model || ''

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your AI model and API credentials.</p>
      </div>

      <div className="card space-y-5">
        {/* Model selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Gemini Model
          </label>
          <select
            className="select"
            value={currentModel}
            onChange={e => setModel(e.target.value)}
          >
            {(settings?.available_models ?? []).map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="input pr-16"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.api_key_set ? '••••••••••••••••••• (key is set)' : 'Enter your API key'}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              onClick={() => setShowKey(v => !v)}
              type="button"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            API key is stored in your .env file and never sent to the browser.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">Error: {error}</p>}

        <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="card text-xs text-slate-600 space-y-1">
        <div>Current model: <span className="text-slate-400">{settings?.default_model}</span></div>
        <div>API key: <span className="text-slate-400">{settings?.api_key_set ? 'Set' : 'Not set'}</span></div>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-8">
        <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-slate-400 text-sm mb-4">
          Irreversibly drop all database tables and reseed with default data. 
          Use this to reset your environment for a clean demo.
        </p>
        <button 
          className="btn-ghost text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:text-red-300 transition-colors py-2 px-4"
          disabled={resetting}
          onClick={async () => {
            if (window.confirm("Are you sure? This will delete all orders, inventory, and alerts!")) {
              setResetting(true)
              try {
                await resetDatabase()
                window.location.reload()
              } catch (e) {
                alert("Reset failed: " + (e.response?.data?.detail || e.message))
                setResetting(false)
              }
            }
          }}
        >
          {resetting ? 'Resetting...' : 'Reset Database & Reseed'}
        </button>
      </div>
    </div>
  )
}
