"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"

import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  )

const isSecureContextForPush = () =>
  window.isSecureContext || window.location.hostname === "localhost"

let registrationPromise: Promise<void> | null = null

export function registerFirebasePushNotifications() {
  if (registrationPromise) return registrationPromise

  registrationPromise = (async () => {
    if (
      typeof window === "undefined" ||
      !isConfigured() ||
      !isSecureContextForPush() ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !(await isSupported())
    ) {
      return
    }

    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission
    if (permission !== "granted") return

    const serviceWorkerRegistration =
      await navigator.serviceWorker.register(appPath("/firebase-messaging-sw.js"))
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    const token = await getToken(getMessaging(app), {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })
    if (!token) return

    await authenticatedFetch(appPath("/api/notifications/push/subscribe"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fcmToken: token,
        platform: "web",
        deviceName: navigator.userAgent,
      }),
    })
  })().catch((error) => {
    console.warn("Firebase push registration skipped", error)
  })

  return registrationPromise
}
