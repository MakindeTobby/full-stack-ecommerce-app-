// app/products/page.tsx

import Image from "next/image";
import Link from "next/link";
import FlashCountdown from "@/components/FlashCountdown";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";
import {
  getStoreCategoriesWithCounts,
  getStoreProductsPage,
} from "@/lib/db/queries/product";
import { resolveFlashPricesForProducts } from "@/lib/pricing/resolveFlashPrice";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const categoryRaw = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const minPriceRaw = Array.isArray(sp.minPrice) ? sp.minPrice[0] : sp.minPrice;
  const maxPriceRaw = Array.isArray(sp.maxPrice) ? sp.maxPrice[0] : sp.maxPrice;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const category = (categoryRaw ?? "").trim() || undefined;
  const q = (qRaw ?? "").trim() || undefined;
  const minPriceInput = (minPriceRaw ?? "").trim();
  const maxPriceInput = (maxPriceRaw ?? "").trim();
  const minPrice = minPriceInput === "" ? Number.NaN : Number(minPriceInput);
  const maxPrice = maxPriceInput === "" ? Number.NaN : Number(maxPriceInput);
  const minPriceValue =
    Number.isFinite(minPrice) && minPrice >= 0 ? minPrice : undefined;
  const maxPriceValue =
    Number.isFinite(maxPrice) && maxPrice >= 0 ? maxPrice : undefined;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);
  const [{ rows, pagination, selectedCategory }, categories] =
    await Promise.all([
      getStoreProductsPage({
        page,
        pageSize: 24,
        categorySlug: category,
        q,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
      }),
      getStoreCategoriesWithCounts(),
    ]);
  const buildHref = (nextPage: number, nextCategory?: string) =>
    `/products?${new URLSearchParams({
      page: String(nextPage),
      ...(nextCategory ? { category: nextCategory } : {}),
      ...(q ? { q } : {}),
      ...(minPriceInput ? { minPrice: minPriceInput } : {}),
      ...(maxPriceInput ? { maxPrice: maxPriceInput } : {}),
    }).toString()}`;

  const productIds = rows.map((r) => String(r.id));
  const basePriceMap: Record<string, number> = {};
  for (const r of rows) {
    basePriceMap[String(r.id)] = Number(r.base_price ?? 0);
  }

  const flashMap = await resolveFlashPricesForProducts(
    productIds,
    basePriceMap,
  );
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  });

  return (
    <AppShell>
      <div className="qb-page">
        <PageHeader
          title="Shop"
          subtitle="Explore curated products and live promotions."
        />

        <form action="/products" method="GET" className="qb-card mb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name or SKU"
              className="rounded border border-black/15 px-3 py-2 text-sm"
            />
            <input
              name="minPrice"
              defaultValue={minPriceInput}
              inputMode="decimal"
              placeholder="Min price"
              className="rounded border border-black/15 px-3 py-2 text-sm"
            />
            <input
              name="maxPrice"
              defaultValue={maxPriceInput}
              inputMode="decimal"
              placeholder="Max price"
              className="rounded border border-black/15 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded border border-black/15 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Apply
              </button>
              <Link
                href="/products"
                className="rounded border border-black/10 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </Link>
            </div>
          </div>
        </form>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={buildHref(1)}
            className={`rounded-full border px-3 py-1 text-sm ${
              !selectedCategory
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-black/15 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref(1, c.slug)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedCategory?.slug === c.slug
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-black/15 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c.name} ({Number(c.product_count ?? 0)})
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {rows.map((r) => {
            const pid = String(r.id);
            const fm = flashMap[pid] ?? {
              price: Number(r.base_price ?? 0),
              activeFlash: null,
            };
            const displayPrice = Number(fm.price ?? r.base_price ?? 0);
            const basePrice = Number(r.base_price ?? 0);
            const activeFlash = fm.activeFlash;

            return (
              <Link
                key={pid}
                href={`/products/${r.slug}`}
                className="block overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-56 items-center justify-center bg-gray-100">
                  {activeFlash && (
                    <div className="absolute left-3 top-3 z-10">
                      <span className="inline-block rounded bg-red-600 px-2 py-1 text-xs text-white">
                        Flash
                      </span>
                    </div>
                  )}

                  {r.image_url ? (
                    <Image
                      src={String(r.image_url)}
                      alt={r.name_en}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>

                <div className="p-3">
                  <div className="truncate text-sm font-medium">
                    {r.name_en}
                  </div>

                  <div className="mt-2 flex items-baseline gap-3">
                    <div
                      className={`text-lg font-bold ${
                        activeFlash ? "text-red-600" : ""
                      }`}
                    >
                      {currency.format(displayPrice)}
                    </div>
                    {activeFlash && (
                      <div className="text-sm text-gray-400 line-through">
                        {currency.format(basePrice)}
                      </div>
                    )}
                  </div>

                  {activeFlash?.ends_at && (
                    <div className="mt-2">
                      <FlashCountdown endsAt={activeFlash.ends_at} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="qb-card mt-5 flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} |
            Total {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref(Math.max(1, pagination.page - 1), category)}
              className={`rounded border px-3 py-2 ${
                pagination.hasPrev
                  ? "border-black/20 hover:bg-gray-50"
                  : "pointer-events-none border-black/10 text-gray-400"
              }`}
            >
              Previous
            </Link>
            <Link
              href={buildHref(pagination.page + 1, category)}
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
    </AppShell>
  );
}
