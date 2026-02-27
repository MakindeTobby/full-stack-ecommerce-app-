"use client";

import Image from "next/image";
import Link from "next/link";
import FlashCountdown from "@/components/FlashCountdown";
import { classNames, fmtNGN } from "@/helpers";

type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  categoryName?: string | null;
  imageUrl?: string | null;
  price: number;
  compareAtPrice?: number | null;
  flashEndsAt?: string | null;
  isFlash?: boolean;
  className?: string;
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80";

function deriveMeta(seedText: string) {
  const seed = [...seedText].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rating = (4.2 + (seed % 8) * 0.1).toFixed(1);
  const reviews = 40 + ((seed * 13) % 460);
  const sold = 120 + ((seed * 17) % 900);
  return { rating, reviews, sold };
}

export default function ProductCard({
  id,
  slug,
  name,
  categoryName,
  imageUrl,
  price,
  compareAtPrice,
  flashEndsAt,
  isFlash,
  className,
}: ProductCardProps) {
  const meta = deriveMeta(id + slug);
  const hasDiscount =
    typeof compareAtPrice === "number" && compareAtPrice > Number(price);
  const showFlash = Boolean(isFlash);

  return (
    <Link
      href={`/products/${slug}`}
      className={classNames(
        "product-card group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white",
        "hover:border-violet-300 hover:shadow-xl",
        className,
      )}
      id={`pc-${id}`}
    >
      <div className="relative h-56 overflow-hidden rounded-t-xl bg-slate-100">
        <Image
          src={imageUrl && imageUrl.trim() ? imageUrl : FALLBACK_IMG}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-[1.05]"
        />

        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {showFlash ? (
            <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Flash
            </span>
          ) : null}
          {!showFlash && hasDiscount ? (
            <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Sale
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
          Top rated
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {categoryName ?? "Collection"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {name}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 text-amber-500"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {meta.rating}
          </span>
          <span>({meta.reviews} reviews)</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {meta.sold}+ sold
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <p className={classNames("text-lg font-bold", showFlash ? "text-red-600" : "text-slate-900")}>
            {fmtNGN(Number(price))}
          </p>
          {hasDiscount ? (
            <p className="text-xs text-slate-400 line-through">
              {fmtNGN(Number(compareAtPrice))}
            </p>
          ) : null}
        </div>

        {flashEndsAt ? (
          <div className="mt-2">
            <FlashCountdown endsAt={flashEndsAt} />
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] font-medium text-emerald-700">
            Free delivery over N15,000
          </span>
          <span className="text-xs font-semibold text-violet-600">View details</span>
        </div>
      </div>
    </Link>
  );
}
