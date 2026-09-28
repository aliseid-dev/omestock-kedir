import React from 'react'
import { cn } from '../../lib/utils'

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors select-none touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-emerald-500 shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus:ring-slate-400 border border-slate-200',
    outline: 'border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 focus:ring-emerald-500',
    ghost: 'hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white focus:ring-rose-500 shadow-sm',
  }

  const sizes = {
    sm: 'text-xs px-3 py-2 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-5 py-3 min-h-[48px] gap-2.5',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
