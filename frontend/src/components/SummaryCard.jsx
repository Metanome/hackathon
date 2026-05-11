export default function SummaryCard({ label, value, accent = false }) {
  return (
    <div className={`card flex items-center gap-4 ${accent ? 'border-teal-600/40' : ''}`}>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value ?? '-'}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
