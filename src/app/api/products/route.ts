import { NextResponse } from "next/server";
import { getStoreProductsPage } from "@/lib/db/queries/product";
import { parsePaginationParams } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category =
      (url.searchParams.get("category") ?? "").trim() || undefined;
    const q = (url.searchParams.get("q") ?? "").trim() || undefined;
    const minPriceParam = (url.searchParams.get("minPrice") ?? "").trim();
    const maxPriceParam = (url.searchParams.get("maxPrice") ?? "").trim();
    const minPriceRaw =
      minPriceParam === "" ? Number.NaN : Number(minPriceParam);
    const maxPriceRaw =
      maxPriceParam === "" ? Number.NaN : Number(maxPriceParam);
    const minPrice =
      Number.isFinite(minPriceRaw) && minPriceRaw >= 0
        ? minPriceRaw
        : undefined;
    const maxPrice =
      Number.isFinite(maxPriceRaw) && maxPriceRaw >= 0
        ? maxPriceRaw
        : undefined;
    const { page, pageSize } = parsePaginationParams(url.searchParams, {
      defaultPage: 1,
      defaultPageSize: 24,
      maxPageSize: 100,
    });

    const { rows, pagination, selectedCategory } = await getStoreProductsPage({
      page,
      pageSize,
      categorySlug: category,
      q,
      minPrice,
      maxPrice,
    });

    return NextResponse.json({
      ok: true,
      items: rows,
      pagination,
      selectedCategory,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "failed";
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { ok: false, items: [], error: message },
      { status: 500 },
    );
  }
}
