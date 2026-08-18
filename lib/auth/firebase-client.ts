import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app"
import { getAuth, GoogleAuthProvider, inMemoryPersistence, reload, setPersistence, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth"

declare global {
  interface Window {
    __AUTO_PARTS_FIREBASE_CONFIG__?: FirebaseOptions
  }
}

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const firebaseConfig = () =>
  typeof window === "undefined"
    ? config
    : { ...config, ...window.__AUTO_PARTS_FIREBASE_CONFIG__ }

let runtimeConfigPromise: Promise<void> | null = null

export const isFirebaseAuthConfigured = () =>
  [
    firebaseConfig().apiKey,
    firebaseConfig().authDomain,
    firebaseConfig().projectId,
    firebaseConfig().appId,
  ].every((value) => Boolean(String(value ?? "").trim()))

export const ensureFirebaseAuthConfigured = async () => {
  if (isFirebaseAuthConfigured()) return true
  if (typeof window === "undefined") return false

  runtimeConfigPromise ??= new Promise<void>((resolve) => {
    const script = document.createElement("script")
    script.src = `/api/firebase-config.js?ts=${Date.now()}`
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })

  await runtimeConfigPromise
  return isFirebaseAuthConfigured()
}

export const getFirebaseAuth = () =>
  getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig()))

export const getFirebaseAuthDiagnostics = () => {
  const activeConfig = firebaseConfig()
  const apiKey = String(activeConfig.apiKey ?? "")
  return {
    origin: typeof window === "undefined" ? "server" : window.location.origin,
    authDomain: String(activeConfig.authDomain ?? ""),
    projectId: String(activeConfig.projectId ?? ""),
    apiKeyHint: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "",
  }
}

export async function createFirebaseLoginPayload(email: string, password: string) {
  const auth = getFirebaseAuth()
  await setPersistence(auth, inMemoryPersistence)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await reload(credential.user)
  if (credential.user.email && !credential.user.emailVerified) {
    throw new Error("Verify your email before signing in.")
  }

  const firebaseIdToken = await credential.user.getIdToken(true)
  await signOut(auth).catch(() => undefined)
  return { firebaseIdToken }
}

export async function createFirebaseGoogleLoginPayload() {
  const auth = getFirebaseAuth()
  await setPersistence(auth, inMemoryPersistence)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  const credential = await signInWithPopup(auth, provider)
  const firebaseIdToken = await credential.user.getIdToken(true)
  await signOut(auth).catch(() => undefined)
  return { firebaseIdToken }
}

export async function signOutFirebase() {
  if (isFirebaseAuthConfigured()) await signOut(getFirebaseAuth())
}
