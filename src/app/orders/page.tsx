// app/orders/page.tsx
import Link from "next/link";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";
import { getUserOrdersPage } from "@/lib/db/queries/orders";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrdersListPage({ searchParams }: Props) {
  const money = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });

  const session: Session | null = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
            <PageHeader title="My Orders" subtitle="Track order status and payment updates." />
          </section>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please{" "}
            <Link href="/signin" className="font-semibold text-amber-900 underline">
              sign in
            </Link>{" "}
            to view your orders.
          </div>
        </div>
      </AppShell>
    );
  }

  const userId = session.user.id as string;
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const { rows, pagination } = await getUserOrdersPage(userId, {
    page,
    pageSize: 20,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
          <PageHeader title="My Orders" subtitle="Track your purchases and open any order for details." />
        </section>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No recent orders.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link
                key={String(r.id)}
                href={`/order/${String(r.id)}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">
                        Order #{String(r.id)}
                      </div>
                      <StatusBadge status={String(r.status ?? "pending")} />
                      <PaymentBadge status={String(r.payment_status ?? "unpaid")} />
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Placed{" "}
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {money.format(Number(r.total_amount ?? 0))}
                    </div>
                    <div className="mt-1 text-xs text-violet-600">View details</div>
                  </div>
                </div>
              </Link>
            ))}

            <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <div className="text-slate-600">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{" "}
                {pagination.total} order{pagination.total === 1 ? "" : "s"}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/orders?page=${Math.max(1, pagination.page - 1)}`}
                  className={`rounded-lg border px-3 py-2 ${
                    pagination.hasPrev
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "pointer-events-none border-slate-100 text-slate-400"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/orders?page=${pagination.page + 1}`}
                  className={`rounded-lg border px-3 py-2 ${
                    pagination.hasNext
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "pointer-events-none border-slate-100 text-slate-400"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const isPositive = value === "delivered" || value === "shipped" || value === "processing";
  const isNegative = value === "cancelled" || value === "failed";
  const cls = isNegative
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : isPositive
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const cls =
    value === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${cls}`}>
      {status}
    </span>
  );
}
