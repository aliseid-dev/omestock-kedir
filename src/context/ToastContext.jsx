import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newToast = { id, type, title, message }

    setToasts((prev) => [...prev.slice(-4), newToast])

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }, [dismissToast])

  const toast = {
    success: (title, message, duration) => showToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) => showToast({ type: 'error', title, message, duration }),
    warning: (title, message, duration) => showToast({ type: 'warning', title, message, duration }),
    info: (title, message, duration) => showToast({ type: 'info', title, message, duration }),
  }

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toast }}>
      {children}
      {/* Global Toast Notification Container */}
      <div 
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] pointer-events-none flex flex-col gap-2.5"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: {
              border: 'border-emerald-200/90 shadow-emerald-500/10',
              bg: 'bg-white/95 sm:bg-emerald-50/95',
              iconBg: 'bg-emerald-100 text-emerald-700',
              titleColor: 'text-slate-900 sm:text-emerald-950',
              msgColor: 'text-slate-600 sm:text-emerald-800',
              icon: CheckCircle2,
            },
            error: {
              border: 'border-rose-200/90 shadow-rose-500/10',
              bg: 'bg-white/95 sm:bg-rose-50/95',
              iconBg: 'bg-rose-100 text-rose-700',
              titleColor: 'text-slate-900 sm:text-rose-950',
              msgColor: 'text-slate-600 sm:text-rose-800',
              icon: AlertCircle,
            },
            warning: {
              border: 'border-amber-200/90 shadow-amber-500/10',
              bg: 'bg-white/95 sm:bg-amber-50/95',
              iconBg: 'bg-amber-100 text-amber-700',
              titleColor: 'text-slate-900 sm:text-amber-950',
              msgColor: 'text-slate-600 sm:text-amber-800',
              icon: AlertTriangle,
            },
            info: {
              border: 'border-blue-200/90 shadow-blue-500/10',
              bg: 'bg-white/95 sm:bg-blue-50/95',
              iconBg: 'bg-blue-100 text-blue-700',
              titleColor: 'text-slate-900 sm:text-blue-950',
              msgColor: 'text-slate-600 sm:text-blue-800',
              icon: Info,
            },
          }[t.type] || {
            border: 'border-slate-200/90',
            bg: 'bg-white/95',
            iconBg: 'bg-slate-100 text-slate-700',
            titleColor: 'text-slate-900',
            msgColor: 'text-slate-600',
            icon: Info,
          }

          const IconComponent = typeStyles.icon

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto w-full p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${typeStyles.bg} ${typeStyles.border}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${typeStyles.iconBg}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className={`font-bold text-xs tracking-tight ${typeStyles.titleColor}`}>
                  {t.title}
                </div>
                {t.message && (
                  <div className={`text-[11px] mt-0.5 leading-snug font-medium ${typeStyles.msgColor}`}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
