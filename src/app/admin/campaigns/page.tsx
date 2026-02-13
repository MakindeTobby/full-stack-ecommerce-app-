import { format } from "date-fns";
import Link from "next/link";
import { getCampaignsPage } from "@/lib/db/queries/campaigns";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminCampaignsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const { rows, pagination } = await getCampaignsPage({
    page,
    pageSize: 12,
  });

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Campaigns</h1>
          <p className="text-sm text-slate-600">
            Manage popups, banners, and flash strips with scheduling and caps.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New campaign
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="admin-panel text-sm text-slate-500">
          No campaigns yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="admin-panel flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {r.title}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {r.type}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {r.audience}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{r.name}</div>
                <div className="text-xs text-slate-500">
                  {formatWindow(r.start_at, r.end_at)} | Priority {r.priority} |{" "}
                  Delay {r.trigger_delay_seconds ?? 0}s | {r.frequency_mode}
                  {r.frequency_mode === "max_total" && r.frequency_max_total
                    ? ` (${r.frequency_max_total})`
                    : ""}
                </div>
              </div>
              <Link
                href={`/admin/campaigns/${r.id}`}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="admin-panel flex items-center justify-between text-sm">
        <div className="text-slate-600">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)} | Total{" "}
          {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/campaigns?page=${Math.max(1, pagination.page - 1)}`}
            className={`rounded border px-3 py-2 ${
              pagination.hasPrev
                ? "border-slate-300 text-slate-800 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/campaigns?page=${pagination.page + 1}`}
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

function formatWindow(startAt: Date | null, endAt: Date | null) {
  const start = startAt ? format(new Date(startAt), "yyyy-MM-dd HH:mm") : "now";
  const end = endAt ? format(new Date(endAt), "yyyy-MM-dd HH:mm") : "no end";
  return `${start} -> ${end}`;
}
