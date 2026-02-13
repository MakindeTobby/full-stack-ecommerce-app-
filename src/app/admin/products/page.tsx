import Link from "next/link";
import {
  getAdminProductsPage,
  getAllCategories,
} from "@/lib/db/queries/product";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await searchParams) ?? {};
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const categoryRaw = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const statusRaw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const q = (qRaw ?? "").trim();
  const category = (categoryRaw ?? "").trim();
  const status =
    statusRaw === "published" || statusRaw === "draft" ? statusRaw : "all";
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);

  const [{ rows, pagination }, categories] = await Promise.all([
    getAdminProductsPage({
      q,
      page,
      pageSize: 20,
      categorySlug: category || undefined,
      status,
    }),
    getAllCategories(),
  ]);

  const buildHref = (nextPage: number) =>
    `/admin/products?${new URLSearchParams({
      page: String(nextPage),
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...(status !== "all" ? { status } : {}),
    }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">All products</h2>
          <p className="text-sm text-slate-600">
            Browse and edit published and draft products.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New product
        </Link>
      </div>

      <form action="/admin/products" method="GET" className="admin-panel">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or slug"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="category"
            defaultValue={category}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Apply
            </button>
            <Link
              href="/admin/products"
              className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      <div className="admin-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {r.name_en}
                    </div>
                    <div className="text-xs text-slate-500">{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${Number(r.base_price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.category_name ?? "Uncategorized"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        r.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.created_at
                      ? new Date(String(r.created_at)).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${r.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Edit
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
                    No products found.
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
            href={buildHref(Math.max(1, pagination.page - 1))}
            className={`rounded border px-3 py-2 ${
              pagination.hasPrev
                ? "border-slate-300 hover:bg-slate-50"
                : "pointer-events-none border-slate-200 text-slate-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildHref(pagination.page + 1)}
            className={`rounded border px-3 py-2 ${
              pagination.hasNext
                ? "border-slate-300 hover:bg-slate-50"
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
