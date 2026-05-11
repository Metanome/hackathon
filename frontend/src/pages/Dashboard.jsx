import AlertCard from '../components/AlertCard'
import SummaryCard from '../components/SummaryCard'
import { useDashboard } from '../hooks/useDashboard'
import { useAlerts } from '../hooks/useAlerts'
import { SOURCE_LABELS, STATUS_LABELS } from '../constants'

export default function Dashboard() {
  const { summary, logs, loading, error, refresh } = useDashboard()
  const { alerts, resolve } = useAlerts(false)

  const handleResolve = async (id) => {
    await resolve(id)
    refresh()
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading dashboard...</div>
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Anadolu Doğal Kooperatifi - Operations Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard label="Orders Today" value={summary?.orders_today ?? 0} accent />
        <SummaryCard label="Active Alerts" value={alerts.length} />
      </div>

      {/* Active Alerts */}
      <section>
        <h2 className="section-title">Active Alerts</h2>
        {alerts.length === 0 ? (
          <div className="card text-slate-500 text-sm text-center py-8">No active alerts - all clear</div>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <AlertCard key={a.id} alert={a} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </section>

      {/* Agent Activity Feed */}
      <section>
        <h2 className="section-title">Agent Activity</h2>
        {logs.length === 0 ? (
          <div className="card text-slate-500 text-sm text-center py-8">
            No agent activity yet. Upload an order slip or shelf photo to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-source">
                    {log.input_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{log.reasoning}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
