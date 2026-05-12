import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'

export default function AgentThinking({ step = 0 }) {
  const { lang } = useTheme()
  const t = T[lang]
  const STEPS = [t.uploadingFile, t.classifyingInput, t.runningAI, t.updatingRecords, t.generatingReasoning]

  return (
    <div className="card flex flex-col items-center py-10 gap-5"
      style={{ border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
        <div className="absolute inset-0 rounded-full border-t-2 animate-spin" style={{ borderTopColor: 'var(--accent)', borderColor: 'transparent' }} />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{STEPS[step] ?? t.processing}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.agentThinkingCaption}</div>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ background: i <= step ? 'var(--accent)' : 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    </div>
  )
}
