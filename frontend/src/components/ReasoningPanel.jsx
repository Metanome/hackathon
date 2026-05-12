import { CheckCircle2Icon, AlertTriangleIcon, BellIcon, MicIcon, PackageIcon } from './Icons'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'

const TAG_MAP = {
  '[ok]':    { Icon: CheckCircle2Icon, color: 'var(--success)' },
  '[warn]':  { Icon: AlertTriangleIcon, color: 'var(--warning)' },
  '[alert]': { Icon: BellIcon,          color: 'var(--accent)' },
  '[mic]':   { Icon: MicIcon,           color: 'var(--text-muted)' },
  '[info]':  { Icon: PackageIcon,       color: 'var(--text-muted)' },
}

function ActionItem({ text }) {
  const entry = Object.entries(TAG_MAP).find(([tag]) => text.startsWith(tag))
  if (entry) {
    const [tag, { Icon, color }] = entry
    return (
      <li className="flex items-start gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color }} className="mt-0.5 shrink-0"><Icon size={13} /></span>
        <span>{text.slice(tag.length).trim()}</span>
      </li>
    )
  }
  return <li className="text-xs font-mono pl-5" style={{ color: 'var(--text-muted)' }}>{text}</li>
}

export default function ReasoningPanel({ reasoning, actions, model }) {
  const { lang } = useTheme()
  const t = T[lang]
  if (!reasoning) return null
  return (
    <div className="mt-4 card" style={{ border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{t.agentReasoning}</span>
        {model && <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{model}</span>}
      </div>
      {actions && actions.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {actions.map((a, i) => <ActionItem key={i} text={a} />)}
        </ul>
      )}
      <p className="text-sm leading-relaxed pt-3" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
        {reasoning}
      </p>
    </div>
  )
}
