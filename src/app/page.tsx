import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getStoreCategoriesWithCounts, getStoreProductsPage } from "@/lib/db/queries/product";
import { resolveFlashPricesForProducts } from "@/lib/pricing/resolveFlashPrice";

export default async function Home() {
  const [{ rows: featured }, categories] = await Promise.all([
    getStoreProductsPage({ page: 1, pageSize: 6 }),
    getStoreCategoriesWithCounts(),
  ]);

  const productIds = featured.map((r) => String(r.id));
  const basePriceMap: Record<string, number> = {};
  for (const r of featured) {
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
        <section className="qb-card p-8 md:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
            Storefront
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Build your premium gift and accessory catalogue.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 md:text-base">
            Your backend flows are already in place. This pass aligns layout,
            spacing, and page structure so further beautification is faster and
            predictable.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Browse Products
            </Link>
            <Link
              href="/cart"
              className="rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-medium"
            >
              Open Cart
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Categories
              </div>
              <h2 className="mt-2 text-2xl font-semibold">Shop by theme</h2>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/products?${new URLSearchParams({
                  category: c.slug,
                }).toString()}`}
                className="qb-card group flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Number(c.product_count ?? 0)} items
                  </div>
                </div>
                <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] text-gray-600 group-hover:bg-gray-50">
                  Explore
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Featured
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                Seasonal highlights
              </h2>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Browse shop
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((r) => {
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
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
