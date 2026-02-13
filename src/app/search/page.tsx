import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";
import { getStoreProductsPage } from "@/lib/db/queries/product";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const q = (qRaw ?? "").trim();
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);

  const { rows, pagination } = await getStoreProductsPage({
    page,
    pageSize: 24,
    q: q || undefined,
  });

  return (
    <AppShell>
      <div className="qb-page">
        <PageHeader title="Search" subtitle="Find products by name or SKU." />

        <form action="/search" method="GET" className="qb-card mb-4">
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Type name or SKU..."
              className="flex-1 rounded border border-black/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded border border-black/15 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Search
            </button>
          </div>
        </form>

        {!q ? (
          <div className="qb-card text-sm text-gray-600">
            Enter a search term to see results.
          </div>
        ) : rows.length === 0 ? (
          <div className="qb-card text-sm text-gray-600">
            No products found for "{q}".
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link
                key={String(r.id)}
                href={`/products/${r.slug}`}
                className="block rounded border border-black/10 bg-white p-3 hover:bg-gray-50"
              >
                <div className="font-medium">{r.name_en}</div>
                <div className="text-sm text-gray-600">
                  ${Number(r.base_price ?? 0).toFixed(2)}
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
                  href={`/search?${new URLSearchParams({
                    q,
                    page: String(Math.max(1, pagination.page - 1)),
                  }).toString()}`}
                  className={`rounded border px-3 py-2 ${
                    pagination.hasPrev
                      ? "border-black/20 hover:bg-gray-50"
                      : "pointer-events-none border-black/10 text-gray-400"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/search?${new URLSearchParams({
                    q,
                    page: String(pagination.page + 1),
                  }).toString()}`}
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
