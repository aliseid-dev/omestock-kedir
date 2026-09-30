import React, { createContext, useContext } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const AuthContext = createContext(null)

export const getAvatar = (name = '', email = '') => {
  if (name && name.trim()) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'OM'
}

export function AuthProvider({ children }) {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()
  const { signOut } = useClerk()

  // Query linked Convex user profile by Clerk user ID
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { userId: clerkUser.id } : 'skip'
  )

  // Loading indicator: waiting for Clerk or Convex query to resolve
  const authLoading = !clerkLoaded || (isSignedIn && convexUser === undefined)

  const isOwner = convexUser?.role === 'owner'
  const isSalesperson = convexUser?.role === 'salesperson'
  const isPending = isSalesperson && convexUser?.status === 'pending'
  const isApproved = convexUser?.status === 'approved' || isOwner

  const currentUser = convexUser
    ? {
        ...convexUser,
        id: convexUser._id,
        name: convexUser.name,
        role: convexUser.role,
        email: convexUser.email,
        passcode: '1234', // default POS passcode for fast testing
      }
    : clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: 'salesperson',
      }
    : null

  // Backwards compatibility for any legacy references to firebaseUser
  const firebaseUser = clerkUser
    ? {
        uid: clerkUser.id,
        id: clerkUser.id,
        displayName: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
      }
    : null

  const permissions = {
    isOwner,
    canManageStock: isOwner,
    canManageStaff: isOwner,
    canProcessSale: true,
  }

  const signOutUser = async () => {
    try {
      await signOut()
    } catch (e) {
      console.warn('Sign out error:', e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        clerkUser,
        convexUser,
        firebaseUser, // compatibility alias
        currentUser,
        authLoading,
        isSignedIn,
        isOwner,
        isSalesperson,
        isPending,
        isApproved,
        permissions,
        signOutUser,
        getAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const authCtx = useContext(AuthContext)
  if (!authCtx) throw new Error('useAuth must be used within an AuthProvider')
  return authCtx
}
