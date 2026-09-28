import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, maxWidth = 'sm:max-w-2xl max-w-md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-0 max-sm:items-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative bg-white rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-3xl shadow-2xl border border-slate-200 w-full ${maxWidth} overflow-hidden z-10 animate-in max-sm:slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-sm:max-h-[92vh]`}>
        {/* Mobile handle indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center cursor-grab shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh] max-sm:max-h-[80vh] max-sm:pb-10">
          {children}
        </div>
      </div>
    </div>
  )
}
