import React, { useState, useEffect } from 'react'
import { Lock, Delete, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export function PasscodeModal() {
  const {
    isPasscodeLocked,
    pendingUser,
    currentUser,
    verifyPasscode,
    requestPasscodeReset,
    switchUser
  } = useAuth()

  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetFeedback, setResetFeedback] = useState(null)

  const targetUser = pendingUser || currentUser

  // Clear state when modal appears or user changes
  useEffect(() => {
    setPin('')
    setErrorMsg('')
    setShowForgot(false)
    setResetFeedback(null)
    if (targetUser) {
      setResetEmail(targetUser.email)
    }
  }, [isPasscodeLocked, targetUser?.id])

  // Physical keyboard listener
  useEffect(() => {
    if (!isPasscodeLocked || showForgot) return

    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPasscodeLocked, pin, showForgot])

  if (!isPasscodeLocked) return null

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)
      setErrorMsg('')

      if (nextPin.length === 4) {
        // Auto-verify on 4th digit
        setTimeout(() => {
          const res = verifyPasscode(nextPin)
          if (!res.success) {
            setErrorMsg(res.error || 'Incorrect PIN')
            setPin('')
          }
        }, 150)
      }
    }
  }

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1))
    setErrorMsg('')
  }

  const handleResetSubmit = (e) => {
    e.preventDefault()
    const result = requestPasscodeReset(resetEmail)
    setResetFeedback(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 overflow-hidden animate-in zoom-in-95 duration-150 text-center">
        
        {!showForgot ? (
          <div>
            {/* User Avatar & Lock Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl mb-3 shadow-inner">
              {targetUser?.avatar}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              {targetUser?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter 4-digit salesperson passcode to unlock
            </p>

            {/* 4 PIN Dots */}
            <div className="flex justify-center gap-4 my-5">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      filled
                        ? 'bg-slate-900 scale-110'
                        : 'border-2 border-slate-300 bg-slate-100'
                    }`}
                  />
                )
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 mb-2 animate-bounce">
                {errorMsg}
              </p>
            )}

            {/* Touch Keypad (0-9) */}
            <div className="grid grid-cols-3 gap-2.5 my-3 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="w-16 h-14 mx-auto rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xl font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center shadow-2xs"
                >
                  {digit}
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => setPin('')}
                className="w-16 h-14 mx-auto rounded-2xl text-slate-400 hover:text-slate-700 text-xs font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="w-16 h-14 mx-auto rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xl font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center shadow-2xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="w-16 h-14 mx-auto rounded-2xl text-slate-500 hover:text-slate-800 transition-all touch-manipulation active:scale-95 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Forgot Passcode Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs font-semibold text-emerald-700 hover:underline touch-manipulation"
              >
                Forgot Passcode?
              </button>
            </div>
          </div>
        ) : (
          /* Forgot Passcode Email Reset Flow */
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Reset Sales Passcode</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your staff registered email to receive passcode recovery instructions.
              </p>
            </div>

            {resetFeedback && (
              <div className={`p-3 rounded-xl text-xs text-left ${resetFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  {resetFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{resetFeedback.success ? 'Email Sent' : 'Reset Failed'}</span>
                </div>
                <p>{resetFeedback.message || resetFeedback.error}</p>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Email:</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  placeholder="name@omedla.com"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold min-h-[44px]"
              >
                Send Reset Link
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setShowForgot(false)
                setResetFeedback(null)
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 touch-manipulation pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to PIN Pad</span>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
