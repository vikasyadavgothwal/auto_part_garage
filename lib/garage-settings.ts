export type GarageProfileRecord = {
  id: string
  garageId: string
  garageName: string | null
  contactEmail: string | null
  contactEmailVerifiedAt: string | null
  mobile: string | null
  mobileVerifiedAt: string | null
  workingDays: string[]
  workingHours: string | null
  workingHoursByDay: Record<string, GarageDayHours>
  garageImageUrl: string | null
  garageImageKey: string | null
  address: string | null
  country: string | null
  state: string | null
  city: string | null
  jobCompletedNumber: number
  yearsExperience: number
  responseTime: string | null
  certifications: string[]
  about: string | null
  galleryImageUrls: string[]
  galleryImageKeys: string[]
  createdAt: string
  updatedAt: string
}

export type GarageDayHours = {
  enabled: boolean
  open: string
  close: string
}

export type GarageProfileFormValues = {
  garageName: string
  contactEmail: string
  mobile: string
  workingDays: string[]
  workingHours: string
  workingHoursByDay: Record<string, GarageDayHours>
  garageImageUrl: string
  garageImageKey: string
  address: string
  country: string
  state: string
  city: string
  jobCompletedNumber: number
  yearsExperience: number
  responseTime: string
  certifications: string[]
  about: string
  galleryImageUrls: string[]
  galleryImageKeys: string[]
}

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

export const emptyGarageProfile: GarageProfileRecord = {
  id: "",
  garageId: "",
  garageName: null,
  contactEmail: null,
  contactEmailVerifiedAt: null,
  mobile: null,
  mobileVerifiedAt: null,
  workingDays: [],
  workingHours: null,
  workingHoursByDay: {},
  garageImageUrl: null,
  garageImageKey: null,
  address: null,
  country: null,
  state: null,
  city: null,
  jobCompletedNumber: 0,
  yearsExperience: 0,
  responseTime: null,
  certifications: [],
  about: null,
  galleryImageUrls: [],
  galleryImageKeys: [],
  createdAt: "",
  updatedAt: "",
}

export const formFromProfile = (
  profile: GarageProfileRecord,
): GarageProfileFormValues => ({
  garageName: profile.garageName ?? "",
  contactEmail: profile.contactEmail ?? "",
  mobile: profile.mobile ?? "",
  workingDays: profile.workingDays,
  workingHours: profile.workingHours ?? "",
  workingHoursByDay: profile.workingHoursByDay,
  garageImageUrl: profile.garageImageUrl ?? "",
  garageImageKey: profile.garageImageKey ?? "",
  address: profile.address ?? "",
  country: profile.country ?? "",
  state: profile.state ?? "",
  city: profile.city ?? "",
  jobCompletedNumber: profile.jobCompletedNumber,
  yearsExperience: profile.yearsExperience,
  responseTime: profile.responseTime ?? "",
  certifications: profile.certifications,
  about: profile.about ?? "",
  galleryImageUrls: profile.galleryImageUrls,
  galleryImageKeys: profile.galleryImageKeys,
})

export const payloadFromForm = (form: GarageProfileFormValues) => ({
  ...form,
  certifications: form.certifications
    .map((value) => value.trim())
    .filter(Boolean),
})
