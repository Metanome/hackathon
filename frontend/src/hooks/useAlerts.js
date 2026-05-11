import { useState, useEffect, useCallback } from 'react'
import { getAlerts, resolveAlert } from '../api/alerts'

export function useAlerts(all = false) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAlerts(await getAlerts(all))
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [all])

  useEffect(() => { refresh() }, [refresh])

  const resolve = useCallback(async (id) => {
    await resolveAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  return { alerts, loading, error, refresh, resolve }
}
