import { AlertTriangleIcon } from './Icons'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'

/**
 * A simple inline modal confirm dialog.
 * Usage: <ConfirmDialog
 *   open={open}
 *   title="Delete Product?"
 *   message="This cannot be undone."
 *   onConfirm={handleConfirm}
 *   onCancel={() => setOpen(false)}
 *   danger
 * />
 */
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  const { lang } = useTheme()
  const t = T[lang]
  if (!open) return null
  return (
    <div className="fixed inset-0 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5" style={{ color: danger ? 'var(--danger)' : 'var(--warning)' }}>
            <AlertTriangleIcon size={20} />
          </span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} className="btn-ghost">{t.cancel}</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 text-white"
            style={{ background: danger ? 'var(--danger)' : 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
