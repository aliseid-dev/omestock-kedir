import React, { useState } from 'react'
import {
  Building2,
  Plus,
  ArrowRight,
  LogOut,
  Sparkles,
  Store,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Users,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function OrganizationHubPage() {
  const { firebaseUser, signOutUser, getAvatar } = useAuth()
  const {
    organizations,
    orgsLoading,
    selectOrganization,
    createOrganization
  } = useTenant()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('ETB')
  const [initialStoreName, setInitialStoreName] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [error, setError] = useState('')

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please provide an enterprise or business name.')
      return
    }

    setCreating(true)
    try {
      await createOrganization({
        name,
        currency,
        initialStoreName: initialStoreName.trim() || 'Main Branch',
        storeLocation: storeLocation.trim(),
      })
    } catch (err) {
      setError(err?.message || 'Failed to create organization. Please try again.')
      setCreating(false)
    }
  }

  const userDisplayName = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              L
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">OMESTOCK</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-semibold">
                Organizations Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-bold text-slate-900">{userDisplayName}</p>
                <p className="text-[10px] text-slate-400">{firebaseUser?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200">
                {getAvatar(userDisplayName, firebaseUser?.email)}
              </div>
            </div>

            <button
              onClick={signOutUser}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors touch-manipulation"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Welcome back
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Select an Organization
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Choose an active enterprise to enter its POS, inventory, and analytics workspace.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setName('')
              setInitialStoreName('')
              setStoreLocation('')
              setError('')
              setShowCreateModal(true)
            }}
            className="flex items-center gap-1.5 font-bold shadow-md min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </Button>
        </div>

        {/* Organizations List / Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Organizations ({organizations.length})
            </h2>
          </div>

          {orgsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse space-y-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded-md" />
                  <div className="w-1/3 h-3 bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
          ) : organizations.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No organizations found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Create your first enterprise organization to initialize your multi-store POS and central warehouse.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                className="font-bold shadow-md min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Create Your First Organization</span>
              </Button>
            </div>
          ) : (
            /* Organizations Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => {
                const isOwner = org.ownerUid === firebaseUser?.uid
                return (
                  <div
                    key={org.id}
                    onClick={() => selectOrganization(org)}
                    className="group bg-white hover:bg-slate-50/80 p-5 rounded-3xl border border-slate-200 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 transition-colors shadow-xs">
                          {org.name?.slice(0, 1) || 'O'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {org.companyCode && (
                            <Badge variant="outline" className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                              Code: {org.companyCode}
                            </Badge>
                          )}
                          <Badge variant={isOwner ? 'purple' : 'info'} className="text-[10px]">
                            {isOwner ? 'Owner' : 'Member'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {org.currency || 'ETB'}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {org.name || org.businessName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>


                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-emerald-700">
                      <span>Launch Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-xl max-w-md p-6 sm:p-7 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Create New Organization
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enterprise / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                  placeholder="e.g. Omedla Electronics Hub"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold min-h-[44px]"
                >
                  <option value="ETB">ETB — Ethiopian Birr</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Setup</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Store Name</label>
                  <input
                    type="text"
                    value={initialStoreName}
                    onChange={(e) => setInitialStoreName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                    placeholder="e.g. Flagship Store (Downtown)"
                  />
                </div>

                <div className="mt-2.5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Address / Location</label>
                  <input
                    type="text"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                    placeholder="e.g. Bole Road, Addis Ababa"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 text-[11px] text-slate-500 border border-slate-100">
                A <span className="font-bold text-slate-700">Central Distribution Warehouse</span> will be provisioned automatically for inventory routing.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setShowCreateModal(false)}
                  className="font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={creating || !name.trim()}
                  className="font-bold min-h-[44px] px-5"
                >
                  {creating ? 'Provisioning...' : 'Create & Launch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
