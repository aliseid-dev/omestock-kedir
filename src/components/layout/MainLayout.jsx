import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ClockAlert,
  Users,
  ShieldCheck,
  Building2,
  ChevronDown,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Loader2,
  Settings,
  User,
  Copy,
  Check,
  KeyRound,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../ui/Badge'

export function MainLayout() {
  const { toast } = useToast()
  const { currentUser, clerkUser, users, switchUser, permissions, isOwner, lockSession, signOutUser, firebaseUser } = useAuth()
  const {
    clientId,
    tenantName,
    activeOrg,
    organizations,
    selectOrganization,
    clearActiveOrganization,
    isFirebaseLive,
    sales,
    loading,
    updateBusinessName,
    clearDatabaseData,
    wipeAndResetAccount,
    deleteAccount
  } = useTenant()

  const userInitial = useMemo(() => {
    const rawName = currentUser?.name || clerkUser?.fullName || clerkUser?.firstName || currentUser?.email || 'U'
    return rawName.trim().charAt(0).toUpperCase() || 'U'
  }, [currentUser?.name, currentUser?.email, clerkUser?.fullName, clerkUser?.firstName])

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTenantMenu, setShowTenantMenu] = useState(false)
  const [showMobileMoreSheet, setShowMobileMoreSheet] = useState(false)
  const [showBizSettings, setShowBizSettings] = useState(false)

  const userMenuRef = useRef(null)
  const desktopUserMenuRef = useRef(null)

  // Close menus when clicking outside
  useEffect(() => {
    if (!showUserMenu) return
    const handleOutside = (e) => {
      const clickedMobileMenu = userMenuRef.current && userMenuRef.current.contains(e.target)
      const clickedDesktopMenu = desktopUserMenuRef.current && desktopUserMenuRef.current.contains(e.target)
      if (!clickedMobileMenu && !clickedDesktopMenu) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showUserMenu])
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
      setShowBizSettings(false)
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
      setShowBizSettings(false)
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
  const [bizNameEdit, setBizNameEdit] = useState('')
  const [savingBizName, setSavingBizName] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const location = useLocation()

  const handleCopyCode = () => {
    const code = activeOrg?.companyCode
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.info('Code Copied', 'Company invitation code copied to clipboard.')
    setTimeout(() => setCopiedCode(false), 2000)
  }


  // Show full-screen loader while Firestore data is syncing on first load
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
          O
        </div>
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Connecting to OMESTOCK…</p>
      </div>
    )
  }

  // Unpaid credit sales count
  const unpaidCount = sales.filter(s => s.paymentMethod === 'Credit' && s.paymentStatus === 'Unpaid').length

  const handleSaveBizName = async (e) => {
    e.preventDefault()
    if (!bizNameEdit.trim()) return
    const newName = bizNameEdit.trim()
    setSavingBizName(true)
    await updateBusinessName(newName)
    setSavingBizName(false)
    setShowBizSettings(false)
    toast.success('Workspace Renamed', `Organization renamed to "${newName}".`)
  }

  // Base navigation items - Core operational focus: POS, Stock, Unpaid Sales, Staff & Audit Trail
  const navItems = [
    {
      to: '/pos',
      label: 'POS',
      icon: ShoppingCart,
      ownerOnly: false,
    },
    {
      to: '/inventory',
      label: 'Stock',
      icon: Boxes,
      ownerOnly: false,
    },
    {
      to: '/unpaid-sales',
      label: 'Unpaid',
      icon: ClockAlert,
      ownerOnly: false,
      badge: unpaidCount > 0 ? unpaidCount : null,
    },
    {
      to: '/staff',
      label: 'Staff',
      icon: Users,
      ownerOnly: true,
    },
    {
      to: '/audit-trail',
      label: 'Audit',
      icon: ShieldCheck,
      ownerOnly: true,
    },
    {
      to: '/dashboard',
      label: 'Reports',
      icon: LayoutDashboard,
      ownerOnly: true,
      badge: 'Soon',
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      ownerOnly: false,
      badge: 'Soon',
    },
  ]

  const visibleNavItems = navItems.filter(item => !item.ownerOnly || permissions.isOwner)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col lg:flex-row">
      

      {/* ─── Desktop Left Navigation Sidebar (Visible on lg+ screens) ─── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-slate-200">
        
        {/* Brand & Active Organization Header */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <Link to="/pos" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:bg-slate-800 transition-colors">
              O
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                OMESTOCK
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                POS & Management
              </p>
            </div>
          </Link>

          {/* Active Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-200">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {tenantName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {activeOrg?.currency || 'ETB'} &bull; Switch Org
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </button>

            {/* Organizations Dropdown */}
            {showTenantMenu && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Organizations ({organizations.length})
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectOrganization(org)
                        setShowTenantMenu(false)
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className={org.id === clientId ? 'font-bold text-emerald-700 truncate' : 'text-slate-700 truncate'}>
                        {org.name || org.businessName}
                      </span>
                      {org.id === clientId && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="mt-1 pt-1 border-t border-slate-100 px-2 space-y-0.5">
                  {isOwner && (
                    <button
                      onClick={() => {
                        setBizNameEdit(tenantName)
                        setShowBizSettings(true)
                        setShowTenantMenu(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Enterprise Settings</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowTenantMenu(false)
                      clearActiveOrganization()
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All Organizations Hub</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar User Profile Card & Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name || 'User'}
                </span>
                <Badge variant={isOwner ? 'purple' : 'info'} className="text-[9px] px-1.5 py-0">
                  {isOwner ? 'Owner' : 'Staff'}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || ''}
              </p>
            </div>
          </Link>

          <div className="pt-1 border-t border-slate-200/60">
            <button
              onClick={signOutUser}
              title="Sign Out"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ─── Main Content Container (Padded left for sidebar on desktop) ─── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        
        {/* Mobile Top Header (Visible on mobile only) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="px-3.5 h-14 flex items-center justify-between gap-2.5">
            <Link to={isOwner ? '/' : '/pos'} className="flex items-center gap-2.5 min-w-0 flex-1 group" title="OMESTOCK">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 group-active:scale-95 transition-transform">
                O
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  OMESTOCK
                </span>
                <span className="text-[11px] text-emerald-700 font-bold truncate mt-0.5 leading-tight">
                  {tenantName}
                </span>
              </div>
            </Link>

            {/* Logged in User Profile Avatar: Circle with initial */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-black hover:bg-slate-800 active:scale-95 text-white font-black text-xs flex items-center justify-center shadow-xs border border-slate-200 shrink-0 cursor-pointer transition-transform"
                title={currentUser?.name || 'Account menu'}
                aria-label="Account menu"
              >
                {userInitial}
              </button>

              {/* Mobile Little Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[0.5px] cursor-pointer"
                    onClick={() => setShowUserMenu(false)}
                    onTouchStart={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100 text-slate-800">
                    {/* User Info Header */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/80 rounded-xl mb-1.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-slate-900 text-sm truncate">
                          {currentUser?.name || 'User'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mb-1">
                          {currentUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || ''}
                        </div>
                        <Badge variant={isOwner ? 'purple' : 'info'} className="text-[10px] px-2 py-0.5 font-bold">
                          {isOwner ? '👑 Organization Owner' : '👤 Salesperson'}
                        </Badge>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile & Personal Info</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowBizSettings(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Workspace Settings</span>
                      </button>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false)
                          signOutUser()
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Desktop Header Bar (Clean, spacious status bar) */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold text-slate-900">{tenantName}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium">
              {navItems.find(n => n.to === location.pathname)?.label || 'Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Synced
            </span>

            <div className="relative" ref={desktopUserMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-black hover:bg-slate-800 active:scale-95 text-white font-black text-xs flex items-center justify-center shadow-xs border border-slate-200 shrink-0 cursor-pointer transition-transform"
                title={currentUser?.name || 'Account menu'}
                aria-label="Account menu"
              >
                {userInitial}
              </button>

              {/* Desktop Little Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-pointer"
                    onClick={() => setShowUserMenu(false)}
                    onTouchStart={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100 text-slate-800">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/80 rounded-xl mb-1.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-slate-900 text-sm truncate">
                          {currentUser?.name || 'User'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mb-1">
                          {currentUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || ''}
                        </div>
                        <Badge variant={isOwner ? 'purple' : 'info'} className="text-[10px] px-2 py-0.5 font-bold">
                          {isOwner ? '👑 Organization Owner' : '👤 Salesperson'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile & Personal Info</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowBizSettings(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Workspace Settings</span>
                      </button>
                    </div>

                    <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false)
                          signOutUser()
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-8">
          <Outlet />
        </main>

        {/* Desktop Footer */}
        <footer className="hidden lg:block mt-auto border-t border-slate-200 bg-white py-5">
          <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">OMESTOCK</span>
              <span>&bull;</span>
              <span>Multi-Store POS & Inventory Management</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span>Powered by</span>
              <span className="text-slate-900 font-bold">Omedla Tech Solutions</span>
            </div>
          </div>
        </footer>

      </div>

      {/* ─── Mobile Bottom Navigation Bar (Hidden on lg+ screens) ─── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
        
        {/* 1. POS */}
        <NavLink
          to="/pos"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>POS</span>
        </NavLink>

        {/* 2. Inventory */}
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 sm:w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>Stock</span>
        </NavLink>

        {/* 3. Unpaid Sales */}
        <NavLink
          to="/unpaid-sales"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-14 sm:w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <div className="relative">
            <ClockAlert className="w-5 h-5 mb-0.5" />
            {unpaidCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] text-[8px] font-black text-white bg-amber-500 rounded-full flex items-center justify-center leading-none">
                {unpaidCount}
              </span>
            )}
          </div>
          <span>Unpaid</span>
        </NavLink>

        {/* 4. Staff Control */}
        {isOwner && (
          <NavLink
            to="/staff"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 sm:w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
                isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Staff</span>
          </NavLink>
        )}

        {/* 5. More Actions */}
        <button
          onClick={() => setShowMobileMoreSheet(true)}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
            showMobileMoreSheet ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* ─── Mobile More Sheet ─── */}
      {showMobileMoreSheet && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMobileMoreSheet(false)
            }
          }}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                  L
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">OMESTOCK Menu</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{tenantName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMoreSheet(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2">
              
              {/* Profile Link in Mobile More */}
              <Link
                to="/profile"
                onClick={() => setShowMobileMoreSheet(false)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation font-bold text-xs text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div>My Profile & Account</div>
                  <div className="text-[10px] text-slate-500 font-normal">Manage display name, password & PIN</div>
                </div>
              </Link>

              {/* Unpaid Sales Link in Mobile More */}
              <Link
                to="/unpaid-sales"
                onClick={() => setShowMobileMoreSheet(false)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation font-bold text-xs text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ClockAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>Unpaid Sales Follow-Up</span>
                    {unpaidCount > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                        {unpaidCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">Customer debt records & credit collections</div>
                </div>
              </Link>

              {isOwner && (
                <>
                  <Link
                    to="/staff"
                    onClick={() => setShowMobileMoreSheet(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation font-bold text-xs text-slate-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div>Staff & Commission Control</div>
                      <div className="text-[10px] text-slate-500 font-normal">Manage store assignments & passcodes</div>
                    </div>
                  </Link>

                  <Link
                    to="/audit-trail"
                    onClick={() => setShowMobileMoreSheet(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation font-bold text-xs text-slate-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div>System Audit Trail</div>
                      <div className="text-[10px] text-slate-500 font-normal">Owner activity & security log</div>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      setBizNameEdit(tenantName)
                      setShowBizSettings(true)
                      setShowMobileMoreSheet(false)
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors touch-manipulation font-bold text-xs text-slate-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div>Enterprise Settings</div>
                      <div className="text-[10px] text-slate-500 font-normal">Change business / enterprise name</div>
                    </div>
                  </button>
                </>
              )}

              {/* Mobile Organization Switcher */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Switch Organization</p>
                <div className="space-y-1">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectOrganization(org)
                        setShowMobileMoreSheet(false)
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold touch-manipulation transition-colors ${
                        org.id === clientId ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{org.name || org.businessName}</span>
                      {org.id === clientId && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowMobileMoreSheet(false)
                      clearActiveOrganization()
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation border border-slate-200 mt-2"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>All Organizations Hub</span>
                  </button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="mt-2">
                <button
                  onClick={() => {
                    setShowMobileMoreSheet(false)
                    signOutUser()
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors touch-manipulation font-bold text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="pt-4 text-center text-xs text-slate-400 border-t border-slate-100">
                <p>OMESTOCK Mobile v0.2</p>
                <p className="font-bold text-slate-600 mt-0.5">Powered by Omedla Tech Solutions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Settings Modal */}
      {showBizSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBizSettings(false)
            }
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full sm:max-w-lg max-w-md p-6 animate-in zoom-in-95 duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Enterprise Settings
              </h3>
              <button
                onClick={() => setShowBizSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 6-Digit Organization / Company Code Section */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  Staff Registration Code
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Unique 6-Digit Code
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-2xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Organization Code</p>
                  <p className="text-2xl font-mono font-black tracking-widest text-slate-900">
                    {activeOrg?.companyCode || '------'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  title="Copy 6-digit company code"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                Organization code
              </p>
            </div>

            <form onSubmit={handleSaveBizName} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enterprise / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={bizNameEdit}
                  onChange={(e) => setBizNameEdit(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="e.g. Omedla Retail Group"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This name appears in the top header, reports, and invoices.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBizSettings(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBizName || !bizNameEdit.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                >
                  {savingBizName ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Danger Zone: Reset Data & Delete Account */}
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Danger Zone & Reset Tools</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Clear test data to start fresh, reset your workspace, or permanently delete your user account.
              </p>

              <div className="space-y-2 pt-1">
                {/* 1. Clear Inventory & Sales */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-amber-950">Clear Inventory & Sales</h5>
                    <p className="text-[11px] text-amber-800">
                      Deletes all products, transactions, and resets stock to 0. Keeps your company code.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={clearingData}
                    onClick={handleClearDatabase}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
                  >
                    {clearingData ? 'Clearing...' : 'Clear All Data'}
                  </button>
                </div>

                {/* 2. Reset Workspace to Onboarding */}
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-rose-950">Wipe Workspace & Start Fresh</h5>
                    <p className="text-[11px] text-rose-800">
                      Completely wipes company workspace, stores, and data. Returns you to initial setup.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={wipingAccount}
                    onClick={handleWipeAndReset}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
                  >
                    {wipingAccount ? 'Resetting...' : 'Wipe & Start Fresh'}
                  </button>
                </div>

                {/* 3. Delete Account */}
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Delete Account</h5>
                    <p className="text-[11px] text-slate-600">
                      Permanently delete your profile and Clerk user credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={deletingUser}
                    onClick={handleDeleteAccount}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingUser ? 'Deleting...' : 'Delete Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
