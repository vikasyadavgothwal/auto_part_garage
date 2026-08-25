import { cookies } from "next/headers";

import { requestBackend } from "@/lib/auth/backend";

export type PaymentHistoryItem = {
  id: string;
  publicId: string;
  purpose: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  statusLabel: string;
  failureCode: string | null;
  failureMessage: string | null;
  entitySummary: string | null;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
};

export type PaymentHistoryPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaymentHistoryFilters = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
};

type PaymentHistoryPayload = {
  ok?: boolean;
  payments?: PaymentHistoryItem[];
  pagination?: PaymentHistoryPagination;
};

export type PaymentReturnStatus = "none" | "success" | "cancelled" | "pending" | "failed";

const emptyPaymentHistory = (filters: PaymentHistoryFilters = {}) => ({
  payments: [] as PaymentHistoryItem[],
  pagination: {
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 10,
    total: 0,
    totalPages: 1,
  },
});

const positiveInt = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;

export async function getBusinessPaymentHistory(filters: PaymentHistoryFilters = {}) {
  const cookieHeader = (await cookies()).toString();
  const page = positiveInt(filters.page, 1);
  const pageSize = Math.min(100, positiveInt(filters.pageSize, 10));
  const params = new URLSearchParams({
    scope: "business",
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const response = await requestBackend(`/api/v1/payments/history?${params.toString()}`, {
    cookieHeader,
  });
  if (!response.ok) return emptyPaymentHistory({ page, pageSize });
  const payload = (await response.json().catch(() => null)) as PaymentHistoryPayload | null;
  if (!payload?.ok || !Array.isArray(payload.payments)) {
    return emptyPaymentHistory({ page, pageSize });
  }
  return {
    payments: payload.payments,
    pagination: payload.pagination ?? emptyPaymentHistory({ page, pageSize }).pagination,
  };
}

export async function refreshPaymentReturn(sessionId?: string, payment?: string): Promise<PaymentReturnStatus> {
  if (payment === "cancelled") return "cancelled";
  if (payment !== "success") return "none";
  if (!sessionId) return "failed";
  const response = await requestBackend(`/api/v1/payments/${encodeURIComponent(sessionId)}/status`, {
    cookieHeader: (await cookies()).toString(),
  });
  if (!response.ok) return "failed";
  const payload = await response.json().catch(() => null) as { payment?: { status?: string } } | null;
  if (payload?.payment?.status === "succeeded") return "success";
  if (payload?.payment?.status === "failed") return "failed";
  return "failed";
}
