import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Building2, UserCheck, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Loader2, LogOut } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function RoleOnboardingPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const createOwner = useMutation(api.users.createOwner)
  const registerSalesperson = useMutation(api.users.registerSalesperson)

  const [selectedRole, setSelectedRole] = useState(null) // 'owner' | 'salesperson'
  const [businessName, setBusinessName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOwnerSubmit = async (e) => {
    e.preventDefault()
    if (!businessName.trim()) {
      setError('Please enter your business or company name.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await createOwner({
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress || '',
        name: user?.fullName || user?.firstName || 'Owner',
        businessName: businessName.trim(),
      })
      navigate('/pos', { replace: true })
    } catch (err) {
      console.error('Failed to create owner account:', err)
      setError(err?.message || 'Failed to complete owner setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSalespersonSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = companyCode.trim().toUpperCase()
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-character company code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await registerSalesperson({
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress || '',
        name: user?.fullName || user?.firstName || 'Salesperson',
        companyCode: cleanCode,
      })
      navigate('/awaiting-approval', { replace: true })
    } catch (err) {
      console.error('Failed to register salesperson:', err)
      setError(err?.message || 'Invalid company code or unable to link account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 py-8 text-slate-800">
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-600/30 mb-3 border border-blue-400/20">
          O
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">OMESTOCK</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Smart Sales Recording & Real-time Stock Management
        </p>
      </div>

      <Card className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl p-6 sm:p-8 animate-in fade-in duration-200">
        <div className="text-center mb-6">
          <Badge variant="blue" className="px-3 py-1 font-semibold text-xs uppercase tracking-wider mb-2">
            Welcome, {user?.firstName || 'User'}
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            How will you use OMESTOCK?
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose your role to configure your workspace and permissions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Owner Card */}
          <button
            type="button"
            onClick={() => {
              setSelectedRole('owner')
              setError('')
            }}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              selectedRole === 'owner'
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Business Owner</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create an organization, manage warehouses, assign staff, and track stock & sales.
            </p>
          </button>

          {/* Salesperson Card */}
          <button
            type="button"
            onClick={() => {
              setSelectedRole('salesperson')
              setError('')
            }}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              selectedRole === 'salesperson'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Salesperson</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Join an existing business using a 6-digit company invite code to access the POS terminal.
            </p>
          </button>
        </div>

        {/* Specific Form based on role */}
        {selectedRole === 'owner' && (
          <form onSubmit={handleOwnerSubmit} className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Business / Enterprise Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Mekelle Electronics Trading"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                We'll automatically initialize your default central warehouse, retail store, and unique 6-digit invite code.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !businessName.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting up your enterprise...</span>
                </>
              ) : (
                <>
                  <span>Launch Business Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {selectedRole === 'salesperson' && (
          <form onSubmit={handleSalespersonSubmit} className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                6-Digit Company Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="e.g. A7X9M2"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-center tracking-widest font-mono font-bold text-xl uppercase"
              />
              <p className="text-xs text-slate-400 mt-1.5 text-center">
                Ask your business owner or manager for your store's 6-character code.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || companyCode.trim().length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to company...</span>
                </>
              ) : (
                <>
                  <span>Join Team & Request Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Signed in as {user?.primaryEmailAddress?.emailAddress}</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </Card>
    </div>
  )
}
export default RoleOnboardingPage
