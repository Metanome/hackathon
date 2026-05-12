import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, XIcon } from '../components/Icons'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircleIcon size={16} />,
  error: <AlertCircleIcon size={16} />,
  warning: <AlertTriangleIcon size={16} />,
}

const BORDER_COLORS = {
  success: 'color-mix(in srgb, var(--success) 40%, transparent)',
  error:   'color-mix(in srgb, var(--danger)  40%, transparent)',
  warning: 'color-mix(in srgb, var(--warning) 40%, transparent)',
}

const ICON_COLORS = {
  success: 'var(--success)',
  error:   'var(--danger)',
  warning: 'var(--warning)',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl animate-in slide-in-from-top-2 fade-in duration-200"
            style={{ background: 'var(--bg-surface)', borderColor: BORDER_COLORS[t.type] ?? BORDER_COLORS.success }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: ICON_COLORS[t.type] ?? ICON_COLORS.success }}>{ICONS[t.type]}</span>
            <span className="text-sm flex-1 leading-snug" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="btn-ghost shrink-0 p-0.5 mt-0.5"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
