import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  getStoreCategoriesWithCountsResult,
  getStoreProductsPage,
} from "@/lib/db/queries/product";
import { resolveFlashPricesForProducts } from "@/lib/pricing/resolveFlashPrice";
import Hero from "@/components/home/Hero";
import Category from "@/components/home/Category";
import FlashSaleBanner from "@/components/home/FlashSaleBanner";
import Trending from "@/components/home/Trending";
import Banner from "@/components/home/Banner";
import Badges from "@/components/home/Badges";
import Reviews from "@/components/home/Reviews";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/home/Footer";
import WhatsappIcon from "@/components/shared/WhatsappIcon";

export default async function Home() {
  const [productsResult, categoriesResult] = await Promise.all([
    getStoreProductsPage({ page: 1, pageSize: 6 }),
    getStoreCategoriesWithCountsResult(),
  ]);

  const featured = productsResult.rows;
  const categories = categoriesResult.rows;
  const dbUnavailable =
    productsResult.dbUnavailable || categoriesResult.dbUnavailable;

  const productIds = featured.map((r) => String(r.id));
  const basePriceMap: Record<string, number> = {};
  for (const r of featured) {
    basePriceMap[String(r.id)] = Number(r.base_price ?? 0);
  }

  const flashMap = await resolveFlashPricesForProducts(productIds, basePriceMap);

  return (
    <AppShell>
      <div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Hero />
        </div>

        {dbUnavailable ? (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>Catalog is temporarily unavailable. Please retry in a moment.</p>
                <Link
                  href="/"
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  Retry
                </Link>
              </div>
            </section>
          </div>
        ) : null}

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <section className="my-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              New Niche Experience
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Men Corporate Shoes Store</h2>
                <p className="mt-1 text-sm text-slate-200">
                  Explore formal shoes only, with a focused buying experience.
                </p>
              </div>
              <Link
                href="/corporate-shoes"
                className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Enter Corporate Shoes
              </Link>
            </div>
          </section>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Category categories={categories} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FlashSaleBanner />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Trending featured={featured} flashMap={flashMap} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Banner />
        </div>

        <Badges />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reviews />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Newsletter />
        </div>
      </div>

      <Footer />
      <WhatsappIcon href="https://wa.me/2348033333333" />
    </AppShell>
  );
}
