import React, { useState } from 'react'
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
  KeyRound
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { Badge } from '../ui/Badge'

export function MainLayout() {
  const { currentUser, users, switchUser, permissions, isOwner, lockSession, signOutUser, firebaseUser } = useAuth()
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
    updateBusinessName
  } = useTenant()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTenantMenu, setShowTenantMenu] = useState(false)
  const [showMobileMoreSheet, setShowMobileMoreSheet] = useState(false)
  const [showBizSettings, setShowBizSettings] = useState(false)
  const [bizNameEdit, setBizNameEdit] = useState('')
  const [savingBizName, setSavingBizName] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const location = useLocation()

  const handleCopyCode = () => {
    const code = activeOrg?.companyCode
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
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
    setSavingBizName(true)
    await updateBusinessName(bizNameEdit.trim())
    setSavingBizName(false)
    setShowBizSettings(false)
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
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:bg-emerald-600 transition-colors">
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </span>
                <Badge variant={isOwner ? 'purple' : 'info'} className="text-[9px] px-1.5 py-0">
                  {isOwner ? 'Owner' : 'Staff'}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.email}
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
          <div className="px-4 h-14 flex items-center justify-between">
            <Link to={isOwner ? '/' : '/pos'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                L
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none">
                  OMESTOCK
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px] mt-0.5">
                  {tenantName}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTenantMenu(!showTenantMenu)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
              >
                <Building2 className="w-3 h-3 text-slate-600" />
                <span className="truncate max-w-[90px]">{tenantName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200"
              >
                {currentUser.avatar}
              </button>
            </div>
          </div>

          {/* Mobile User Dropdown */}
          {showUserMenu && (
            <div className="px-4 py-3 bg-white border-b border-slate-200 animate-in fade-in space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                </div>
                <Badge variant={isOwner ? 'purple' : 'info'} className="text-[10px]">
                  {isOwner ? 'Owner' : 'Staff'}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex-1 text-center py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl border border-slate-200"
                >
                  My Profile
                </Link>

                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOutUser()
                  }}
                  className="flex-1 text-center py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 rounded-xl border border-rose-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
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

            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 text-xs font-bold text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-[10px]">
                {currentUser.avatar}
              </div>
              <span>{currentUser.name}</span>
            </Link>
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
            `flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>Stock</span>
        </NavLink>

        {/* 3. Staff Control */}
        {isOwner && (
          <NavLink
            to="/staff"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
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
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl text-[10px] font-bold transition-all touch-manipulation active:scale-95 ${
            showMobileMoreSheet ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* ─── Mobile More Sheet ─── */}
      {showMobileMoreSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-200">
            
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full sm:max-w-lg max-w-md p-6 animate-in zoom-in-95 duration-150">
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
                Share this 6-digit organization code with your sales team. New sales staff must enter this code when registering so they can bind their account to your organization for your approval.
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
          </div>
        </div>
      )}


    </div>
  )
}
