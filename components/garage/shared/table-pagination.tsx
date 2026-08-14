"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { appPath } from "@/lib/routes"
import type { PaginationMeta } from "@/lib/pagination"

type TablePaginationProps = {
  pagination: PaginationMeta
}

export function TablePagination({ pagination }: TablePaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const from = pagination.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total)

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(page))
    }
    params.set("pageSize", String(pagination.pageSize))
    const query = params.toString()
    return appPath(`${pathname}${query ? `?${query}` : ""}`)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {from}-{to} of {pagination.total}
      </p>
      <div className="flex items-center gap-2">
        {pagination.page <= 1 ? (
          <Button type="button" variant="outline" size="sm" disabled>
            Previous
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefFor(pagination.page - 1)}>Previous</Link>
          </Button>
        )}
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        {pagination.page >= pagination.totalPages ? (
          <Button type="button" variant="outline" size="sm" disabled>
            Next
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefFor(pagination.page + 1)}>Next</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
