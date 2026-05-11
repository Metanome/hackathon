import { useState, useEffect, useCallback } from 'react'
import { getDashboardSummary, getAgentLogs } from '../api/dashboard'
import { getAlerts } from '../api/alerts'

export function useDashboard() {
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, a, l] = await Promise.all([
        getDashboardSummary(),
        getAlerts(false),
        getAgentLogs(5),
      ])
      setSummary(s)
      setAlerts(a)
      setLogs(l)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { summary, alerts, logs, loading, error, refresh }
}
