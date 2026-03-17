import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ProductCard from "@/components/shop/ProductCard";
import {
  getStoreCategoriesWithCountsResult,
  getStoreProductsPage,
} from "@/lib/db/queries/product";
import { resolveFlashPricesForProducts } from "@/lib/pricing/resolveFlashPrice";
import ProductCard2 from "@/components/shop/ProductCard2";

const CATEGORY_SLUG_CANDIDATES = [
  "corporate-shoes",
  "men-corporate-shoes",
  "mens-corporate-shoes",
  "men-shoes",
];

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CorporateShoesPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageRaw ?? "1") || 1);

  const { rows: categories, dbUnavailable: categoriesUnavailable } =
    await getStoreCategoriesWithCountsResult();

  if (categoriesUnavailable) {
    return (
      <AppShell>
        <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Service Unavailable
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Catalog connection is temporarily unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              We could not connect to the product service. Please retry in a moment.
            </p>
            <div className="mt-4">
              <Link
                href="/corporate-shoes"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Retry
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const availableSlugs = new Set(categories.map((c) => String(c.slug)));
  const resolvedCategorySlug =
    CATEGORY_SLUG_CANDIDATES.find((slug) => availableSlugs.has(slug)) ?? null;

  if (!resolvedCategorySlug) {
    return (
      <AppShell>
        <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Niche Setup Required
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Corporate shoes category not found
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              Create a category with slug <code>corporate-shoes</code> (recommended), then
              assign products to it.
            </p>
            <div className="mt-4">
              <Link
                href="/products"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Back to all products
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const {
    rows,
    pagination,
    selectedCategory,
    dbUnavailable: productsUnavailable,
  } = await getStoreProductsPage({
    page,
    pageSize: 24,
    categorySlug: resolvedCategorySlug,
  });

  if (productsUnavailable) {
    return (
      <AppShell>
        <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Service Unavailable
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Product feed is temporarily unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              We could not load products from the database. Please retry.
            </p>
            <div className="mt-4">
              <Link
                href="/corporate-shoes"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Retry
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const productIds = rows.map((r) => String(r.id));
  const basePriceMap: Record<string, number> = {};
  for (const r of rows) {
    basePriceMap[String(r.id)] = Number(r.base_price ?? 0);
  }

  const flashMap = await resolveFlashPricesForProducts(productIds, basePriceMap);

  const buildHref = (nextPage: number) =>
    `/corporate-shoes?${new URLSearchParams({ page: String(nextPage) }).toString()}`;

  return (
    <AppShell>
      <div className="mx-auto my-4 max-w-7xl px-4 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Specialty Store</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Men Corporate Shoes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            Clean, professional shoes curated for office, events, and everyday executive wear.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {selectedCategory?.name ?? "Corporate Shoes"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">{pagination.total} products</span>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
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
              <ProductCard2
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
              />
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref(Math.max(1, pagination.page - 1))}
              className={`rounded-lg border px-3 py-2 ${pagination.hasPrev
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "pointer-events-none border-slate-100 text-slate-400"
                }`}
            >
              Previous
            </Link>
            <Link
              href={buildHref(pagination.page + 1)}
              className={`rounded-lg border px-3 py-2 ${pagination.hasNext
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "pointer-events-none border-slate-100 text-slate-400"
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
