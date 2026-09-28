import React, { useState } from 'react'
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Building2,
  Key,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  ArrowRight,
  Store,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

export function ProfilePage() {
  const {
    firebaseUser,
    updateUserProfile,
    sendResetPassword,
    signOutUser,
    getAvatar,
    lockSession
  } = useAuth()

  const {
    activeOrg,
    currentUser,
    isOwner,
    stores,
    updateUserPasscode,
    clearActiveOrganization
  } = useTenant()

  // Display Name editing
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || currentUser?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')

  // PIN editing
  const [pin, setPin] = useState(currentUser?.passcode || '0000')
  const [savingPin, setSavingPin] = useState(false)
  const [pinSuccess, setPinSuccess] = useState('')
  const [pinError, setPinError] = useState('')

  // Password Reset Email
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  // Copy UID feedback
  const [copiedUid, setCopiedUid] = useState(false)
  const [copiedOrgCode, setCopiedOrgCode] = useState(false)

  const handleCopyOrgCode = () => {
    if (!activeOrg?.companyCode) return
    navigator.clipboard.writeText(activeOrg.companyCode)
    setCopiedOrgCode(true)
    setTimeout(() => setCopiedOrgCode(false), 2000)
  }

  const handleUpdateName = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')
    if (!displayName.trim()) {
      setNameError('Name cannot be blank.')
      return
    }

    setSavingName(true)
    try {
      await updateUserProfile(displayName)
      setNameSuccess('Profile name updated successfully!')
      setTimeout(() => setNameSuccess(''), 3000)
    } catch (err) {
      setNameError(err?.message || 'Failed to update profile name.')
    } finally {
      setSavingName(false)
    }
  }

  const handleUpdatePin = async (e) => {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')
    if (!/^\d{4}$/.test(pin)) {
      setPinError('PIN must be exactly 4 numeric digits.')
      return
    }

    setSavingPin(true)
    try {
      if (updateUserPasscode) {
        await updateUserPasscode(pin)
      }
      setPinSuccess('POS Unlock PIN updated successfully!')
      setTimeout(() => setPinSuccess(''), 3000)
    } catch (err) {
      setPinError(err?.message || 'Failed to update PIN.')
    } finally {
      setSavingPin(false)
    }
  }

  const handleSendResetEmail = async () => {
    if (!firebaseUser?.email) return
    setResetError('')
    setSendingReset(true)
    try {
      await sendResetPassword(firebaseUser.email)
      setResetSent(true)
    } catch (err) {
      setResetError(err?.message || 'Failed to send password reset email.')
    } finally {
      setSendingReset(false)
    }
  }

  const handleCopyUid = () => {
    if (!firebaseUser?.uid) return
    navigator.clipboard.writeText(firebaseUser.uid)
    setCopiedUid(true)
    setTimeout(() => setCopiedUid(false), 2000)
  }

  const assignedStore = stores?.find(s => s.id === currentUser?.storeId)

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          User Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal identity, login security, and organization roles.
        </p>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md border-2 border-emerald-500 shrink-0">
          {getAvatar(displayName || firebaseUser?.displayName, firebaseUser?.email)}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {displayName || 'User'}
            </h2>
            <Badge variant={isOwner ? 'purple' : 'info'} className="text-xs px-2.5 py-0.5 font-bold">
              {isOwner ? 'Business Owner / Admin' : 'Salesperson'}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {firebaseUser?.email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-600">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">{activeOrg?.name || activeOrg?.businessName || 'Organization'}</span>
            </div>

            {assignedStore && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">{assignedStore.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Details */}
        <Card className="rounded-3xl border border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            
            {nameSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{nameSuccess}</span>
              </div>
            )}

            {nameError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Firebase Account)
                </label>
                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <span className="truncate">{firebaseUser?.email}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  User ID (UID)
                </label>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-500">
                  <span className="truncate max-w-[200px]">{firebaseUser?.uid}</span>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    title="Copy UID"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={savingName || !displayName.trim()}
                  className="w-full font-bold"
                >
                  {savingName ? 'Saving...' : 'Save Name Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security & Authentication */}
        <Card className="rounded-3xl border border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Security & Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            
            {/* Password Reset Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Key className="w-4 h-4 text-slate-700" />
                <span>Account Password</span>
              </div>
              <p className="text-xs text-slate-500">
                Need to change or reset your password? Receive a secure Firebase verification link to your email.
              </p>

              {resetSent && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Password reset email dispatched to {firebaseUser?.email}. Check your inbox!</span>
                </div>
              )}

              {resetError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sendingReset}
                onClick={handleSendResetEmail}
                className="w-full font-bold text-xs"
              >
                {sendingReset ? 'Sending Verification...' : 'Send Password Reset Email'}
              </Button>
            </div>

            {/* POS 4-Digit Unlock PIN */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>POS 4-Digit Security PIN</span>
              </div>
              <p className="text-xs text-slate-500">
                Used to quickly unlock the POS terminal or switch cashier accounts without full sign-out.
              </p>

              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className="w-28 text-center text-sm font-mono font-bold tracking-widest px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0000"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={savingPin || pin.length !== 4}
                  className="flex-1 font-bold text-xs"
                >
                  {savingPin ? 'Updating...' : 'Update PIN'}
                </Button>
              </form>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Organization Scope Card */}
      <Card className="rounded-3xl border border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Active Organization Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {activeOrg?.name || activeOrg?.businessName}
              </h3>
              <Badge variant="outline" className="text-xs font-mono">
                {activeOrg?.currency || 'ETB'}
              </Badge>
            </div>
            
            {/* 6-Digit Company Code Row */}
            <div className="inline-flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="font-semibold text-slate-500">Staff Sign-Up Code:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                {activeOrg?.companyCode || '------'}
              </span>
              <button
                type="button"
                onClick={handleCopyOrgCode}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                title="Copy company code"
              >
                {copiedOrgCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              Workspace ID: <span className="font-mono text-slate-600">{activeOrg?.id}</span> &bull; Role: <span className="font-semibold text-slate-700 capitalize">{currentUser?.role || 'Staff'}</span>
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={clearActiveOrganization}
            className="flex items-center gap-2 font-bold shrink-0 self-start md:self-auto"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>Switch Organization</span>
          </Button>
        </CardContent>
      </Card>


      {/* Session Management */}
      <div className="bg-slate-100 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Session & Device
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Lock terminal with PIN or securely sign out of your OMESTOCK account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={lockSession}
            className="flex-1 sm:flex-initial font-bold text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100"
          >
            <Lock className="w-4 h-4 mr-1.5" />
            <span>Lock Session</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={signOutUser}
            className="flex-1 sm:flex-initial font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

    </div>
  )
}
