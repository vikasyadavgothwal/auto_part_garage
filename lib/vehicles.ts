export type VehicleStatus = "Active" | "In Service" | "Inactive"

export type VehicleFormValues = {
  year: string
  make: string
  model: string
  vin: string
  mileage: string
  status: VehicleStatus
  primary: boolean
}

export const emptyVehicleFormValues: VehicleFormValues = {
  year: "",
  make: "",
  model: "",
  vin: "",
  mileage: "",
  status: "Active",
  primary: false,
}
