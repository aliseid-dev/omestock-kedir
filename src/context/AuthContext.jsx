import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider, appleProvider, isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext(null)

const getAvatar = (name = '', email = '') => {
  if (name && name.trim()) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'LG'
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Listen to Firebase Auth state change
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setAuthLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sign in with Email and Password
  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase Auth not configured')
    return await signInWithEmailAndPassword(auth, email.trim(), password)
  }

  // Sign up with Email and Password
  const signUpWithEmail = async (email, password, displayName) => {
    if (!auth) throw new Error('Firebase Auth not configured')
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName: displayName.trim() })
      setFirebaseUser({ ...cred.user, displayName: displayName.trim() })
    }
    return cred
  }

  // Sign in / Sign up with Google OAuth
  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Google provider not configured')
    return await signInWithPopup(auth, googleProvider)
  }

  // Sign in / Sign up with Apple OAuth
  const signInWithApple = async () => {
    if (!auth || !appleProvider) throw new Error('Apple provider not configured')
    return await signInWithPopup(auth, appleProvider)
  }

  // Send password reset email
  const sendResetPassword = async (email) => {
    if (!auth) throw new Error('Firebase Auth not configured')
    return await sendPasswordResetEmail(auth, email.trim())
  }

  // Update user profile display name
  const updateUserProfile = async (displayName) => {
    if (!auth?.currentUser) throw new Error('No user logged in')
    await updateProfile(auth.currentUser, { displayName: displayName.trim() })
    setFirebaseUser({ ...auth.currentUser, displayName: displayName.trim() })
  }

  // Sign out user
  const signOutUser = async () => {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      authLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      sendResetPassword,
      updateUserProfile,
      signOutUser,
      getAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

import { TenantContext } from './TenantContext'

export function useAuth() {
  const authCtx = useContext(AuthContext)
  const tenantCtx = useContext(TenantContext)
  if (!authCtx) throw new Error('useAuth must be used within an AuthProvider')
  return {
    ...authCtx,
    ...(tenantCtx ? {
      currentUser: tenantCtx.currentUser,
      isOwner: tenantCtx.isOwner,
      isSalesperson: tenantCtx.isSalesperson,
      permissions: tenantCtx.permissions,
      users: tenantCtx.users,
      switchUser: tenantCtx.switchUser,
      lockSession: tenantCtx.lockSession,
      isPasscodeLocked: tenantCtx.isPasscodeLocked,
      pendingUser: tenantCtx.pendingUser,
      verifyPasscode: tenantCtx.verifyPasscode,
    } : {})
  }
}
