import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cart_items, carts } from "@/db/schema";
import { db } from "@/db/server";
import { getCartSummary } from "@/lib/db/queries/cart";

export async function POST() {
  try {
    const session: Session | null = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const cookieStore = await cookies();
    const qb = cookieStore.get("qb_session")?.value ?? null;

    let cartRow = null;
    if (userId) {
      cartRow = await db
        .select()
        .from(carts)
        .where(eq(carts.user_id, userId))
        .then((r) => r[0] ?? null);
    }
    if (!cartRow && qb) {
      cartRow = await db
        .select()
        .from(carts)
        .where(eq(carts.session_token, qb))
        .then((r) => r[0] ?? null);
    }
    if (!cartRow) {
      return NextResponse.json({ ok: true, cart: null });
    }

    const cartId = String(cartRow.id);
    await db.delete(cart_items).where(eq(cart_items.cart_id, cartId));
    await db.update(carts).set({ coupon_code: "" }).where(eq(carts.id, cartId));

    const cart = await getCartSummary({ userId, sessionToken: qb });
    return NextResponse.json({ ok: true, cart });
  } catch (err: unknown) {
    console.error("POST /api/cart/clear error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
