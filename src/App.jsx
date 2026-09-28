import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider, useTenant } from './context/TenantContext'
import { AuthPage } from './pages/AuthPage'
import { OrganizationHubPage } from './pages/OrganizationHubPage'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { PosPage } from './pages/PosPage'
import { InventoryPage } from './pages/InventoryPage'
import { UnpaidSalesPage } from './pages/UnpaidSalesPage'
import { StaffPage } from './pages/StaffPage'
import { AuditTrailPage } from './pages/AuditTrailPage'
import { ProfilePage } from './pages/ProfilePage'
import { AwaitingApprovalPage } from './pages/AwaitingApprovalPage'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { firebaseUser, authLoading } = useAuth()
  const { activeOrg, isStaffPending, pendingOrgInfo, checkingApproval } = useTenant()

  // 1. Initial Firebase Auth loading screen
  if (authLoading || (firebaseUser && checkingApproval)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-bold text-xl shadow-lg">
          L
        </div>
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Checking authorization & workspace…</p>
      </div>
    )
  }

  // 2. Not logged in -> Show Sign In / Sign Up Page
  if (!firebaseUser) {
    return <AuthPage />
  }

  // 3. STRICT LOCKOUT: If salesperson is pending owner approval, route to dedicated waiting screen
  if (isStaffPending) {
    return <AwaitingApprovalPage orgInfo={pendingOrgInfo} />
  }

  // 4. User logged in, but no active organization selected -> Show Organizations Hub
  if (!activeOrg) {
    return <OrganizationHubPage />
  }


  // 4. Logged in and active organization selected -> Show workspace routes inside MainLayout
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="unpaid-sales" element={<UnpaidSalesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
