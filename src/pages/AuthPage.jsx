import React, { useState } from 'react'
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  KeyRound,
  X
} from 'lucide-react'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateCompanyCode } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export function AuthPage() {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendResetPassword
  } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [role, setRole] = useState('owner') // 'owner' | 'salesperson'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  const getCleanErrorMessage = (err) => {
    const code = err?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please verify and try again.'
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Try signing in instead.'
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please use at least 6 characters.'
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign in cancelled by user.'
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in provider is not enabled in the Firebase Console.'
    }
    return err?.message || 'Authentication failed. Please try again.'
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }

      // If salesperson, validate 6-digit organization code
      if (role === 'salesperson') {
        const cleanCode = companyCode.trim().toUpperCase()
        if (cleanCode.length !== 6) {
          setError('Please enter a valid 6-digit uppercase organization code.')
          return
        }
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else if (role === 'salesperson') {
        // ─── Salesperson Sign-Up & Code Binding ─────────────────────────────
        const cleanCode = companyCode.trim().toUpperCase()
        
        // 1. Validate organization code against database
        const q = query(collection(db, 'clients'), where('companyCode', '==', cleanCode))
        const snap = await getDocs(q)
        if (snap.empty) {
          setError(`Invalid organization code "${cleanCode}". No organization found matching this code. Please check with your business owner.`)
          setLoading(false)
          return
        }

        const targetOrgDoc = snap.docs[0]
        const targetOrgId = targetOrgDoc.id
        const targetOrgData = targetOrgDoc.data()

        // 2. Create the user in Firebase Auth
        const cred = await signUpWithEmail(email, password, name)

        // 3. Link account to /clients/{clientId}/staff collection with 'pending' status
        await addDoc(collection(db, 'clients', targetOrgId, 'staff'), {
          uid: cred.user.uid,
          name: name.trim(),
          email: cred.user.email.toLowerCase(),
          role: 'salesperson',
          status: 'pending',
          active: false,
          storeId: null,
          passcode: '1234',
          totalCommissionsEarned: 0,
          createdAt: new Date().toISOString(),
          organizationName: targetOrgData.name || targetOrgData.businessName || 'Organization',
          companyCode: cleanCode,
        })

        // 4. Add user email to organization's members array
        await updateDoc(doc(db, 'clients', targetOrgId), {
          members: arrayUnion(cred.user.email.toLowerCase())
        })

        // 5. Create user mapping document in /users/{uid}
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          name: name.trim(),
          email: cred.user.email.toLowerCase(),
          role: 'salesperson',
          orgId: targetOrgId,
          companyCode: cleanCode,
          orgName: targetOrgData.name || targetOrgData.businessName || 'Organization',
          status: 'pending',
          createdAt: new Date().toISOString(),
        })

        // 6. Log audit event
        try {
          await addDoc(collection(db, 'clients', targetOrgId, 'audit_logs'), {
            actorId: cred.user.uid,
            actorName: name.trim(),
            role: 'salesperson',
            action: 'STAFF_REGISTERED',
            description: `Salesperson ${name.trim()} (${cred.user.email}) registered using company code ${cleanCode} (Status: Pending Approval)`,
            target: targetOrgId,
            timestamp: new Date().toISOString(),
          })
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr)
        }

        localStorage.setItem('omestock_active_org_id', targetOrgId)

      } else {
        // ─── Owner Sign-Up & Unique 6-Digit Company Code ────────────────────
        let code = generateCompanyCode()
        
        // Ensure unique 6-digit code
        try {
          const codeQuery = query(collection(db, 'clients'), where('companyCode', '==', code))
          const existingSnap = await getDocs(codeQuery)
          if (!existingSnap.empty) {
            code = generateCompanyCode()
          }
        } catch (e) {
          console.warn('Code uniqueness check error:', e)
        }

        // 1. Create the Firebase Auth user
        const cred = await signUpWithEmail(email, password, name)

        // 2. Generate Organization Document
        const orgId = `org-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
        const businessTitle = companyName.trim() || `${name.trim()}'s Enterprise`

        const orgData = {
          id: orgId,
          name: businessTitle,
          businessName: businessTitle,
          companyCode: code,
          ownerUid: cred.user.uid,
          ownerEmail: cred.user.email.toLowerCase(),
          currency: 'ETB',
          members: [cred.user.email.toLowerCase()],
          createdAt: new Date().toISOString(),
          setupComplete: true,
        }

        await setDoc(doc(db, 'clients', orgId), orgData)

        // 3. Provision Central Warehouse
        await setDoc(doc(collection(db, 'clients', orgId, 'warehouses')), {
          name: 'Central Warehouse',
          location: 'Main Distribution Hub',
          isCentral: true,
          stock: {},
        })

        // 4. Provision Initial Retail Store
        await setDoc(doc(collection(db, 'clients', orgId, 'stores')), {
          name: 'Main Branch',
          location: 'Primary Storefront',
          isWarehouse: false,
          stock: {},
        })

        // 5. Provision Owner Staff Record
        await setDoc(doc(collection(db, 'clients', orgId, 'staff')), {
          name: name.trim(),
          email: cred.user.email.toLowerCase(),
          role: 'owner',
          status: 'approved',
          storeId: null,
          passcode: '0000',
          active: true,
          totalCommissionsEarned: 0,
        })

        // 6. Audit log
        try {
          await addDoc(collection(db, 'clients', orgId, 'audit_logs'), {
            actorId: cred.user.uid,
            actorName: name.trim(),
            role: 'owner',
            action: 'ORGANIZATION_CREATED',
            description: `Owner created enterprise "${businessTitle}" with 6-digit code ${code}`,
            target: orgId,
            timestamp: new Date().toISOString(),
          })
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr)
        }

        // 7. Store user document in /users/{uid}
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          name: name.trim(),
          email: cred.user.email.toLowerCase(),
          role: 'owner',
          orgId: orgId,
          companyCode: code,
          status: 'approved',
          createdAt: new Date().toISOString(),
        })

        localStorage.setItem('omestock_active_org_id', orgId)
      }
    } catch (err) {
      setError(getCleanErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }


  const handleGoogleAuth = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(getCleanErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAppleAuth = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithApple()
    } catch (err) {
      setError(getCleanErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    if (!resetEmail.trim()) {
      setResetError('Please enter your account email.')
      return
    }

    setResetLoading(true)
    try {
      await sendResetPassword(resetEmail)
      setResetSuccess(`Password reset email sent to ${resetEmail}. Check your inbox to verify and create a new password.`)
    } catch (err) {
      setResetError(getCleanErrorMessage(err))
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-500 selection:text-white">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-sm w-full">
        <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-emerald-950/40 mb-3 border border-slate-100">
          L
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">OMESTOCK</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Retail POS & Multi-Store Inventory Management
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Toggle Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError('') }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError('') }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Social Login Options */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={handleAppleAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-black hover:bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-7.07-10.74-12.28-22.77-15.62-36.08-3.34-13.31-5.01-25.59-5.01-36.85 0-14.77 3.58-26.68 10.74-35.73 7.16-9.05 16.29-13.68 27.38-13.9 4.8 0 10.11 1.25 15.93 3.75 5.82 2.5 9.74 3.78 11.76 3.78 1.63 0 5.48-1.25 11.55-3.78 6.07-2.52 11.24-3.66 15.5-3.41 12.08.76 21.6 5.21 28.56 13.35-10.66 6.42-15.88 15.34-15.66 26.77.22 8.92 3.69 16.43 10.42 22.52 6.73 6.09 14.75 9.57 24.05 10.44-2.17 6.53-4.99 13.49-8.47 20.88zM119.22 31.84c0-7.39 2.61-14.24 7.83-20.55 5.22-6.31 11.64-10.23 19.26-11.75.22 1.09.33 2.18.33 3.26 0 7.39-2.72 14.34-8.16 20.87-5.44 6.53-12.01 10.33-19.7 11.41-.33-1.09-.56-2.18-.56-3.24z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-3 pb-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Your Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { setRole('owner'); setError('') }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      role === 'owner'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${role === 'owner' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('salesperson'); setError('') }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      role === 'salesperson'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User className={`w-4 h-4 ${role === 'salesperson' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Salesperson</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 px-1 leading-tight">
                  {role === 'owner'
                    ? 'Create your business organization, get a unique 6-digit company code, and manage staff.'
                    : 'Join an existing store using the 6-digit company code provided by your owner.'}
                </p>
              </div>

              {/* Salesperson: 6-Digit Company Code Field */}
              {role === 'salesperson' && (
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-950">
                      6-Digit Organization Code *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                      className="w-full text-base font-mono font-black tracking-widest pl-9 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase min-h-[44px] text-slate-900 placeholder:text-slate-300"
                      placeholder="e.g. A7X9M2"
                    />
                    <KeyRound className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-tight">
                    Must be exactly 6 uppercase letters & numbers provided by your business owner.
                  </p>
                </div>
              )}

              {/* Owner: Business / Enterprise Name */}
              {role === 'owner' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enterprise / Business Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                      placeholder="e.g. Omedla Retail Group"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                    placeholder="e.g. Alex Omedla"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                placeholder="name@business.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email)
                    setResetError('')
                    setResetSuccess('')
                    setShowForgotModal(true)
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full font-bold shadow-md min-h-[46px] text-xs mt-2"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In to OMESTOCK</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            ) : role === 'salesperson' ? (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Register as Salesperson</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Create Owner Account</span>
              </>
            )}
          </Button>
        </form>


      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-md max-w-sm p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Enter your account email. Firebase will send you a secure verification link to set your new password.
            </p>

            {resetSuccess && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {!resetSuccess && (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[44px]"
                    placeholder="name@business.com"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={resetLoading}
                  className="w-full font-bold min-h-[44px]"
                >
                  {resetLoading ? 'Sending link...' : 'Send Verification Email'}
                </Button>
              </form>
            )}

            {resetSuccess && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowForgotModal(false)}
                className="w-full font-bold mt-4 min-h-[44px]"
              >
                Back to Sign In
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
