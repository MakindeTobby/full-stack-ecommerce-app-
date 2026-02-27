"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  product_count: number | null;
};

type Props = {
  page: number;
  category?: string;
  q?: string;
  minPriceInput: string;
  maxPriceInput: string;
  selectedCategorySlug?: string;
  categories: Category[];
};

export default function MobileFiltersDrawer({
  page,
  category,
  q,
  minPriceInput,
  maxPriceInput,
  selectedCategorySlug,
  categories,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  const totalCategoryItems = useMemo(
    () => categories.reduce((acc, c) => acc + Number(c.product_count ?? 0), 0),
    [categories],
  );

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:hidden"
      >
        Filters
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          />

          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Filters</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
              >
                Close
              </button>
            </div>

            <form action="/products" method="GET" className="space-y-5">
              <input
                type="hidden"
                name="category"
                value={selectedCategorySlug ?? ""}
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
                    onClick={() => setOpen(false)}
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
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    10k - 30k
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
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      !selectedCategorySlug
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
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        selectedCategorySlug === c.slug
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
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
