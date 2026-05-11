const STEPS = [
  'Uploading file...',
  'Classifying input...',
  'Running AI analysis...',
  'Updating records...',
  'Generating reasoning...',
]

export default function AgentThinking({ step = 0 }) {
  return (
    <div className="card border-teal-600/30 bg-teal-950/20 flex flex-col items-center py-10 gap-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-teal-600/30" />
        <div className="absolute inset-0 rounded-full border-t-2 border-teal-400 animate-spin" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-teal-400">{STEPS[step] ?? 'Processing...'}</div>
        <div className="text-xs text-slate-600 mt-1">Gemini AI is analyzing your input</div>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-teal-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
