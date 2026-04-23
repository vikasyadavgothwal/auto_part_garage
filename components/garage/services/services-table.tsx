import { Pen, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  tableCellMutedClass,
  tableHeadLeftClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import type { ServicesPageData } from "@/lib/garage-page-data"

type ServicesTableProps = {
  services: ServicesPageData["services"]
}

export function ServicesTable({ services }: ServicesTableProps) {
  return (
    <Card className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className={tableHeadLeftClass}>Service ID</TableHead>
              <TableHead className={tableHeadLeftClass}>
                Service Name
              </TableHead>
              <TableHead className={tableHeadLeftClass}>Category</TableHead>
              <TableHead className={tableHeadLeftClass}>Duration</TableHead>
              <TableHead className={tableHeadLeftClass}>Price</TableHead>
              <TableHead className={tableHeadLeftClass}>Bookings</TableHead>
              <TableHead className={tableHeadLeftClass}>Status</TableHead>
              <TableHead className={tableHeadLeftClass}>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} className={tableRowClass}>
                <TableCell className={tableCellMutedClass}>
                  <span className="font-medium text-primary">
                    {service.id}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {service.name}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {service.category}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {service.duration}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <span className="font-semibold text-foreground">
                    {service.price}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {service.bookings}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <Badge
                    className={`rounded-full px-2 py-1 text-xs font-medium ${service.statusClass}`}
                  >
                    {service.status}
                  </Badge>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
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
  )
}
