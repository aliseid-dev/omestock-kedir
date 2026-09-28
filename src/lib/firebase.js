import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Check if production Firebase credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'undefined'
)

let app = null
let db = null
let auth = null
let analytics = null
let googleProvider = null
let appleProvider = null

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    db = getFirestore(app)
    auth = getAuth(app)

    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: 'select_account' })

    appleProvider = new OAuthProvider('apple.com')
    appleProvider.addScope('email')
    appleProvider.addScope('name')

    // Safely initialize analytics in browser environment
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      import('firebase/analytics')
        .then(({ getAnalytics, isSupported }) => {
          isSupported().then(supported => {
            if (supported) analytics = getAnalytics(app)
          })
        })
        .catch(() => {})
    }
  } catch (error) {
    console.warn('Firebase initialization error, running in demo/offline mode:', error)
  }
} else {
  console.info('OMESTOCK: Running offline/demo mode. Provide VITE_FIREBASE_* variables in .env to connect live Firestore.')
}

export { app, db, auth, analytics, googleProvider, appleProvider }

