import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import { mobileViewAllClass, trendSectionClass, trendTitleClass } from "@/styles";

interface TrendingProps {
  featured: {
    id: string;
    slug: string;
    name_en: string;
    base_price: string;
    category_slug: string | null;
    category_name: string | null;
    image_url: unknown;
  }[];
  flashMap: Record<string, { price: number; activeFlash: { ends_at?: string | null } | null }>;
}

export default function Trending({ featured, flashMap }: TrendingProps) {
  return (
    <section className={trendSectionClass} id="trendSection">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="sec-label mb-2">Editor's Picks</div>
          <h2 className={trendTitleClass} id="trendTitle">
            Trending right now
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-700 sm:flex"
        >
          View all
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" id="productGrid">
        {featured.map((r, idx) => {
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
                    : "delay-4";

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

      <div className="mt-6 flex justify-center sm:hidden">
        <Link href="/products" className={mobileViewAllClass} id="mobileViewAll">
          View all products
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
