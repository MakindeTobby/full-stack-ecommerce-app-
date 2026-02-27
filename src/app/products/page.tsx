// app/products/page.tsx

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import MobileFiltersDrawer from "@/components/shop/MobileFiltersDrawer";
import ProductCard from "@/components/shop/ProductCard";
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

  const hasFilters =
    !!selectedCategory ||
    !!q ||
    minPriceInput.trim().length > 0 ||
    maxPriceInput.trim().length > 0;
  const selectedCategorySlug =
    selectedCategory && typeof selectedCategory === "object"
      ? String((selectedCategory as { slug?: unknown }).slug ?? "")
      : undefined;

  const totalCategoryItems = categories.reduce(
    (acc, c) => acc + Number(c.product_count ?? 0),
    0,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 my-4" >
        <section className="rounded-xl my-4 border border-black/10 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
          <div className="flex flex-wrap  items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">
                Shop
              </p>
              <h1 className="font-display mt-1 text-3xl text-slate-900 md:text-4xl">
                Curated Collection
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {q ? `Searching "${q}" in ` : ""}
                {selectedCategory?.name ?? "All categories"}.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-slate-600">
              <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
              {pagination.total} products
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="hidden space-y-4 lg:block">
            <form
              action="/products"
              method="GET"
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
            >
              <input
                type="hidden"
                name="category"
                value={selectedCategory?.slug ?? ""}
              />

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Search
                </p>
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Price range
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="minPrice"
                    defaultValue={minPriceInput}
                    inputMode="decimal"
                    placeholder="Min"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                  <input
                    name="maxPrice"
                    defaultValue={maxPriceInput}
                    inputMode="decimal"
                    placeholder="Max"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={buildFilterHref({
                      page: 1,
                      category: category ?? undefined,
                      minPrice: "",
                      maxPrice: "10000",
                    })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
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
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    10k - 30k
                  </Link>
                  <Link
                    href={buildFilterHref({
                      page: 1,
                      category: category ?? undefined,
                      minPrice: "30000",
                      maxPrice: "100000",
                    })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    30k - 100k
                  </Link>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Categories
                </p>
                <div className="space-y-1">
                  <Link
                    href={buildHref(1)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${!selectedCategory
                      ? "bg-violet-600 font-medium text-white"
                      : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <span>All Products</span>
                    <span>{totalCategoryItems}</span>
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={buildHref(1, c.slug)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${selectedCategory?.slug === c.slug
                        ? "bg-violet-600 font-medium text-white"
                        : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span>{c.name}</span>
                      <span>{Number(c.product_count ?? 0)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Apply
                </button>
                <Link
                  href="/products"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </Link>
              </div>
            </form>
          </aside>

          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {rows.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.total}
                  </span>{" "}
                  results
                </div>
                {hasFilters ? (
                  <div className="flex items-center gap-2">
                    <MobileFiltersDrawer
                      page={page}
                      category={category}
                      q={q}
                      minPriceInput={minPriceInput}
                      maxPriceInput={maxPriceInput}
                      selectedCategorySlug={selectedCategorySlug}
                      categories={categories.map((c) => ({
                        id: String(c.id),
                        name: String(c.name),
                        slug: String(c.slug),
                        product_count: Number(c.product_count ?? 0),
                      }))}
                    />
                    <Link
                      href="/products"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      Clear all filters
                    </Link>
                  </div>
                ) : null}
                {!hasFilters ? (
                  <MobileFiltersDrawer
                    page={page}
                    category={category}
                    q={q}
                    minPriceInput={minPriceInput}
                    maxPriceInput={maxPriceInput}
                    selectedCategorySlug={selectedCategorySlug}
                    categories={categories.map((c) => ({
                      id: String(c.id),
                      name: String(c.name),
                      slug: String(c.slug),
                      product_count: Number(c.product_count ?? 0),
                    }))}
                  />
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3" id="productGrid">
              {rows.map((r, idx) => {
                const pid = String(r.id);
                const fm = flashMap[pid] ?? {
                  price: Number(r.base_price ?? 0),
                  activeFlash: null,
                };
                const displayPrice = Number(fm.price ?? r.base_price ?? 0);
                const basePrice = Number(r.base_price ?? 0);
                const activeFlash = fm.activeFlash;
                const delayCls =
                  idx === 0
                    ? ""
                    : idx === 1
                      ? "delay-1"
                      : idx === 2
                        ? "delay-2"
                        : idx === 3
                          ? "delay-3"
                          : idx === 4
                            ? "delay-4"
                            : idx === 5
                              ? "delay-5"
                              : idx === 6
                                ? "delay-6"
                                : idx === 7
                                  ? "delay-7"
                                  : idx === 8
                                    ? "delay-8"
                                    : idx === 9
                                      ? "delay-9"
                                      : idx === 10
                                        ? "delay-10"
                                        : idx === 11
                                          ? "delay-11"
                                          : "delay-12";


                return (
                  <ProductCard
                    key={pid}
                    id={pid}
                    slug={r.slug}
                    name={r.name_en}
                    categoryName={r.category_name}
                    imageUrl={r.image_url ? String(r.image_url) : null}
                    price={displayPrice}
                    compareAtPrice={activeFlash ? basePrice : null}
                    flashEndsAt={activeFlash?.ends_at ?? null}
                    isFlash={Boolean(activeFlash)}
                    className={`fade-up ${delayCls}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="text-slate-600">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={buildHref(Math.max(1, pagination.page - 1), category)}
                  className={`rounded-lg border px-3 py-2 ${pagination.hasPrev
                    ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none border-slate-100 text-slate-400"
                    }`}
                >
                  Previous
                </Link>
                <Link
                  href={buildHref(pagination.page + 1, category)}
                  className={`rounded-lg border px-3 py-2 ${pagination.hasNext
                    ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none border-slate-100 text-slate-400"
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
