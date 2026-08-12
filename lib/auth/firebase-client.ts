import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, inMemoryPersistence, reload, setPersistence, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth"

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const isFirebaseAuthConfigured = () =>
  [config.apiKey, config.authDomain, config.projectId, config.appId].every((value) => Boolean(value?.trim()))

export const getFirebaseAuth = () =>
  getAuth(getApps().length ? getApp() : initializeApp(config))

export const getFirebaseAuthDiagnostics = () => ({
  origin: typeof window === "undefined" ? "server" : window.location.origin,
  authDomain: config.authDomain ?? "",
  projectId: config.projectId ?? "",
  apiKeyHint: config.apiKey
    ? `${config.apiKey.slice(0, 6)}...${config.apiKey.slice(-4)}`
    : "",
})

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
