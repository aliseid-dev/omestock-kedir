import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider, useTenant } from './context/TenantContext'
import { AuthPage } from './pages/AuthPage'
import { RoleOnboardingPage } from './pages/RoleOnboardingPage'
import { AwaitingApprovalPage } from './pages/AwaitingApprovalPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { MainLayout } from './components/layout/MainLayout'
import { PosPage } from './pages/PosPage'
import { InventoryPage } from './pages/InventoryPage'
import { StaffPage } from './pages/StaffPage'
import { UnpaidSalesPage } from './pages/UnpaidSalesPage'
import { AuditTrailPage } from './pages/AuditTrailPage'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { authLoading, isSignedIn, convexUser, isPending } = useAuth()
  const location = useLocation()

  // Handle OAuth Redirect Callback (Google, Apple, etc.)
  if (location.pathname.startsWith('/sso-callback')) {
    return <AuthenticateWithRedirectCallback />
  }

  // 1. Initial Authentication & Profile Sync Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
          O
        </div>
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Connecting to OMESTOCK workspace…</p>
      </div>
    )
  }

  // 2. Not logged in -> Show Sign In / Sign Up Page
  if (!isSignedIn) {
    return <AuthPage />
  }

  // 3. Logged in via Clerk, but no Convex User profile yet -> Role Selection Onboarding
  if (convexUser === null) {
    return <RoleOnboardingPage />
  }

  // 4. Salesperson registered but awaiting owner approval -> Dedicated Waiting Screen
  if (isPending) {
    return <AwaitingApprovalPage />
  }

  // 5. Approved Owner or Salesperson -> Core POS, Stock & Staff workspace
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Core operational routes */}
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="unpaid-sales" element={<UnpaidSalesPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />

        {/* Simplified Coming Soon screens for secondary modules */}
        <Route path="dashboard" element={<ComingSoonPage title="Executive Analytics Dashboard" />} />
        <Route path="profile" element={<ComingSoonPage title="User & Enterprise Profile" />} />
        <Route path="org-hub" element={<ComingSoonPage title="Multi-Branch Organization Hub" />} />

        {/* Catch-all redirect to POS */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <AppContent />
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
