import { STOCK_STATUS_LABELS } from '../constants'

const classMap = {
  ok: 'badge badge-ok',
  low: 'badge badge-low',
  critical: 'badge badge-critical',
}

export default function StockBadge({ status }) {
  return (
    <span className={classMap[status] ?? 'badge bg-slate-700 text-slate-400'}>
      {status === 'critical' ? '🔴' : status === 'low' ? '🟡' : '🟢'}
      {' '}
      {STOCK_STATUS_LABELS[status] ?? status}
    </span>
  )
}
