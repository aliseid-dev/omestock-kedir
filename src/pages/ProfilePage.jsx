import React, { useState } from 'react'
import {
  User,
  Mail,
  ShieldCheck,
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
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Lock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

export function ProfilePage() {
  const { toast } = useToast()
  const {
    clerkUser,
    firebaseUser,
    updateUserProfile,
    sendResetPassword,
    signOutUser,
    getAvatar
  } = useAuth()

  const {
    activeOrg,
    currentUser,
    isOwner,
    stores,
    clearActiveOrganization,
    clearDatabaseData,
    wipeAndResetAccount,
    deleteAccount
  } = useTenant()

  // Display Name editing
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || currentUser?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')

  // Danger Zone States
  const [clearingData, setClearingData] = useState(false)
  const [wipingAccount, setWipingAccount] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)

  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all inventory products, warehouse stock, retail stock, and sales records? Your organization and account will remain, but all data will be cleared so you can start fresh.'
    )
    if (!confirmed) return

    setClearingData(true)
    try {
      await clearDatabaseData()
      toast.success('Database Cleared', 'All products, stock counts, and sales records cleared.')
    } catch (err) {
      console.error(err)
      toast.error('Clear Failed', 'Failed to clear data: ' + (err?.message || 'Unknown error'))
    } finally {
      setClearingData(false)
    }
  }

  const handleWipeAndReset = async () => {
    const confirmed = window.confirm(
      'DANGER: This will completely wipe your business workspace, products, stores, and sales data, returning you to the clean setup screen to start fresh. Proceed?'
    )
    if (!confirmed) return

    setWipingAccount(true)
    try {
      await wipeAndResetAccount()
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error('Reset Failed', 'Failed to reset workspace: ' + (err?.message || 'Unknown error'))
    } finally {
      setWipingAccount(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'DANGER: Are you sure you want to permanently delete your account? This will remove your profile from the database and delete your Clerk login. This action CANNOT be undone!'
    )
    if (!confirmed) return

    setDeletingUser(true)
    try {
      if (clerkUser?.id) {
        await deleteAccount(clerkUser.id)
      }
      if (clerkUser?.delete) {
        await clerkUser.delete()
      } else {
        await signOutUser()
      }
    } catch (err) {
      console.error(err)
      toast.error('Deletion Failed', 'Failed to delete account: ' + (err?.message || 'Unknown error'))
    } finally {
      setDeletingUser(false)
    }
  }

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
    toast.info('Code Copied', 'Organization invitation code copied to clipboard.')
    setTimeout(() => setCopiedOrgCode(false), 2000)
  }

  const handleUpdateName = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess('')
    if (!displayName.trim()) {
      setNameError('Name cannot be blank.')
      toast.warning('Name Required', 'Name cannot be blank.')
      return
    }

    setSavingName(true)
    try {
      await updateUserProfile(displayName)
      setNameSuccess('Profile name updated successfully!')
      toast.success('Profile Updated', 'Profile name updated successfully!')
      setTimeout(() => setNameSuccess(''), 3000)
    } catch (err) {
      setNameError(err?.message || 'Failed to update profile name.')
      toast.error('Update Failed', err?.message || 'Failed to update profile name.')
    } finally {
      setSavingName(false)
    }
  }


  const handleSendResetEmail = async () => {
    if (!firebaseUser?.email) return
    setResetError('')
    setSendingReset(true)
    try {
      await sendResetPassword(firebaseUser.email)
      setResetSent(true)
      toast.success('Reset Email Sent', `Password reset link sent to ${firebaseUser.email}.`)
    } catch (err) {
      setResetError(err?.message || 'Failed to send password reset email.')
      toast.error('Email Failed', err?.message || 'Failed to send password reset email.')
    } finally {
      setSendingReset(false)
    }
  }

  const handleCopyUid = () => {
    if (!firebaseUser?.uid) return
    navigator.clipboard.writeText(firebaseUser.uid)
    setCopiedUid(true)
    toast.info('UID Copied', 'Account User ID copied to clipboard.')
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

      {/* Danger Zone: Clear Database & Delete Account */}
      <Card className="rounded-3xl border border-rose-200 bg-rose-50/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-rose-100">
          <CardTitle className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Danger Zone & Data Reset
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-slate-600">
            Need to start fresh or remove your data? Use the actions below with care.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Clear Inventory & Sales */}
            <div className="p-4 rounded-2xl bg-white border border-amber-200 flex flex-col justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900">Clear Inventory & Sales</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Deletes all products and sales, resetting stock counts to 0. Keeps your company code and account.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={clearingData}
                onClick={handleClearDatabase}
                className="w-full font-bold text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
              >
                {clearingData ? 'Clearing Data...' : 'Clear All Data'}
              </Button>
            </div>

            {/* 2. Wipe Workspace & Start Fresh */}
            <div className="p-4 rounded-2xl bg-white border border-rose-200 flex flex-col justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-rose-950">Wipe & Start Fresh</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Wipes this workspace, branches, and records. Brings you back to clean company onboarding setup.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={wipingAccount}
                onClick={handleWipeAndReset}
                className="w-full font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {wipingAccount ? 'Wiping Workspace...' : 'Wipe & Start Fresh'}
              </Button>
            </div>

            {/* 3. Delete Account */}
            <div className="p-4 rounded-2xl bg-white border border-slate-300 flex flex-col justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900">Delete Account</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permanently deletes your account from the database and Clerk authentication.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={deletingUser}
                onClick={handleDeleteAccount}
                className="w-full font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>{deletingUser ? 'Deleting Account...' : 'Delete Account'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <div className="bg-slate-100 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Session & Device
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Securely sign out of your OMESTOCK account on this device.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={signOutUser}
            className="w-full sm:w-auto font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

    </div>
  )
}
