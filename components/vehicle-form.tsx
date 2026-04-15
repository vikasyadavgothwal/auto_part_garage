"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  emptyVehicleFormValues,
  type VehicleFormValues,
  type VehicleStatus,
} from "@/lib/vehicles"

const vehicleStatusOptions: VehicleStatus[] = [
  "Active",
  "In Service",
  "Inactive",
]

type VehicleFormProps = {
  initialValues?: VehicleFormValues
  submitLabel: string
  onSubmit: (values: VehicleFormValues) => void
  onCancel?: () => void
  className?: string
}

export function VehicleForm({
  initialValues = emptyVehicleFormValues,
  submitLabel,
  onSubmit,
  onCancel,
  className,
}: VehicleFormProps) {
  const [values, setValues] = useState<VehicleFormValues>(initialValues)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function updateValue<Key extends keyof VehicleFormValues>(
    key: Key,
    nextValue: VehicleFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
  }

  return (
    <form
      className={cn("space-y-6", className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="vehicle-year">Year</Label>
          <Input
            id="vehicle-year"
            inputMode="numeric"
            maxLength={4}
            placeholder="2019"
            required
            value={values.year}
            onChange={(event) => updateValue("year", event.target.value)}
            className="h-10 border-border bg-brand-surface"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-make">Make</Label>
          <Input
            id="vehicle-make"
            placeholder="Toyota"
            required
            value={values.make}
            onChange={(event) => updateValue("make", event.target.value)}
            className="h-10 border-border bg-brand-surface"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-model">Model</Label>
          <Input
            id="vehicle-model"
            placeholder="Camry"
            required
            value={values.model}
            onChange={(event) => updateValue("model", event.target.value)}
            className="h-10 border-border bg-brand-surface"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-vin">VIN</Label>
          <Input
            id="vehicle-vin"
            placeholder="JT2BF22K6X0123456"
            required
            value={values.vin}
            onChange={(event) => updateValue("vin", event.target.value)}
            className="h-10 border-border bg-brand-surface uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-mileage">Mileage</Label>
          <Input
            id="vehicle-mileage"
            inputMode="numeric"
            placeholder="45234"
            required
            value={values.mileage}
            onChange={(event) => updateValue("mileage", event.target.value)}
            className="h-10 border-border bg-brand-surface"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="vehicle-status">Status</Label>
          <select
            id="vehicle-status"
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as VehicleStatus)
            }
            className="h-10 w-full rounded-lg border border-border bg-brand-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
          >
            {vehicleStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <label className="flex min-h-10 items-center gap-3 rounded-lg border border-border bg-brand-surface px-4">
          <Checkbox
            checked={values.primary}
            onCheckedChange={(checked) =>
              updateValue("primary", checked === true)
            }
          />
          <div>
            <div className="text-sm font-medium text-foreground">
              Mark as primary vehicle
            </div>
            <div className="text-xs text-brand-muted">
              Your main vehicle for fitment and RFQ defaults.
            </div>
          </div>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border bg-brand-surface text-foreground hover:bg-brand-panel-strong"
          >
            Cancel
          </Button>
        ) : null}

        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-brand-primary-hover"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
