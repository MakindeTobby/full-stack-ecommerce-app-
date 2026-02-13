// app/api/admin/products/search/route.ts
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { products } from "@/db/schema";
import { db } from "@/db/server";
import { buildPaginationMeta, parsePaginationParams } from "@/lib/pagination";

/**
 * GET /api/admin/products/search?q=shirt&page=1&pageSize=10
 * Returns paginated products matching title or sku
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const { page, pageSize, offset } = parsePaginationParams(url.searchParams, {
      defaultPage: 1,
      defaultPageSize: 10,
      maxPageSize: 50,
    });

    if (!q) {
      return NextResponse.json({
        ok: true,
        items: [],
        results: [],
        pagination: buildPaginationMeta(0, page, pageSize),
      });
    }

    const whereSql = sql`(name_en ILIKE ${`%${q}%`} OR sku ILIKE ${`%${q}%`})`;

    const totalRow = (
      await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(products)
        .where(whereSql)
    ).at(0);
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name_en: products.name_en,
        sku: products.sku,
      })
      .from(products)
      .where(whereSql)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      ok: true,
      items: rows,
      results: rows,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "failed";
    console.error("GET /api/admin/products/search error:", err);
    return NextResponse.json(
      { ok: false, items: [], results: [], error: message },
      { status: 500 },
    );
  }
}
