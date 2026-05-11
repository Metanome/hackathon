import { CheckCircle2Icon, AlertTriangleIcon, BellIcon, MicIcon, PackageIcon } from './Icons'

const TAG_MAP = {
  '[ok]':    { Icon: CheckCircle2Icon, color: 'text-teal-400' },
  '[warn]':  { Icon: AlertTriangleIcon, color: 'text-amber-400' },
  '[alert]': { Icon: BellIcon,          color: 'text-teal-400' },
  '[mic]':   { Icon: MicIcon,           color: 'text-slate-400' },
  '[info]':  { Icon: PackageIcon,       color: 'text-slate-500' },
}

function ActionItem({ text }) {
  const entry = Object.entries(TAG_MAP).find(([tag]) => text.startsWith(tag))
  if (entry) {
    const [tag, { Icon, color }] = entry
    return (
      <li className="flex items-start gap-2 text-xs text-slate-400 font-mono">
        <Icon size={13} className={`mt-0.5 shrink-0 ${color}`} />
        <span>{text.slice(tag.length).trim()}</span>
      </li>
    )
  }
  return <li className="text-xs text-slate-400 font-mono pl-5">{text}</li>
}

export default function ReasoningPanel({ reasoning, actions, model }) {
  if (!reasoning) return null
  return (
    <div className="mt-4 card border border-teal-600/30 bg-teal-950/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-teal-400 text-sm font-semibold">Agent Reasoning</span>
        {model && <span className="text-xs text-slate-600 ml-auto">{model}</span>}
      </div>
      {actions && actions.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {actions.map((a, i) => <ActionItem key={i} text={a} />)}
        </ul>
      )}
      <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-3">
        {reasoning}
      </p>
    </div>
  )
}
