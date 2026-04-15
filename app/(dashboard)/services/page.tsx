"use client"

import { Pen, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { servicesPageData } from "@/lib/garage-page-data"

export default function GarageServicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {servicesPageData.title}
          </h1>
          <p className="text-brand-muted">{servicesPageData.description}</p>
        </div>

        <Button className="h-auto w-full gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-brand-primary-hover sm:w-auto">
          <Plus className="h-5 w-5" />
          {servicesPageData.primaryActionLabel}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {servicesPageData.stats.map((item) => (
          <Card key={item.title} className="surface-card">
            <CardContent className="p-6">
              <div className="mb-2 text-sm text-brand-muted">{item.title}</div>
              <div className={`text-3xl font-bold ${item.valueClass}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-background hover:bg-background">
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Service ID
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Service Name
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Category
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Duration
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Price
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Bookings
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {servicesPageData.services.map((service) => (
                <TableRow
                  key={service.id}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-brand-panel-strong"
                >
                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <span className="font-medium text-primary">
                      {service.id}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {service.name}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {service.category}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {service.duration}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <span className="font-semibold text-foreground">
                      {service.price}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {service.bookings}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <Badge
                      className={`rounded-full px-2 py-1 text-xs font-medium ${service.statusClass}`}
                    >
                      {service.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded bg-brand-panel-strong p-2 text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <Pen className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="rounded bg-brand-panel-strong p-2 text-foreground transition-all hover:bg-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h3 className="mb-2 font-semibold text-foreground">
            Service Management Tips
          </h3>

          <ul className="space-y-2 text-sm text-brand-muted">
            {servicesPageData.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
