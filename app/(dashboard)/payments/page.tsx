import { PaymentsPage } from "@/components/payments/payments-page";
import { getBusinessPaymentHistory } from "@/lib/payments.server";

export default async function PaymentsRoutePage() {
  const payments = await getBusinessPaymentHistory();
  return <PaymentsPage payments={payments} />;
}
