import React, { useState } from 'react'
import {
  Clock,
  ShieldAlert,
  Building2,
  User,
  Mail,
  KeyRound,
  RefreshCw,
  LogOut,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function AwaitingApprovalPage({ orgInfo }) {
  const { firebaseUser, signOutUser, getAvatar } = useAuth()
  const { refreshApprovalStatus, activeOrg } = useTenant()
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')

  const handleManualCheck = async () => {
    setChecking(true)
    setCheckMessage('')
    try {
      if (refreshApprovalStatus) {
        await refreshApprovalStatus()
      }
      setCheckMessage('Status checked. Still awaiting approval from owner.')
      setTimeout(() => setCheckMessage(''), 4000)
    } catch (err) {
      console.error('Error refreshing approval status:', err)
      setCheckMessage('Unable to refresh status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const organizationName = orgInfo?.name || activeOrg?.name || activeOrg?.businessName || 'Your Organization'
  const companyCode = orgInfo?.companyCode || activeOrg?.companyCode || '------'
  const displayName = firebaseUser?.displayName || 'Salesperson'
  const userEmail = firebaseUser?.email || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-white">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-emerald-950/40 mb-3 border border-slate-100">
          L
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">OMESTOCK</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Retail POS & Multi-Store Inventory Management
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Status Icon & Beacon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
              <Clock className="w-8 h-8 animate-pulse text-amber-600" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
            </span>
          </div>

          <div className="space-y-1">
            <Badge variant="warning" className="px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Pending Owner Approval
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Account Awaiting Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your salesperson registration was successful! Access to the POS terminal, sales registers, and inventory is <span className="font-semibold text-slate-700">strictly locked</span> until your business owner grants approval.
            </p>
          </div>
        </div>

        {/* Lockout Notice Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Dashboard Access Strictly Restricted</p>
            <p className="text-amber-800/90 leading-normal">
              For security, new salesperson profiles must be authorized by an Owner or Administrator in the Staff Management control panel before operating any registers or viewing inventory data.
            </p>
          </div>
        </div>

        {/* Account Details Summary */}
        <div className="mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Registration Details
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </span>
            <span className="font-bold text-slate-900">{displayName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email
            </span>
            <span className="font-bold text-slate-900 truncate max-w-[220px]">{userEmail}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Organization
            </span>
            <span className="font-bold text-slate-900">{organizationName}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Company Code
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
              {companyCode}
            </span>
          </div>
        </div>

        {/* Manual Refresh Feedback */}
        {checkMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs text-center font-medium animate-in fade-in">
            {checkMessage}
          </div>
        )}

        {/* Live Auto-Refresh Notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>This screen updates automatically in real-time once approved.</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={checking}
            onClick={handleManualCheck}
            className="w-full font-bold shadow-md min-h-[46px] text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </Button>

          <button
            type="button"
            onClick={signOutUser}
            className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors touch-manipulation min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

    </div>
  )
}
