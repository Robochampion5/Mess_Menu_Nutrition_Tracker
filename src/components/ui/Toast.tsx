import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

// Simple singleton toast state
let toastListeners: ((toasts: Toast[]) => void)[] = []
let currentToasts: Toast[] = []

function emit(toasts: Toast[]) {
  currentToasts = toasts
  toastListeners.forEach((fn) => fn(toasts))
}

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(message: string, type: ToastType = 'info', durationMs = 3500) {
  const id = String(Date.now())
  const toast: Toast = { id, message, type }
  emit([...currentToasts, toast])
  setTimeout(() => {
    emit(currentToasts.filter((t) => t.id !== id))
  }, durationMs)
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={16} className="text-green-400 flex-shrink-0" />,
  error: <AlertCircle size={16} className="text-red-400 flex-shrink-0" />,
  info: <Info size={16} className="text-blue-400 flex-shrink-0" />,
}

const borderColors: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(90vw,380px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 bg-[var(--color-surface-2)] border ${borderColors[toast.type]}
                      rounded-[var(--radius-lg)] px-4 py-3 shadow-xl
                      animate-in slide-in-from-top-2 duration-200`}
        >
          {icons[toast.type]}
          <span className="text-sm text-white flex-1">{toast.message}</span>
          <button
            onClick={() => emit(currentToasts.filter((t) => t.id !== toast.id))}
            className="text-[var(--color-text-tertiary)] hover:text-white"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
