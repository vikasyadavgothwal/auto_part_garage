import { PaymentsPage } from "@/components/payments/payments-page";
import { getBusinessPaymentHistory, refreshPaymentReturn } from "@/lib/payments.server";

type PaymentsRoutePageProps = {
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    payment?: string;
    session_id?: string;
  }>;
};

const positiveInt = (value: string | undefined, fallback = 1) => {
  const number = Number.parseInt(value ?? "", 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const dateParam = (value: string | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

export default async function PaymentsRoutePage({
  searchParams,
}: PaymentsRoutePageProps) {
  const params = await searchParams;
  const filters = {
    page: positiveInt(params.page),
    pageSize: 10,
    from: dateParam(params.from),
    to: dateParam(params.to),
  };
  const paymentStatus = await refreshPaymentReturn(params.session_id, params.payment);
  const paymentsData = await getBusinessPaymentHistory(filters);
  return <PaymentsPage paymentsData={paymentsData} filters={filters} paymentStatus={paymentStatus} />;
}
