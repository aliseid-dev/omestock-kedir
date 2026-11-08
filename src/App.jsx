import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider, useTenant } from './context/TenantContext'
import { ToastProvider } from './context/ToastContext'
import { AuthPage } from './pages/AuthPage'
import { RoleOnboardingPage } from './pages/RoleOnboardingPage'
import { AwaitingApprovalPage } from './pages/AwaitingApprovalPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { MainLayout } from './components/layout/MainLayout'
import { PosPage } from './pages/PosPage'
import { InventoryPage } from './pages/InventoryPage'
import { HistoryPage } from './pages/HistoryPage'
import { StaffPage } from './pages/StaffPage'
import { UnpaidSalesPage } from './pages/UnpaidSalesPage'
import { AuditTrailPage } from './pages/AuditTrailPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { DashboardPage } from './pages/DashboardPage'
import { AppSkeleton } from './components/ui/AppSkeleton'

function AppContent() {
  const { authLoading, isSignedIn, convexUser, isPending } = useAuth()
  const location = useLocation()

  // Handle OAuth Redirect Callback (Google, Apple, etc.)
  if (location.pathname.startsWith('/sso-callback')) {
    return <AuthenticateWithRedirectCallback />
  }

  // 1. Initial Authentication & Profile Sync Skeleton Screen
  if (authLoading) {
    return <AppSkeleton />
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
        <Route path="history" element={<HistoryPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="unpaid-sales" element={<UnpaidSalesPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Secondary modules */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
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
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
