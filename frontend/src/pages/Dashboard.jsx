import AlertCard from '../components/AlertCard'
import SummaryCard from '../components/SummaryCard'
import { useDashboard } from '../hooks/useDashboard'
import { useAlerts } from '../hooks/useAlerts'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'

export default function Dashboard() {
  const { summary, logs, loading, error, refresh } = useDashboard()
  const { alerts, resolve } = useAlerts(false)
  const { lang } = useTheme()
  const t = T[lang]

  const handleResolve = async (id) => {
    await resolve(id)
    refresh()
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.loading}</div>
  if (error) return <div className="text-sm" style={{ color: '#f87171' }}>{t.error}: {error}</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.dashboard}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Anadolu Doğal Kooperatifi - Operations Overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard label={t.ordersToday} value={summary?.orders_today ?? 0} accent />
        <SummaryCard label={t.activeAlerts} value={alerts.length} />
      </div>

      <section>
        <h2 className="section-title">{t.activeAlerts}</h2>
        {alerts.length === 0 ? (
          <div className="card text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {t.noAlerts}
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <AlertCard key={a.id} alert={a} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">{t.agentActivity}</h2>
        {logs.length === 0 ? (
          <div className="card text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {t.noActivity}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-source">
                    {log.input_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{log.reasoning}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
