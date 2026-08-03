"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { FirebaseError } from "firebase/app"
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
} from "firebase/auth"
import {
  CheckCircle2,
  ImagePlus,
  Mail,
  MessageSquareText,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import {
  getFirebaseAuthDiagnostics,
  getFirebaseAuth,
  isFirebaseAuthConfigured,
} from "@/lib/auth/firebase-client"
import {
  formFromProfile,
  payloadFromForm,
  weekDays,
  type GarageProfileFormValues,
  type GarageProfileRecord,
} from "@/lib/garage-settings"
import { appPath } from "@/lib/routes"

type SettingsManagerProps = {
  profile: GarageProfileRecord
}

type SettingsPayload = {
  ok: boolean
  profile?: GarageProfileRecord
  message?: string
  verificationLink?: string
  otp?: string
}

type UploadPayload = {
  ok: boolean
  garageImage?: { key: string; url: string } | null
  galleryImages?: Array<{ key: string; url: string }>
  message?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_PATTERN = /^\+\d{8,18}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const PLACE_PATTERN = /^[A-Za-z][A-Za-z\s'.-]*$/
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_GALLERY_UPLOADS = 12
const MAX_GARAGE_NAME_LENGTH = 160
const MAX_EMAIL_LENGTH = 254
const MAX_MOBILE_LOCAL_LENGTH = 14
const MAX_RESPONSE_TIME_LENGTH = 80
const MAX_JOBS_COMPLETED_LENGTH = 6
const MAX_YEARS_EXPERIENCE_LENGTH = 3
const MAX_ADDRESS_LENGTH = 500
const MAX_PLACE_LENGTH = 80
const MAX_PINCODE_LENGTH = 12
const MAX_CERTIFICATION_LENGTH = 160
const MAX_ABOUT_LENGTH = 1000
const MOBILE_COUNTRY_CODES = [
  { code: "+971", label: "UAE" },
  { code: "+91", label: "India" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+1", label: "United States" },
  { code: "+44", label: "United Kingdom" },
  { code: "+974", label: "Qatar" },
  { code: "+965", label: "Kuwait" },
  { code: "+968", label: "Oman" },
  { code: "+973", label: "Bahrain" },
  { code: "+92", label: "Pakistan" },
] as const
const DEFAULT_MOBILE_COUNTRY_CODE = "+971"
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? "00" : "30"
  const value = `${String(hour).padStart(2, "0")}:${minute}`
  const labelHour = hour % 12 || 12
  const suffix = hour < 12 ? "AM" : "PM"
  return { value, label: `${labelHour}:${minute} ${suffix}` }
})

const normalizeDigits = (value: string, maxLength = 14) =>
  value.replace(/\D/g, "").slice(0, maxLength)

const normalizeLimitedText = (value: string, maxLength: number) =>
  value.slice(0, maxLength)

const normalizePlaceText = (value: string) =>
  value.replace(/[^A-Za-z\s'.-]/g, "").slice(0, MAX_PLACE_LENGTH)

const normalizeNumberText = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength)

const numberFromDigits = (value: string) => Number(normalizeNumberText(value, 10) || 0)

const closeOptionsFor = (openTime: string) =>
  TIME_OPTIONS.filter((option) => option.value > openTime)

const parseMobileNumber = (value: string) => {
  const compact = value.replace(/[^\d+]/g, "")
  const countryCode =
    [...MOBILE_COUNTRY_CODES]
      .sort((first, second) => second.code.length - first.code.length)
      .find((country) => compact.startsWith(country.code))?.code ??
    DEFAULT_MOBILE_COUNTRY_CODE
  const localNumber = normalizeDigits(
    compact.startsWith(countryCode)
      ? compact.slice(countryCode.length)
      : compact.replace(/^\+/, ""),
  )

  return { countryCode, localNumber }
}

const buildMobileNumber = (countryCode: string, localNumber: string) => {
  const digits = normalizeDigits(localNumber)
  return digits ? `${countryCode}${digits}` : ""
}

const normalizeMobileValue = (value: string) => {
  const parsed = parseMobileNumber(value)
  return buildMobileNumber(parsed.countryCode, parsed.localNumber)
}

const getFirebasePhoneErrorMessage = (error: unknown) => {
  const diagnostics = getFirebaseAuthDiagnostics()
  const origin =
    diagnostics.origin === "server" ? "this domain" : diagnostics.origin

  if (!(error instanceof FirebaseError)) {
    return error instanceof Error
      ? error.message
      : "Unable to verify mobile number"
  }

  const messages: Record<string, string> = {
    "auth/captcha-check-failed": "Phone verification failed. Try again.",
    "auth/credential-already-in-use":
      "This mobile number is already linked to another account.",
    "auth/invalid-phone-number": "Enter a valid mobile number.",
    "auth/invalid-app-credential":
      `Phone verification is blocked for ${origin}. Add this domain in Firebase Auth Authorized domains and, if your Firebase API key is restricted, add ${origin}/* in Google Cloud API key HTTP referrers.`,
    "auth/invalid-verification-code": "The OTP is incorrect.",
    "auth/missing-verification-code": "Enter the OTP.",
    "auth/operation-not-allowed":
      "Phone authentication is not enabled in Firebase.",
    "auth/quota-exceeded": "Firebase SMS quota is exceeded. Try again later.",
    "auth/too-many-requests": "Too many OTP attempts. Try again later.",
  }

  return messages[error.code] ?? "Unable to verify mobile number"
}

const logFirebasePhoneError = (error: unknown) => {
  if (
    error instanceof FirebaseError &&
    error.code === "auth/invalid-app-credential"
  ) {
    console.warn("Firebase phone auth app verifier rejected", {
      ...getFirebaseAuthDiagnostics(),
      code: error.code,
      message: error.message,
    })
  }
}

export function SettingsManager({ profile }: SettingsManagerProps) {
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const rawInitialForm = formFromProfile(profile)
  const initialForm = {
    ...rawInitialForm,
    mobile: normalizeMobileValue(rawInitialForm.mobile),
  }
  const initialMobile = parseMobileNumber(initialForm.mobile)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [form, setForm] = useState<GarageProfileFormValues>(initialForm)
  const [mobileCountryCode, setMobileCountryCode] = useState<string>(
    initialMobile.countryCode,
  )
  const [mobileLocalNumber, setMobileLocalNumber] = useState(
    initialMobile.localNumber,
  )
  const [, setError] = useState("")
  const [otp, setOtp] = useState("")
  const [mobileVerificationId, setMobileVerificationId] = useState("")
  const [certificationName, setCertificationName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isUploadingGarageImage, setIsUploadingGarageImage] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)

  const setField = <Key extends keyof GarageProfileFormValues>(
    key: Key,
    value: GarageProfileFormValues[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    return () => {
      recaptchaVerifier.current?.clear()
      recaptchaVerifier.current = null
    }
  }, [])

  const clearRecaptchaVerifier = () => {
    recaptchaVerifier.current?.clear()
    recaptchaVerifier.current = null
    document.getElementById("garage-mobile-recaptcha")?.replaceChildren()
  }

  const getRecaptchaVerifier = () => {
    clearRecaptchaVerifier()
    const verifier = new RecaptchaVerifier(
      getFirebaseAuth(),
      "garage-mobile-recaptcha",
      { size: "invisible" },
    )
    recaptchaVerifier.current = verifier
    return verifier
  }

  const syncProfileForm = (nextProfile: GarageProfileRecord) => {
    const nextRawForm = formFromProfile(nextProfile)
    const nextForm = {
      ...nextRawForm,
      mobile: normalizeMobileValue(nextRawForm.mobile),
    }
    const nextMobile = parseMobileNumber(nextForm.mobile)
    setForm(nextForm)
    setMobileCountryCode(nextMobile.countryCode)
    setMobileLocalNumber(nextMobile.localNumber)
  }

  const setMobileNumber = (countryCode: string, localNumber: string) => {
    const digits = normalizeDigits(localNumber, MAX_MOBILE_LOCAL_LENGTH)
    setMobileCountryCode(countryCode)
    setMobileLocalNumber(digits)
    setField("mobile", buildMobileNumber(countryCode, digits))
  }

  const toggleWorkingDay = (day: string) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
      workingHoursByDay: {
        ...current.workingHoursByDay,
        [day]: current.workingDays.includes(day)
          ? { enabled: false, open: "", close: "" }
          : {
              enabled: true,
              open: current.workingHoursByDay[day]?.open || "09:00",
              close: current.workingHoursByDay[day]?.close || "18:00",
            },
      },
    }))
  }

  const setDayHours = (day: string, field: "open" | "close", value: string) => {
    setForm((current) => {
      const currentHours = current.workingHoursByDay[day]
      const nextOpen = field === "open" ? value : currentHours?.open || "09:00"
      let nextClose = field === "close" ? value : currentHours?.close || "18:00"
      if (nextClose <= nextOpen) {
        nextClose = closeOptionsFor(nextOpen)[0]?.value || "23:30"
      }
      return {
        ...current,
        workingHoursByDay: {
          ...current.workingHoursByDay,
          [day]: {
            enabled: true,
            open: nextOpen,
            close: nextClose,
          },
        },
      }
    })
  }

  const validateForm = () => {
    if (form.contactEmail && !EMAIL_PATTERN.test(form.contactEmail)) {
      return "Enter a valid email address"
    }
    if (form.contactEmail.length > MAX_EMAIL_LENGTH) {
      return `Email must be ${MAX_EMAIL_LENGTH} characters or fewer`
    }
    if (form.mobile && !MOBILE_PATTERN.test(form.mobile)) {
      return "Enter a valid mobile number"
    }
    if (form.garageName && form.garageName.length > MAX_GARAGE_NAME_LENGTH) {
      return `Garage name must be ${MAX_GARAGE_NAME_LENGTH} characters or fewer`
    }
    if (form.responseTime.length > MAX_RESPONSE_TIME_LENGTH) {
      return `Response time must be ${MAX_RESPONSE_TIME_LENGTH} characters or fewer`
    }
    if (form.address.length > MAX_ADDRESS_LENGTH) {
      return `Address must be ${MAX_ADDRESS_LENGTH} characters or fewer`
    }
    if (form.about.length > MAX_ABOUT_LENGTH) {
      return `About paragraph must be ${MAX_ABOUT_LENGTH} characters or fewer`
    }
    for (const [label, value] of [
      ["Country", form.country],
      ["State", form.state],
      ["City", form.city],
    ] as const) {
      if (value && !PLACE_PATTERN.test(value)) {
        return `${label} can use letters, spaces, apostrophes, periods, and hyphens only`
      }
      if (value.length > MAX_PLACE_LENGTH) {
        return `${label} must be ${MAX_PLACE_LENGTH} characters or fewer`
      }
    }
    if (form.pincode.length > MAX_PINCODE_LENGTH) {
      return `Pincode must be ${MAX_PINCODE_LENGTH} digits or fewer`
    }
    if (form.jobCompletedNumber < 0 || !Number.isInteger(form.jobCompletedNumber)) {
      return "Job completed number must be a whole number"
    }
    if (String(form.jobCompletedNumber).length > MAX_JOBS_COMPLETED_LENGTH) {
      return `Job completed number must be ${MAX_JOBS_COMPLETED_LENGTH} digits or fewer`
    }
    if (form.yearsExperience < 0 || !Number.isInteger(form.yearsExperience)) {
      return "Years of experience must be a whole number"
    }
    if (String(form.yearsExperience).length > MAX_YEARS_EXPERIENCE_LENGTH) {
      return `Years of experience must be ${MAX_YEARS_EXPERIENCE_LENGTH} digits or fewer`
    }
    if (form.certifications.some((name) => !name.trim())) {
      return "Certification names cannot be empty"
    }
    if (form.certifications.some((name) => name.trim().length > 160)) {
      return "Certification names must be 160 characters or fewer"
    }
    for (const day of form.workingDays) {
      const hours = form.workingHoursByDay[day]
      if (!hours?.enabled || !TIME_PATTERN.test(hours.open) || !TIME_PATTERN.test(hours.close)) {
        return `${day} working hours must use HH:MM format`
      }
      if (hours.open >= hours.close) {
        return `${day} close time must be after open time`
      }
    }
    return ""
  }

  const persistSettings = async () => {
    const response = await authenticatedFetch(appPath("/api/settings"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadFromForm(form)),
    })
    const payload = (await response.json()) as SettingsPayload
    if (!response.ok || !payload.ok || !payload.profile) {
      throw new Error(payload.message || "Unable to save settings")
    }
    setCurrentProfile(payload.profile)
    syncProfileForm(payload.profile)
    return payload.profile
  }

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }
    setIsSaving(true)

    try {
      await persistSettings()
      toast.success("Settings saved")
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Unable to save settings"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const sendEmailVerification = async () => {
    setError("")
    setIsSendingEmail(true)

    try {
      const response = await authenticatedFetch(
        appPath("/api/settings/email-verification"),
        { method: "POST" },
      )
      const payload = (await response.json()) as SettingsPayload
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to send verification link")
      }
      toast.success(
        payload.verificationLink
          ? `${payload.message} ${payload.verificationLink}`
          : payload.message || "Verification link sent",
      )
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : "Unable to send verification link"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const sendMobileOtp = async () => {
    setError("")
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }
    if (!form.mobile) {
      setError("Enter a mobile number before verification")
      toast.error("Enter a mobile number before verification")
      return
    }

    setIsSendingOtp(true)

    try {
      const normalizedFormMobile = normalizeMobileValue(form.mobile)

      if (!isFirebaseAuthConfigured()) {
        throw new Error("Firebase phone authentication is not configured")
      }

      const checkResponse = await authenticatedFetch(
        appPath("/api/settings/mobile-otp/check"),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: normalizedFormMobile }),
        },
      )
      const checkPayload = (await checkResponse.json().catch(() => null)) as {
        message?: string
      } | null
      if (!checkResponse.ok) {
        throw new Error(checkPayload?.message || "Unable to check mobile number")
      }

      const auth = getFirebaseAuth()

      const provider = new PhoneAuthProvider(auth)
      let verificationId: string
      try {
        verificationId = await provider.verifyPhoneNumber(
          normalizedFormMobile,
          getRecaptchaVerifier(),
        )
      } catch (error) {
        clearRecaptchaVerifier()
        throw error
      }
      setMobileVerificationId(verificationId)
      setOtp("")
      toast.success("OTP sent by Firebase")
    } catch (sendError) {
      logFirebasePhoneError(sendError)
      const errorMessage = getFirebasePhoneErrorMessage(sendError)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const verifyMobileOtp = async () => {
    setError("")
    setIsVerifyingOtp(true)

    try {
      if (!mobileVerificationId) {
        throw new Error("Send OTP first")
      }
      if (!isFirebaseAuthConfigured()) {
        throw new Error("Firebase phone authentication is not configured")
      }
      const auth = getFirebaseAuth()

      const credential = PhoneAuthProvider.credential(
        mobileVerificationId,
        otp,
      )
      const phoneCredential = await signInWithCredential(auth, credential)
      const firebaseIdToken = await phoneCredential.user.getIdToken(true)

      const response = await authenticatedFetch(
        appPath("/api/settings/mobile-otp/verify"),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ firebaseIdToken }),
        },
      )
      const payload = (await response.json()) as SettingsPayload
      if (!response.ok || !payload.ok || !payload.profile) {
        throw new Error(payload.message || "Unable to verify OTP")
      }
      setCurrentProfile(payload.profile)
      syncProfileForm(payload.profile)
      setOtp("")
      setMobileVerificationId("")
      toast.success("Mobile number verified")
    } catch (verifyError) {
      const errorMessage = getFirebasePhoneErrorMessage(verifyError)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const uploadImages = async (
    files: FileList | null,
    type: "garageImage" | "galleryImages",
  ) => {
    if (!files?.length) return
    setError("")
    const isGarageImage = type === "garageImage"
    const selectedFiles = Array.from(files)
    if (!isGarageImage && selectedFiles.length > MAX_GALLERY_UPLOADS) {
      setError(`Upload at most ${MAX_GALLERY_UPLOADS} gallery images at once`)
      return
    }
    const invalidFile = selectedFiles.find(
      (file) => !ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE,
    )
    if (invalidFile) {
      setError("Images must be JPG, PNG, or WebP and no larger than 5 MB each")
      return
    }
    if (isGarageImage) {
      setIsUploadingGarageImage(true)
    } else {
      setIsUploadingGallery(true)
    }

    try {
      const formData = new FormData()
      if (isGarageImage) {
        formData.append("garageImage", selectedFiles[0])
      } else {
        selectedFiles.forEach((file) => formData.append("galleryImages", file))
      }
      const response = await authenticatedFetch(appPath("/api/settings/images"), {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as UploadPayload
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to upload images")
      }
      if (payload.garageImage) {
        setField("garageImageUrl", payload.garageImage.url)
        setField("garageImageKey", payload.garageImage.key)
      }
      if (payload.galleryImages?.length) {
        setForm((current) => ({
          ...current,
          galleryImageUrls: [
            ...current.galleryImageUrls,
            ...payload.galleryImages!.map((image) => image.url),
          ].slice(0, 20),
          galleryImageKeys: [
            ...current.galleryImageKeys,
            ...payload.galleryImages!.map((image) => image.key),
          ].slice(0, 20),
        }))
      }
      toast.success("Images uploaded. Save settings to keep these changes.")
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : "Unable to upload images"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploadingGarageImage(false)
      setIsUploadingGallery(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    setForm((current) => ({
      ...current,
      galleryImageUrls: current.galleryImageUrls.filter((_, itemIndex) => itemIndex !== index),
      galleryImageKeys: current.galleryImageKeys.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addCertification = () => {
    const name = certificationName.trim()
    if (!name) {
      setError("Enter a certification name")
      toast.error("Enter a certification name")
      return
    }
    if (name.length > MAX_CERTIFICATION_LENGTH) {
      setError(`Certification names must be ${MAX_CERTIFICATION_LENGTH} characters or fewer`)
      toast.error(`Certification names must be ${MAX_CERTIFICATION_LENGTH} characters or fewer`)
      return
    }
    if (form.certifications.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setError("This certification is already added")
      toast.error("This certification is already added")
      return
    }
    setError("")
    setForm((current) => ({
      ...current,
      certifications: [...current.certifications, name],
    }))
    setCertificationName("")
  }

  const removeCertification = (index: number) => {
    setForm((current) => ({
      ...current,
      certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const garageImageSrc = form.garageImageKey
    ? appPath(`/api/settings/images/view?key=${encodeURIComponent(form.garageImageKey)}`)
    : form.garageImageUrl
  const galleryImageSrc = (url: string, index: number) => {
    const key = form.galleryImageKeys[index]
    return key ? appPath(`/api/settings/images/view?key=${encodeURIComponent(key)}`) : url
  }

  const emailVerified =
    Boolean(currentProfile.contactEmailVerifiedAt) &&
    form.contactEmail === (currentProfile.contactEmail ?? "")
  const mobileVerified =
    Boolean(currentProfile.mobileVerifiedAt) &&
    normalizeMobileValue(form.mobile) ===
      normalizeMobileValue(currentProfile.mobile ?? "")
  const mobileNeedsSaveBeforeOtp =
    Boolean(form.mobile) &&
    normalizeMobileValue(form.mobile) !==
      normalizeMobileValue(currentProfile.mobile ?? "")

  return (
    <form className="space-y-8" onSubmit={saveSettings}>
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Workspace Settings
        </h1>
        <p className="text-brand-muted">
          Manage garage profile, contact verification, working schedule, and media.
        </p>
      </div>
      <div id="garage-mobile-recaptcha" />

      <Card className="rounded-lg border border-border bg-brand-panel shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">Contact Verification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="contact-email">Email</Label>
              {emailVerified ? (
                <Badge className="bg-brand-success/10 text-brand-success">
                  Verified
                </Badge>
              ) : null}
            </div>
            <Input
              id="contact-email"
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                setField("contactEmail", normalizeLimitedText(event.target.value, MAX_EMAIL_LENGTH))
              }
              maxLength={MAX_EMAIL_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
            {!emailVerified ? (
              <Button
                type="button"
                variant="outline"
                onClick={sendEmailVerification}
                disabled={isSendingEmail}
                className="gap-2"
              >
                <Mail className="size-4" />
                {isSendingEmail ? "Sending..." : "Send verification link"}
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="mobile">Mobile</Label>
              {mobileVerified ? (
                <Badge className="bg-brand-success/10 text-brand-success">
                  Verified
                </Badge>
              ) : null}
            </div>
            <div className="flex min-w-0">
              <select
                aria-label="Mobile country code"
                value={mobileCountryCode}
                onChange={(event) =>
                  setMobileNumber(event.target.value, mobileLocalNumber)
                }
                className="h-11 w-36 shrink-0 rounded-l-lg border border-border bg-brand-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {MOBILE_COUNTRY_CODES.map((country) => (
                  <option
                    key={`${country.code}-${country.label}`}
                    value={country.code}
                  >
                    {country.code}
                  </option>
                ))}
              </select>
              <Input
                id="mobile"
                type="tel"
                value={mobileLocalNumber}
                onChange={(event) =>
                  setMobileNumber(mobileCountryCode, event.target.value)
                }
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={MAX_MOBILE_LOCAL_LENGTH}
                placeholder="Mobile number"
                className="h-11 min-w-0 rounded-l-none border-l-0 border-border bg-brand-surface"
              />
            </div>
            {!mobileVerified ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendMobileOtp}
                  disabled={isSendingOtp || isSaving}
                  className="gap-2"
                >
                  <MessageSquareText className="size-4" />
                  {isSendingOtp
                    ? mobileNeedsSaveBeforeOtp
                      ? "Saving..."
                      : "Sending..."
                    : mobileNeedsSaveBeforeOtp
                      ? "Save & Send OTP"
                      : "Send OTP"}
                </Button>
                <Input
                  value={otp}
                  onChange={(event) => setOtp(normalizeDigits(event.target.value, 6))}
                  placeholder="OTP"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-9 border-border bg-brand-surface sm:max-w-32"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={verifyMobileOtp}
                  disabled={isVerifyingOtp || !otp.trim()}
                  className="gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  Verify
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-border bg-brand-panel shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">Garage Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="garage-name">Garage name</Label>
            <Input
              id="garage-name"
              value={form.garageName}
              onChange={(event) =>
                setField("garageName", normalizeLimitedText(event.target.value, MAX_GARAGE_NAME_LENGTH))
              }
              maxLength={MAX_GARAGE_NAME_LENGTH}
              placeholder="Garage display name"
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Working days in week</Label>
            <div className="grid rounded-lg border border-border bg-brand-surface p-1 sm:grid-cols-7">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  aria-pressed={form.workingDays.includes(day)}
                  className={`min-h-12 rounded-md px-3 py-2 text-sm font-medium transition ${
                    form.workingDays.includes(day)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-brand-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <span className="block sm:hidden">{day}</span>
                  <span className="hidden sm:block">{day.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Working hours</Label>
            {form.workingDays.length === 0 ? (
              <p className="text-sm text-brand-muted">
                Select working days to set daily hours.
              </p>
            ) : null}
            <div className="grid gap-3">
              {form.workingDays.map((day) => {
                const openTime = form.workingHoursByDay[day]?.open || "09:00"
                const closeTime = form.workingHoursByDay[day]?.close || "18:00"
                const availableCloseOptions = closeOptionsFor(openTime)

                return (
                <div
                  key={day}
                  className="grid gap-3 rounded-lg border border-border bg-brand-surface p-3 sm:grid-cols-[140px_1fr_1fr] sm:items-end"
                >
                  <div className="pb-2 text-sm font-medium text-foreground">
                    {day}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${day}-open`} className="text-xs">
                      Open
                    </Label>
                    <select
                      id={`${day}-open`}
                      value={openTime}
                      onChange={(event) =>
                        setDayHours(day, "open", event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      required
                    >
                      {TIME_OPTIONS.slice(0, -1).map((option) => (
                        <option key={`${day}-open-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${day}-close`} className="text-xs">
                      Close
                    </Label>
                    <select
                      id={`${day}-close`}
                      value={availableCloseOptions.some((option) => option.value === closeTime) ? closeTime : availableCloseOptions[0]?.value}
                      onChange={(event) =>
                        setDayHours(day, "close", event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      required
                    >
                      {availableCloseOptions.map((option) => (
                        <option key={`${day}-close-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response-time">Response time</Label>
            <Input
              id="response-time"
              value={form.responseTime}
              onChange={(event) =>
                setField("responseTime", normalizeLimitedText(event.target.value, MAX_RESPONSE_TIME_LENGTH))
              }
              maxLength={MAX_RESPONSE_TIME_LENGTH}
              placeholder="Within 30 minutes"
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobs-completed">Job completed number</Label>
            <Input
              id="jobs-completed"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.jobCompletedNumber}
              onChange={(event) =>
                setField("jobCompletedNumber", numberFromDigits(event.target.value.slice(0, MAX_JOBS_COMPLETED_LENGTH)))
              }
              maxLength={MAX_JOBS_COMPLETED_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="years-experience">Year of exp in no</Label>
            <Input
              id="years-experience"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.yearsExperience}
              onChange={(event) =>
                setField("yearsExperience", numberFromDigits(event.target.value.slice(0, MAX_YEARS_EXPERIENCE_LENGTH)))
              }
              maxLength={MAX_YEARS_EXPERIENCE_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="garage-image">Garage image</Label>
            <div className="rounded-lg border border-dashed border-border bg-brand-surface p-4">
              <Input
                id="garage-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => uploadImages(event.target.files, "garageImage")}
                className="sr-only"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Main garage photo
                  </p>
                  <p className="text-xs text-brand-muted">
                    JPG, PNG, or WebP up to 5 MB.
                  </p>
                </div>
                <Button asChild type="button" variant="outline" className="gap-2">
                  <label htmlFor="garage-image" className="cursor-pointer">
                    <ImagePlus className="size-4" />
                    {form.garageImageUrl ? "Replace image" : "Select image"}
                  </label>
                </Button>
              </div>
              {isUploadingGarageImage ? (
                <p className="mt-3 text-sm text-brand-muted">Uploading...</p>
              ) : null}
            </div>
            {form.garageImageUrl ? (
              <div className="overflow-hidden rounded-lg border border-border bg-brand-surface shadow-sm">
                <div
                  className="aspect-[16/9] bg-cover bg-center"
                  style={{ backgroundImage: `url("${garageImageSrc}")` }}
                  aria-label="Garage image preview"
                />
                <div className="flex items-center justify-between gap-3 p-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-brand-muted">
                    {form.garageImageUrl}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setField("garageImageUrl", "")
                      setField("garageImageKey", "")
                    }}
                    aria-label="Remove garage image"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={form.address}
              onChange={(event) =>
                setField("address", normalizeLimitedText(event.target.value, MAX_ADDRESS_LENGTH))
              }
              maxLength={MAX_ADDRESS_LENGTH}
              className="min-h-24 w-full rounded-lg border border-border bg-brand-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(event) => setField("country", normalizePlaceText(event.target.value))}
              maxLength={MAX_PLACE_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(event) => setField("state", normalizePlaceText(event.target.value))}
              maxLength={MAX_PLACE_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(event) => setField("city", normalizePlaceText(event.target.value))}
              maxLength={MAX_PLACE_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.pincode}
              onChange={(event) =>
                setField("pincode", normalizeNumberText(event.target.value, MAX_PINCODE_LENGTH))
              }
              maxLength={MAX_PINCODE_LENGTH}
              className="h-11 border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="certifications">Certifications</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="certifications"
                value={certificationName}
                onChange={(event) =>
                  setCertificationName(normalizeLimitedText(event.target.value, MAX_CERTIFICATION_LENGTH))
                }
                maxLength={MAX_CERTIFICATION_LENGTH}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addCertification()
                  }
                }}
                placeholder="Certification name"
                className="h-11 border-border bg-brand-surface"
              />
              <Button type="button" variant="outline" onClick={addCertification}>
                Add
              </Button>
            </div>
            {form.certifications.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {form.certifications.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-brand-surface p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCertification(index)}
                      aria-label="Remove certification"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-muted">
                Add certificate names only.
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about">About paragraph</Label>
            <textarea
              id="about"
              value={form.about}
              onChange={(event) =>
                setField("about", normalizeLimitedText(event.target.value, MAX_ABOUT_LENGTH))
              }
              maxLength={MAX_ABOUT_LENGTH}
              className="min-h-32 w-full rounded-lg border border-border bg-brand-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gallery-images">Gallery images</Label>
            <div className="rounded-lg border border-dashed border-border bg-brand-surface p-4">
              <Input
                id="gallery-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => uploadImages(event.target.files, "galleryImages")}
                className="sr-only"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Workshop gallery
                  </p>
                  <p className="text-xs text-brand-muted">
                    Select up to {MAX_GALLERY_UPLOADS} images at once. Save settings after upload.
                  </p>
                </div>
                <Button asChild type="button" variant="outline" className="gap-2">
                  <label htmlFor="gallery-images" className="cursor-pointer">
                    <ImagePlus className="size-4" />
                    Select gallery images
                  </label>
                </Button>
              </div>
            </div>
            {isUploadingGallery ? (
              <p className="text-sm text-brand-muted">Uploading...</p>
            ) : null}
            {form.galleryImageUrls.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {form.galleryImageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="overflow-hidden rounded-lg border border-border bg-brand-surface shadow-sm"
                  >
                    <div
                      className="aspect-video bg-cover bg-center"
                      style={{ backgroundImage: `url("${galleryImageSrc(url, index)}")` }}
                      aria-label={`Gallery image ${index + 1} preview`}
                    />
                    <div className="flex items-center justify-between gap-3 p-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-brand-muted">
                        {url}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGalleryImage(index)}
                        aria-label="Remove gallery image"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-primary text-primary-foreground hover:bg-brand-primary-hover"
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
