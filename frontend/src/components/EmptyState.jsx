export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center text-center py-14 gap-3">
      {icon && (
        <div style={{ color: 'var(--text-muted)', opacity: 0.35 }}>
          {icon}
        </div>
      )}
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
