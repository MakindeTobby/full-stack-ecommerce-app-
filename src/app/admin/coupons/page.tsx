import { format } from "date-fns";
import Link from "next/link";
import { getCouponsPage } from "@/lib/db/queries/coupons";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminCouponsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const { rows, pagination } = await getCouponsPage({
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Coupons</h1>
          <p className="text-sm text-slate-600">
            Manage discount codes and redemption behavior.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create coupon
        </Link>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="admin-panel text-sm text-slate-500">
            No coupons yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="admin-panel flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="text-lg font-semibold">{r.code}</div>
                <div className="text-sm text-slate-600">
                  {r.description ?? "No description"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.discount_type === "percent"
                    ? `${Number(r.discount_value)}% off`
                    : `$${Number(r.discount_value).toFixed(2)} off`}{" "}
                  | Created{" "}
                  {format(new Date(String(r.created_at)), "yyyy-MM-dd")}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    r.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.active ? "Active" : "Inactive"}
                </span>

                <Link
                  href={`/admin/coupons/${r.id}`}
                  className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="admin-panel flex items-center justify-between text-sm">
        <div className="text-slate-600">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)} | Total{" "}
          {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/coupons?page=${Math.max(1, pagination.page - 1)}`}
            className={`rounded border px-3 py-2 ${
              pagination.hasPrev
                ? "border-slate-300 text-slate-800 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/coupons?page=${pagination.page + 1}`}
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
