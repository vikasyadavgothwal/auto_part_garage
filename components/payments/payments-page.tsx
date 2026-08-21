import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaymentHistoryItem } from "@/lib/payments.server";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC", year: "numeric" });
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : dateFormatter.format(date);
};
const moneyText = (amount: number, currency = "AED") => `${currency} ${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusClass = (status: string) => status === "succeeded" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : status === "failed" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-amber-500/30 bg-amber-500/10 text-amber-500";
const purposeText = (purpose: string) => purpose.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function PaymentsPage({ payments }: { payments: PaymentHistoryItem[] }) {
  return <main className="space-y-6">
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">Payment History</h1>
      <p className="mt-2 text-sm text-muted-foreground">Plan and add-on payment attempts, including failed Stripe payments.</p>
    </section>
    <Card>
      <CardHeader><CardTitle>Payments</CardTitle><CardDescription>Stored from the backend payment ledger.</CardDescription></CardHeader>
      <CardContent>{payments.length ? <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell>{formatDate(payment.createdAt)}</TableCell><TableCell className="font-medium">{payment.publicId}</TableCell><TableCell className="max-w-md whitespace-normal"><p>{payment.description}</p>{payment.failureMessage ? <p className="mt-1 text-xs text-red-400">{payment.failureMessage}</p> : null}</TableCell><TableCell>{purposeText(payment.purpose)}</TableCell><TableCell className="text-right font-semibold">{moneyText(payment.amount, payment.currency)}</TableCell><TableCell><Badge variant="outline" className={statusClass(payment.status)}>{payment.statusLabel}</Badge></TableCell></TableRow>)}</TableBody></Table> : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No payment history yet.</p>}</CardContent>
    </Card>
  </main>;
}
