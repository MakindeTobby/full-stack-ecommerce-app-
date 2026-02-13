import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { cart_items } from "@/db/schema";
import { db } from "@/db/server";
import { addItemToCart, createOrGetCartForUser } from "@/lib/db/queries/cart";
import { addToCartSchema } from "@/lib/validation/cart";

function normalizeId(id: unknown): string | null {
  if (id === null || id === undefined) return null;
  if (typeof id === "number") return String(id);
  if (typeof id === "string") return id.trim();
  return String(id);
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const input = addToCartSchema.parse(await req.json());
    const rawUserId = input.userId ?? null;
    const rawCartId = input.cartId ?? null;
    const rawProductId = input.productId;
    const rawVariantId = input.variantId ?? null;
    const quantity = Number(input.quantity);

    const userIdNormalized = normalizeId(rawUserId);
    const cartIdNormalized = normalizeId(rawCartId);
    const productIdNormalized = normalizeId(rawProductId);
    const variantIdNormalized = normalizeId(rawVariantId);
    if (!productIdNormalized) {
      return NextResponse.json(
        { ok: false, error: "Invalid productId" },
        { status: 400 },
      );
    }

    let finalCartId = cartIdNormalized;
    let sessionToken: string | null =
      normalizeId(input.sessionToken) ??
      cookieStore.get("qb_session")?.value ??
      null;
    let cookieNeedsSet = false;

    if (!finalCartId) {
      if (!sessionToken && !userIdNormalized) {
        sessionToken = randomUUID();
        cookieNeedsSet = true;
      }

      const cart = await createOrGetCartForUser({
        userId: userIdNormalized,
        sessionToken,
      });

      if (!cart || !cart.id) {
        return NextResponse.json(
          { ok: false, error: "Unable to create or retrieve cart" },
          { status: 500 },
        );
      }
      finalCartId = String(cart.id);
    }

    const result = await addItemToCart(finalCartId, {
      productId: productIdNormalized,
      variantId: variantIdNormalized,
      quantity,
    });
    const rows = await db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(cart_items)
      .where(eq(cart_items.cart_id, finalCartId));
    const updatedCount = readCount(rows.at(0));

    const res = NextResponse.json({
      ok: true,
      result,
      cartId: finalCartId,
      cartCount: updatedCount,
      sessionToken,
    });

    if (cookieNeedsSet && sessionToken) {
      res.cookies.set("qb_session", sessionToken, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return res;
  } catch (err: unknown) {
    if (isZodError(err)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid input",
          details: (err as ZodError).issues,
        },
        { status: 400 },
      );
    }

    console.error("API /api/cart/add error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function isZodError(err: unknown): err is ZodError {
  if (!err || typeof err !== "object") return false;
  return (err as { name?: unknown }).name === "ZodError";
}

function readCount(row: unknown): number {
  if (!row || typeof row !== "object") return 0;
  const cnt = (row as { cnt?: unknown }).cnt;
  return Number(cnt ?? 0);
}
