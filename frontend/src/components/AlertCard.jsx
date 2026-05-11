import { useState } from 'react'
import { ALERT_TYPE_LABELS } from '../constants'

export default function AlertCard({ alert, onResolve }) {
  const [showEmail, setShowEmail] = useState(false)
  const [resolving, setResolving] = useState(false)

  const isCritical = alert.type === 'critical_stock'

  const handleResolve = async () => {
    setResolving(true)
    await onResolve(alert.id)
  }

  return (
    <div className={`card border-l-4 ${isCritical ? 'border-l-red-500' : 'border-l-amber-500'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${isCritical ? 'badge-critical' : 'badge-low'}`}>
              {ALERT_TYPE_LABELS[alert.type]}
            </span>
            {alert.product_name && (
              <span className="text-xs text-slate-500">{alert.product_name}</span>
            )}
          </div>
          <p className="text-sm text-slate-300">{alert.message}</p>
          <p className="text-xs text-slate-600 mt-1">
            {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {alert.draft_email && (
            <button
              className="btn-ghost text-teal-400 hover:text-teal-300"
              onClick={() => setShowEmail(v => !v)}
            >
              {showEmail ? 'Hide' : 'View'} Email
            </button>
          )}
          <button
            className="btn-ghost text-green-400 hover:text-green-300 disabled:opacity-40"
            onClick={handleResolve}
            disabled={resolving}
          >
            {resolving ? '...' : 'Dismiss'}
          </button>
        </div>
      </div>

      {showEmail && alert.draft_email && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className="text-xs text-teal-400 font-semibold mb-2">Draft Supplier Email</div>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{alert.draft_email}</pre>
        </div>
      )}
    </div>
  )
}
