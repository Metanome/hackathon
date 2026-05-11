import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from '../api/settings'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSettings(await getSettings())
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await saveSettings(data)
      setSettings(updated)
      return updated
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
      throw e
    } finally {
      setSaving(false)
    }
  }, [])

  return { settings, loading, saving, error, save, refresh }
}
