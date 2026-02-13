// app/api/cart/[id]/route.ts
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cart_items } from "@/db/schema";
import { db } from "@/db/server";
import { buildPaginationMeta, parsePaginationParams } from "@/lib/pagination";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: cartId } = await params;
    const url = new URL(req.url);
    const { page, pageSize, offset } = parsePaginationParams(url.searchParams, {
      defaultPage: 1,
      defaultPageSize: 20,
      maxPageSize: 100,
    });

    const totalRow = (
      await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(cart_items)
        .where(eq(cart_items.cart_id, cartId))
    ).at(0);
    const total = Number(totalRow?.cnt ?? 0);

    const items = await db
      .select()
      .from(cart_items)
      .where(eq(cart_items.cart_id, cartId))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      ok: true,
      items,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (err: unknown) {
    console.error("GET /api/cart/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
