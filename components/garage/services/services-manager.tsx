"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { ServiceManagementTipsCard } from "@/components/garage/services/service-management-tips-card"
import { ServiceStats } from "@/components/garage/services/service-stats"
import { ServicesTable } from "@/components/garage/services/services-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import {
  buildServiceStats,
  formatGarageService,
  type GarageServiceFormValues,
  type GarageServiceRecord,
  type GarageServiceReview,
  type GarageServiceStatus,
  type GarageServiceTableItem,
} from "@/lib/garage-services"
import { appPath } from "@/lib/routes"

type ServicesManagerProps = {
  title: string
  description: string
  actionLabel: string
  tips: string[]
  initialServices: GarageServiceTableItem[]
}

type ServiceMutationPayload = {
  ok: boolean
  service?: GarageServiceRecord
  id?: string
  message?: string
}

const emptyForm: GarageServiceFormValues = {
  name: "",
  category: "",
  durationMinutes: 30,
  price: 0,
  status: "active",
}

const SERVICE_NAME_MAX = 120
const SERVICE_CATEGORY_MAX = 80

const validateServiceForm = (form: GarageServiceFormValues) => {
  if (form.name.trim().length < 2) return "Service name is required"
  if (form.name.trim().length > SERVICE_NAME_MAX) {
    return `Service name must be ${SERVICE_NAME_MAX} characters or fewer`
  }
  if (form.category.trim().length < 2) return "Category is required"
  if (form.category.trim().length > SERVICE_CATEGORY_MAX) {
    return `Category must be ${SERVICE_CATEGORY_MAX} characters or fewer`
  }
  if (!Number.isInteger(form.durationMinutes) || form.durationMinutes < 1 || form.durationMinutes > 1440) {
    return "Duration must be a whole number between 1 and 1440 minutes"
  }
  if (!Number.isFinite(form.price) || form.price < 0 || form.price > 999999) {
    return "Price must be between 0 and 999999"
  }
  return ""
}

const formFromService = (
  service: GarageServiceTableItem,
): GarageServiceFormValues => ({
  name: service.name,
  category: service.category,
  durationMinutes: service.durationMinutes,
  price: service.priceValue,
  status: service.statusValue,
})

export function ServicesManager({
  title,
  description,
  actionLabel,
  tips,
  initialServices,
}: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices)
  const [form, setForm] = useState<GarageServiceFormValues>(emptyForm)
  const [editingService, setEditingService] = useState<GarageServiceTableItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteService, setPendingDeleteService] =
    useState<GarageServiceTableItem | null>(null)
  const [, setError] = useState("")
  const stats = useMemo(() => buildServiceStats(services), [services])

  const openCreateDialog = () => {
    setEditingService(null)
    setForm(emptyForm)
    setError("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (service: GarageServiceTableItem) => {
    setEditingService(service)
    setForm(formFromService(service))
    setError("")
    setIsDialogOpen(true)
  }

  const updateForm = (
    field: keyof GarageServiceFormValues,
    value: string,
  ) => {
    const sanitizedValue =
      field === "name"
        ? value.slice(0, SERVICE_NAME_MAX)
        : field === "category"
          ? value.slice(0, SERVICE_CATEGORY_MAX)
          : value
    setForm((current) => ({
      ...current,
      [field]:
        field === "status"
          ? (sanitizedValue as GarageServiceStatus)
          : field === "name" || field === "category"
            ? sanitizedValue
            : Number(sanitizedValue),
    }))
  }

  const saveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const validationError = validateServiceForm(form)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }
    setIsSubmitting(true)

    try {
      const response = await authenticatedFetch(
        appPath(
          editingService
            ? `/api/services/${editingService.databaseId}`
            : "/api/services",
        ),
        {
          method: editingService ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...form,
            name: form.name.trim(),
            category: form.category.trim(),
          }),
        },
      )
      const payload = (await response.json()) as ServiceMutationPayload
      if (!response.ok || !payload.ok || !payload.service) {
        throw new Error(payload.message || "Unable to save service")
      }

      const formatted = formatGarageService(payload.service)
      setServices((current) =>
        editingService
          ? current.map((service) =>
              service.databaseId === formatted.databaseId ? formatted : service,
            )
          : [formatted, ...current],
      )
      setIsDialogOpen(false)
      setEditingService(null)
      setForm(emptyForm)
      toast.success(editingService ? "Service updated successfully" : "Service added successfully")
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save service"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestDeleteService = (service: GarageServiceTableItem) => {
    setError("")
    setPendingDeleteService(service)
  }

  const deleteService = async () => {
    if (!pendingDeleteService) return
    setError("")
    setDeletingId(pendingDeleteService.databaseId)

    try {
      const response = await authenticatedFetch(
        appPath(`/api/services/${pendingDeleteService.databaseId}`),
        { method: "DELETE" },
      )
      const payload = (await response.json()) as ServiceMutationPayload
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to delete service")
      }
      setServices((current) =>
        current.filter((item) => item.databaseId !== pendingDeleteService.databaseId),
      )
      setPendingDeleteService(null)
      toast.success("Service deleted successfully")
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete service"
      setError(message)
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const updateServiceReview = (
    serviceId: string,
    review: GarageServiceReview,
  ) => {
    setServices((current) =>
      current.map((service) =>
        service.databaseId === serviceId
          ? {
              ...service,
              reviews: service.reviews.map((item) =>
                item.id === review.id ? review : item,
              ),
            }
          : service,
      ),
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-brand-muted">{description}</p>
        </div>

        <Button
          type="button"
          onClick={openCreateDialog}
          className="h-auto w-full gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          {actionLabel}
        </Button>
      </div>

      <ServiceStats stats={stats} />
      <ServicesTable
        services={services}
        deletingId={deletingId}
        onEdit={openEditDialog}
        onDelete={requestDeleteService}
        onReviewReplySaved={updateServiceReview}
      />
      <ServiceManagementTipsCard tips={tips} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit service" : "Add service"}</DialogTitle>
            <DialogDescription>
              {editingService ? editingService.id : "New service"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={saveService} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  maxLength={SERVICE_NAME_MAX}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-category">Category</Label>
                <Input
                  id="service-category"
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  maxLength={SERVICE_CATEGORY_MAX}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-duration">Duration</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    updateForm("durationMinutes", event.target.value)
                  }
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">Price</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="service-status">Status</Label>
                <select
                  id="service-status"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-brand-surface px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDeleteService)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setPendingDeleteService(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete service?</DialogTitle>
            <DialogDescription>
              {pendingDeleteService
                ? `Delete ${pendingDeleteService.name}? This cannot be undone.`
                : "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => setPendingDeleteService(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={deleteService}
            >
              {deletingId ? "Deleting..." : "Delete service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
