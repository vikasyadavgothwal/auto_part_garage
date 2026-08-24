"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type {
  PaymentHistoryFilters,
  PaymentHistoryItem,
  PaymentHistoryPagination,
} from "@/lib/payments.server";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const formatDate = (value: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : dateFormatter.format(date);
};

const moneyText = (amount: number, currency = "AED") =>
  `${currency} ${(amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusClass = (status: string) =>
  status === "succeeded"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
    : status === "failed"
      ? "border-red-500/30 bg-red-500/10 text-red-500"
      : "border-amber-500/30 bg-amber-500/10 text-amber-500";

const purposeText = (purpose: string) =>
  purpose.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseFilterDate = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const filterDateLabel = (range: DateRange | undefined) => {
  if (!range?.from) return "Select date range";
  if (!range.to) return formatDate(range.from.toISOString());
  return `${formatDate(range.from.toISOString())} - ${formatDate(range.to.toISOString())}`;
};

const pageHref = (
  pathname: string,
  filters: PaymentHistoryFilters,
  page: number,
) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `${pathname}?${params.toString()}`;
};

export function PaymentsPage({
  paymentsData,
  filters,
}: {
  paymentsData: {
    payments: PaymentHistoryItem[];
    pagination: PaymentHistoryPagination;
  };
  filters: PaymentHistoryFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { payments, pagination } = paymentsData;
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: parseFilterDate(filters.from),
    to: parseFilterDate(filters.to),
  }));
  const hasDateFilter = Boolean(filters.from || filters.to);
  const rangeStart = pagination.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const applyDateFilter = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (range?.from) params.set("from", isoDate(range.from));
    if (range?.to) params.set("to", isoDate(range.to));
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearDateFilter = () => {
    setRange(undefined);
    router.push(pathname);
  };

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Payment History</h1>
        <p className="text-muted-foreground">
          Plan and add-on payment attempts, including failed Stripe payments.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              Newest payments are shown first.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-9 min-w-64 justify-start text-left font-normal",
                    !range?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {filterDateLabel(range)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                  className="rounded-xl"
                />
                <div className="flex items-center justify-end gap-2 border-t border-border p-3">
                  <Button type="button" variant="ghost" onClick={clearDateFilter}>
                    Clear
                  </Button>
                  <Button type="button" onClick={applyDateFilter}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {hasDateFilter ? (
              <Button type="button" variant="ghost" onClick={clearDateFilter}>
                Reset
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {payments.length ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell className="font-medium">{payment.publicId}</TableCell>
                      <TableCell className="max-w-md whitespace-normal">
                        <p>{payment.description}</p>
                        {payment.failureMessage ? (
                          <p className="mt-1 text-xs text-red-400">{payment.failureMessage}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{purposeText(payment.purpose)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {moneyText(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClass(payment.status)}>
                          {payment.statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {rangeStart}-{rangeEnd} of {pagination.total} payments
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page <= 1}
                    asChild={pagination.page > 1}
                  >
                    {pagination.page > 1 ? (
                      <a href={pageHref(pathname, filters, pagination.page - 1)}>Previous</a>
                    ) : (
                      "Previous"
                    )}
                  </Button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.totalPages}
                    asChild={pagination.page < pagination.totalPages}
                  >
                    {pagination.page < pagination.totalPages ? (
                      <a href={pageHref(pathname, filters, pagination.page + 1)}>Next</a>
                    ) : (
                      "Next"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No payment history yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
