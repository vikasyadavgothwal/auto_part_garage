import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const runtimeEnv = (key: string) => process.env[key] ?? ""

const firebaseRuntimeConfig = () => ({
  apiKey: runtimeEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: runtimeEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: runtimeEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: runtimeEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: runtimeEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: runtimeEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
})

export function GET() {
  const body = `window.__AUTO_PARTS_FIREBASE_CONFIG__=${JSON.stringify(firebaseRuntimeConfig()).replace(/</g, "\\u003c")};`

  return new NextResponse(body, {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/javascript; charset=utf-8",
    },
  })
}
