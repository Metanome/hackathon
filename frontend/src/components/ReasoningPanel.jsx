export default function ReasoningPanel({ reasoning, actions, model }) {
  if (!reasoning) return null
  return (
    <div className="mt-4 card border border-teal-600/30 bg-teal-950/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-teal-400 text-sm font-semibold">Agent Reasoning</span>
        {model && <span className="text-xs text-slate-600 ml-auto">{model}</span>}
      </div>
      {actions && actions.length > 0 && (
        <ul className="mb-3 space-y-1">
          {actions.map((a, i) => (
            <li key={i} className="text-xs text-slate-400 font-mono">{a}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700 pt-3">
        {reasoning}
      </p>
    </div>
  )
}
