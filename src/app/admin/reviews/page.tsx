import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPendingReviewsPage,
  setReviewModerationStatus,
} from "@/lib/db/queries/reviews";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const { rows, pagination } = await getPendingReviewsPage({
    page,
    pageSize: 20,
  });

  async function approveAction(formData: FormData) {
    "use server";
    const reviewId = String(formData.get("reviewId") ?? "").trim();
    if (!reviewId) return;
    await setReviewModerationStatus({ reviewId, status: "approved" });
    redirect(`/admin/reviews?page=${page}`);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const reviewId = String(formData.get("reviewId") ?? "").trim();
    if (!reviewId) return;
    await setReviewModerationStatus({ reviewId, status: "rejected" });
    redirect(`/admin/reviews?page=${page}`);
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel">
        <h1 className="text-xl font-semibold">Review moderation</h1>
        <p className="text-sm text-slate-600">
          Approve or reject pending customer reviews.
        </p>
      </div>

      <div className="admin-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={String(r.id)}
                  className="border-t border-slate-100 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {r.product_name}
                    </div>
                    <Link
                      href={`/products/${r.product_slug}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View product
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {r.user_name ?? "Customer"}
                    </div>
                    <div className="text-xs text-slate-500">{r.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.rating}/5</div>
                    {r.is_verified_purchase && (
                      <div className="text-xs text-emerald-700">
                        Verified purchase
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.title && (
                      <div className="font-medium text-slate-900">
                        {r.title}
                      </div>
                    )}
                    {r.body && <p className="mt-1 text-slate-700">{r.body}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.created_at
                      ? new Date(String(r.created_at)).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={approveAction}>
                        <input
                          type="hidden"
                          name="reviewId"
                          value={String(r.id)}
                        />
                        <button
                          type="submit"
                          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectAction}>
                        <input
                          type="hidden"
                          name="reviewId"
                          value={String(r.id)}
                        />
                        <button
                          type="submit"
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No pending reviews.
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
            href={`/admin/reviews?page=${Math.max(1, pagination.page - 1)}`}
            className={`rounded border px-3 py-2 ${
              pagination.hasPrev
                ? "border-slate-300 text-slate-800 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/reviews?page=${pagination.page + 1}`}
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
