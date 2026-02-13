import Link from "next/link";
import { db } from "@/db/server";
import { flash_sales } from "@/db/schema";

export default async function FlashSalesListPage() {
  const rows = await db.select().from(flash_sales).orderBy(flash_sales.starts_at);

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Flash sales</h1>
          <p className="text-sm text-slate-600">
            Create time-bound campaigns and assign product discounts.
          </p>
        </div>
        <Link
          href="/admin/promotions/flash-sales/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New flash sale
        </Link>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="admin-panel flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-slate-500">
                {new Date(r.starts_at).toLocaleString()} {"->"}{" "}
                {new Date(r.ends_at).toLocaleString()}
              </div>
            </div>
            <Link
              href={`/admin/promotions/flash-sales/${r.id}`}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Edit
            </Link>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="admin-panel text-sm text-slate-500">
            No flash sales configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
