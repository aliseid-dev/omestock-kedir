import React, { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export function AuthPage() {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  const [isSignUp, setIsSignUp] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Verification step state
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null) // 'oauth_google' | 'oauth_apple' | null
  const [error, setError] = useState('')

  // Handle OAuth Sign In / Sign Up (Google / Apple)
  const handleOAuth = async (strategy) => {
    setError('')
    setOauthLoading(strategy)
    try {
      if (isSignUp) {
        if (!signUpLoaded) return
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/',
        })
      } else {
        if (!signInLoaded) return
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/',
        })
      }
    } catch (err) {
      console.error('OAuth error:', err)
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          'Failed to authenticate. Please try again.'
      )
      setOauthLoading(null)
    }
  }

  // Handle Sign In submission
  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!signInLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      })

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
      } else {
        console.warn('Sign-in status requires additional step:', result)
      }
    } catch (err) {
      console.error('Sign-in error:', err)
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          'Invalid email or password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle Sign Up submission
  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!signUpLoaded) return

    if (!firstName.trim()) {
      setError('First name is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        emailAddress: email.trim(),
        password,
      })

      // Send verification code if required
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error('Sign-up error:', err)
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          'Failed to create account. Please check your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Code Verification
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!signUpLoaded) return
    setLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      })

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId })
      } else {
        console.warn('Sign-up verification incomplete:', completeSignUp)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          'Invalid verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white selection:bg-blue-600 selection:text-white">
      {/* Brand Header: Only "O" and "OMESTOCK" */}
      <div className="text-center mb-8 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/30">
          O
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">OMESTOCK</h1>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {pendingVerification ? (
          /* Email Verification Step */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Verify your email</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the verification code sent to <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center tracking-widest font-mono text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Back to registration
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Social Logins: Google & Apple */}
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                disabled={Boolean(oauthLoading) || loading}
                onClick={() => handleOAuth('oauth_google')}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {oauthLoading === 'oauth_google' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
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
                )}
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                disabled={Boolean(oauthLoading) || loading}
                onClick={() => handleOAuth('oauth_apple')}
                className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-slate-900 active:scale-[0.99] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {oauthLoading === 'oauth_apple' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.92-.91.04-2.02.61-2.67 1.38-.58.67-1.09 1.76-.95 2.81 1.02.08 2.06-.5 2.68-1.27z" />
                  </svg>
                )}
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Clean Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                or with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {isSignUp ? (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Last Name <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !firstName.trim() || !email.trim() || !password}
                  className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </button>

                {/* Bottom Switch Link to Sign In */}
                <div className="text-center pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false)
                        setError('')
                      }}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full py-3 mt-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Bottom Switch Link to Sign Up */}
                <div className="text-center pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true)
                        setError('')
                      }}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Powered by Omedla Branding */}
      <div className="mt-8 text-center text-xs text-slate-400 select-none">
        <p className="font-medium">
          Powered by <span className="font-bold text-white tracking-wider">OMEDLA</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          OMESTOCK is an official Omedla product
        </p>
      </div>
    </div>
  )
}
export default AuthPage
