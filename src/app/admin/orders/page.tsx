import Link from "next/link";
import { getAdminOrdersPage } from "@/lib/db/queries/orders";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const { rows, pagination } = await getAdminOrdersPage({
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-4">
      <div className="admin-panel">
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-slate-600">
          Review order status, payment state, and customer records.
        </p>
      </div>

      <div className="admin-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={String(r.id)}
                  className="border-t border-slate-100 text-sm"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    #{String(r.id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {r.user_name ?? "Customer"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.user_email ?? "No email"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.currency ?? "NGN"}{" "}
                    {Number(r.total_amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 w-fit">
                        {r.status ?? "pending"}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 w-fit">
                        {r.payment_status ?? "unpaid"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.created_at
                      ? new Date(String(r.created_at)).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${String(r.id)}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-panel flex items-center justify-between text-sm">
        <div className="text-slate-600">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)} | Total{" "}
          {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders?page=${Math.max(1, pagination.page - 1)}`}
            className={`rounded border px-3 py-2 ${
              pagination.hasPrev
                ? "border-slate-300 text-slate-800 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/orders?page=${pagination.page + 1}`}
            className={`rounded border px-3 py-2 ${
              pagination.hasNext
                ? "border-slate-300 text-slate-800 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
