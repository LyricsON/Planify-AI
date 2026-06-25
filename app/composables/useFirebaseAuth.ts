import { computed } from 'vue'
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  type ActionCodeSettings,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User
} from 'firebase/auth'

type FirebasePublicConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let googleProvider: GoogleAuthProvider | null = null

function getFirebaseConfig(): FirebasePublicConfig {
  const config = useRuntimeConfig()

  return {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string,
    measurementId: config.public.firebaseMeasurementId as string | undefined
  }
}

function validateFirebaseConfig(config: FirebasePublicConfig) {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missing = required.filter(key => !config[key as keyof FirebasePublicConfig])

  if (missing.length > 0) {
    throw new Error(`Firebase is not configured. Missing: ${missing.join(', ')}`)
  }
}

function getFirebaseApp() {
  if (!import.meta.client) {
    throw new Error('Firebase auth is only available on the client')
  }

  if (firebaseApp) {
    return firebaseApp
  }

  const config = getFirebaseConfig()
  validateFirebaseConfig(config)

  firebaseApp = getApps().length ? getApp() : initializeApp(config)
  return firebaseApp
}

function getFirebaseAuth() {
  if (firebaseAuth) {
    return firebaseAuth
  }

  firebaseAuth = getAuth(getFirebaseApp())
  return firebaseAuth
}

function getGoogleProvider() {
  if (googleProvider) {
    return googleProvider
  }

  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })

  return googleProvider
}

function getActionCodeSettings(pathname: string): ActionCodeSettings {
  if (!import.meta.client) {
    throw new Error('Firebase auth is only available on the client')
  }

  return {
    url: new URL(pathname, window.location.origin).toString(),
    handleCodeInApp: true
  }
}

function friendlyFirebaseError(error: unknown, fallback = 'Authentication failed. Please try again.') {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code || '')
    : ''

  if (!code) {
    return fallback
  }

  const map: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account already exists for this email address.',
    'auth/weak-password': 'Password should be at least 8 characters.',
    'auth/user-not-found': 'No account found for this email address.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/popup-blocked': 'The Google sign-in popup was blocked by your browser.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it completed.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/unauthorized-domain': 'This domain is not authorized for Firebase sign-in.'
  }

  return map[code] || fallback
}

async function setFirebasePersistence(remember: boolean) {
  const auth = getFirebaseAuth()
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
}

async function exchangeFirebaseSession(user: User) {
  const token = await user.getIdToken(true)
  const { post } = useApi()

  const response = await post<{ token?: string, data?: unknown }>('/auth/firebase', {
    idToken: token
  })

  if (!response.success || !response.token) {
    throw new Error(response.message || 'Unable to finalize the Firebase session.')
  }

  return response
}

export function useFirebaseAuth() {
  const isConfigured = computed(() => {
    try {
      validateFirebaseConfig(getFirebaseConfig())
      return true
    } catch {
      return false
    }
  })

  async function signInWithEmail(email: string, password: string, remember = false) {
    try {
      const auth = getFirebaseAuth()
      await setFirebasePersistence(remember)
      const credentials = await signInWithEmailAndPassword(auth, email, password)
      return await exchangeFirebaseSession(credentials.user)
    } catch (error) {
      throw new Error(friendlyFirebaseError(error))
    }
  }

  async function signUpWithEmail(email: string, password: string, fullName = '', remember = true) {
    try {
      const auth = getFirebaseAuth()
      await setFirebasePersistence(remember)
      const credentials = await createUserWithEmailAndPassword(auth, email, password)

      if (fullName.trim()) {
        await updateProfile(credentials.user, {
          displayName: fullName.trim()
        })
      }

      try {
        await sendEmailVerification(credentials.user, getActionCodeSettings('/auth/signin'))
      } catch {
        // Verification email is best-effort; account creation still succeeds.
      }

      return await exchangeFirebaseSession(credentials.user)
    } catch (error) {
      throw new Error(friendlyFirebaseError(error))
    }
  }

  async function signInWithGoogle(remember = true) {
    try {
      const auth = getFirebaseAuth()
      await setFirebasePersistence(remember)
      const credentials = await signInWithPopup(auth, getGoogleProvider())
      return await exchangeFirebaseSession(credentials.user)
    } catch (error) {
      throw new Error(friendlyFirebaseError(error))
    }
  }

  async function sendPasswordReset(email: string) {
    try {
      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email, getActionCodeSettings('/auth/signin'))
    } catch (error) {
      throw new Error(friendlyFirebaseError(error, 'Unable to send reset instructions. Please try again.'))
    }
  }

  async function resendEmailVerification() {
    try {
      const auth = getFirebaseAuth()

      if (!auth.currentUser) {
        throw new Error('Please sign in again to resend the verification email.')
      }

      await sendEmailVerification(auth.currentUser, getActionCodeSettings('/auth/signin'))
    } catch (error) {
      throw new Error(friendlyFirebaseError(error, 'Unable to resend the verification email. Please try again.'))
    }
  }

  async function signOutFirebase() {
    if (!import.meta.client) {
      return
    }

    const auth = getFirebaseAuth()

    if (auth.currentUser) {
      await firebaseSignOut(auth)
    }
  }

  async function ensureFirebaseSession() {
    if (!import.meta.client) {
      return null
    }

    const auth = getFirebaseAuth()
    const currentUser = auth.currentUser || await new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })

    if (!currentUser) {
      return null
    }

    return await exchangeFirebaseSession(currentUser)
  }

  return {
    isConfigured,
    ensureFirebaseSession,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    resendEmailVerification,
    signOutFirebase
  }
}
