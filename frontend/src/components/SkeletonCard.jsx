export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card animate-pulse">
      <div className="h-4 rounded mb-3" style={{ background: 'var(--bg-elevated)', width: '40%' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded mb-2"
          style={{ background: 'var(--bg-elevated)', width: i === lines - 1 ? '65%' : '100%' }} />
      ))}
    </div>
  )
}
