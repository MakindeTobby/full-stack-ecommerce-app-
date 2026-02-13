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
  const session: Session | null = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <AppShell>
        <div className="qb-page">
          <PageHeader title="My Orders" />
          <div className="qb-card bg-yellow-50">
            <p>
              Please{" "}
              <Link href="/signin" className="text-blue-600">
                sign in
              </Link>{" "}
              to view your orders.
            </p>
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
      <div className="qb-page">
        <PageHeader title="My Orders" />
        {rows.length === 0 ? (
          <div className="qb-card text-gray-500">No recent orders.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link
                key={String(r.id)}
                href={`/order/${String(r.id)}`}
                className="block rounded-xl border border-black/10 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{String(r.id)}</div>
                    <div className="text-sm text-gray-500">
                      Placed{" "}
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      ${Number(r.total_amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {r.status} | {r.payment_status}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            <div className="qb-card mt-2 flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)} |
                Total {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/orders?page=${Math.max(1, pagination.page - 1)}`}
                  className={`rounded border px-3 py-2 ${
                    pagination.hasPrev
                      ? "border-black/20 hover:bg-gray-50"
                      : "pointer-events-none border-black/10 text-gray-400"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/orders?page=${pagination.page + 1}`}
                  className={`rounded border px-3 py-2 ${
                    pagination.hasNext
                      ? "border-black/20 hover:bg-gray-50"
                      : "pointer-events-none border-black/10 text-gray-400"
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
