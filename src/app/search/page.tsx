import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import SearchBox from "@/components/search/SearchBox";
import SearchRecents from "@/components/search/SearchRecents";
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
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  });

  return (
    <AppShell>
      <div className="qb-page">
        <PageHeader title="Search" subtitle="Find products by name or SKU." />

        <div className="qb-card">
          <SearchBox
            initialQuery={q}
            placeholder="Search the full catalog..."
            variant="page"
            showRecent
          />
        </div>
        <SearchRecents query={q} />

        {!q ? (
          <div className="qb-card text-sm text-gray-600">
            Enter a search term to see results. Recent searches appear as you
            focus the input.
          </div>
        ) : rows.length === 0 ? (
          <div className="qb-card text-sm text-gray-600">
            No products found for "{q}".
          </div>
        ) : (
          <div className="space-y-4">
            <div className="qb-card flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)} |
                Total {pagination.total}
              </div>
              <div className="text-gray-500">Results for "{q}"</div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <Link
                  key={String(r.id)}
                  href={`/products/${r.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative flex h-44 items-center justify-center bg-gray-100">
                    {r.image_url ? (
                      <Image
                        src={String(r.image_url)}
                        alt={r.name_en}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="truncate text-base font-semibold text-gray-900">
                      {r.name_en}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {currency.format(Number(r.base_price ?? 0))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

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
