import { LoginForm } from "@/components/auth/login"
import { getSiteBranding } from "@/lib/site-branding"

export default async function LoginPage() {
  return <LoginForm branding={await getSiteBranding()} />
}
