import { T } from '../constants'
import { CheckCircle2Icon, AlertTriangleIcon, AlertCircleIcon } from './Icons'
import { useTheme } from '../providers/ThemeProvider'

const classMap = {
  ok: 'badge badge-ok',
  low: 'badge badge-low',
  critical: 'badge badge-critical',
}

export default function StockBadge({ status }) {
  const { lang } = useTheme()
  const t = T[lang]
  return (
    <span className={classMap[status] ?? 'badge'} style={classMap[status] ? {} : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
      {status === 'critical' ? <AlertCircleIcon /> : status === 'low' ? <AlertTriangleIcon /> : <CheckCircle2Icon />}
      {t.stockStatusLabels[status] ?? status}
    </span>
  )
}
