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

  const buildFilterHref = (opts: {
    page?: number;
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? page));
    const nextCategory = opts.category ?? category;
    const nextQuery = opts.q ?? q;
    const nextMin = opts.minPrice ?? minPriceInput;
    const nextMax = opts.maxPrice ?? maxPriceInput;
    if (nextCategory) params.set("category", nextCategory);
    if (nextQuery) params.set("q", nextQuery);
    if (nextMin) params.set("minPrice", nextMin);
    if (nextMax) params.set("maxPrice", nextMax);
    return `/products?${params.toString()}`;
  };

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

  const hasFilters =
    !!selectedCategory ||
    !!q ||
    minPriceInput.trim().length > 0 ||
    maxPriceInput.trim().length > 0;

  return (
    <AppShell>
      <div className="qb-page">
        <PageHeader
          title="Shop"
          subtitle="Explore curated products and live promotions."
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <form
              action="/products"
              method="GET"
              className="qb-filter-panel space-y-5 lg:sticky lg:top-24"
            >
              <div className="qb-filter-header">
                <div>
                  <div className="qb-filter-kicker">Curated</div>
                  <div className="qb-filter-title">Refine the shop</div>
                </div>
                <span className="qb-filter-badge">Premium</span>
              </div>
              <input
                type="hidden"
                name="category"
                value={selectedCategory?.slug ?? ""}
              />
              <div>
                <div className="qb-filter-section-title">
                  Search
                </div>
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Product name or SKU"
                  className="qb-filter-input mt-2 w-full"
                />
              </div>

              <div>
                <div className="qb-filter-section-title">
                  Price range
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    name="minPrice"
                    defaultValue={minPriceInput}
                    inputMode="decimal"
                    placeholder="Min"
                    className="qb-filter-input"
                  />
                  <input
                    name="maxPrice"
                    defaultValue={maxPriceInput}
                    inputMode="decimal"
                    placeholder="Max"
                    className="qb-filter-input"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={buildFilterHref({
                      page: 1,
                      category: category ?? undefined,
                      minPrice: "",
                      maxPrice: "",
                    })}
                    className="qb-filter-chip"
                  >
                    Reset price
                  </Link>
                  <Link
                    href={buildFilterHref({
                      page: 1,
                      category: category ?? undefined,
                      minPrice: "",
                      maxPrice: "10000",
                    })}
                    className="qb-filter-chip"
                  >
                    Under 10k
                  </Link>
                  <Link
                    href={buildFilterHref({
                      page: 1,
                      category: category ?? undefined,
                      minPrice: "10000",
                      maxPrice: "30000",
                    })}
                    className="qb-filter-chip"
                  >
                    10k - 30k
                  </Link>
                </div>
              </div>

              <div>
                <div className="qb-filter-section-title">
                  Categories
                </div>
                <div className="mt-2 space-y-2">
                  <Link
                    href={buildHref(1)}
                    className={`qb-filter-row ${
                      !selectedCategory
                        ? "qb-filter-row-active"
                        : "qb-filter-row-idle"
                    }`}
                  >
                    <span>All</span>
                    <span className="text-xs">
                      {Number(
                        categories.reduce(
                          (acc, c) => acc + Number(c.product_count ?? 0),
                          0,
                        ),
                      )}
                    </span>
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={buildHref(1, c.slug)}
                      className={`qb-filter-row ${
                        selectedCategory?.slug === c.slug
                          ? "qb-filter-row-active"
                          : "qb-filter-row-idle"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs">
                        {Number(c.product_count ?? 0)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="qb-filter-cta flex-1"
                >
                  Apply filters
                </button>
                <Link
                  href="/products"
                  className="qb-filter-clear"
                >
                  Clear
                </Link>
              </div>
            </form>
          </aside>

          <section className="space-y-4">
            <div className="qb-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedCategory?.name ?? "All products"}
                </div>
                <div className="text-xs text-gray-500">
                  {q ? `Results for "${q}" · ` : ""}
                  {pagination.total} items
                </div>
              </div>
              {hasFilters ? (
                <Link
                  href="/products"
                  className="rounded-full border border-black/10 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Clear all filters
                </Link>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                    className="qb-product-card group"
                  >
                    <div className="qb-product-frame">
                      <div className="qb-product-seal">
                        <span>Seal</span>
                      </div>
                      {activeFlash && (
                        <div className="qb-product-ribbon">Flash</div>
                      )}
                      <div className="qb-product-image">
                        {r.image_url ? (
                          <Image
                            src={String(r.image_url)}
                            alt={r.name_en}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="text-gray-400">No image</div>
                        )}
                      </div>
                    </div>

                    <div className="qb-product-body">
                      <div className="qb-product-ink">
                        {r.category_name ?? "Collection"}
                      </div>
                      <div className="qb-product-title">{r.name_en}</div>

                      <div className="qb-product-price-row">
                        <div
                          className={`qb-product-price ${
                            activeFlash ? "qb-product-price-sale" : ""
                          }`}
                        >
                          {currency.format(displayPrice)}
                        </div>
                        {activeFlash && (
                          <div className="qb-product-price-old">
                            {currency.format(basePrice)}
                          </div>
                        )}
                      </div>

                      {activeFlash?.ends_at && (
                        <div className="mt-3">
                          <FlashCountdown endsAt={activeFlash.ends_at} />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="qb-card flex items-center justify-between text-sm">
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
          </section>
        </div>
      </div>
    </AppShell>
  );
}
