"use client"

import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

export type DashboardNotification = {
  id: string
  type: string
  title: string
  body: string
  linkUrl: string | null
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export const notificationsApiPath = appPath("/api/notifications")
export const notificationsStreamPath = appPath("/api/notifications/stream")
export const notificationsReadAllPath = appPath("/api/notifications/read-all")
export const notificationReadPath = (id: string) =>
  appPath(`/api/notifications/${encodeURIComponent(id)}/read`)
export const notificationHref = (path: string) =>
  /^https?:\/\//.test(path) ? path : appPath(path)
export const notificationFetch = authenticatedFetch
