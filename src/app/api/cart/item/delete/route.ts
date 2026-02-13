import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cart_items, carts } from "@/db/schema";
import { db } from "@/db/server";
import { getCartSummary } from "@/lib/db/queries/cart";

const deleteItemSchema = z.object({
  cartItemId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = deleteItemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid cartItemId" },
        { status: 400 },
      );
    }
    const { cartItemId } = parsed.data;

    const session: Session | null = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const cookieStore = await cookies();
    const qb = cookieStore.get("qb_session")?.value ?? null;

    const item = await db
      .select()
      .from(cart_items)
      .where(eq(cart_items.id, String(cartItemId)))
      .then((r) => r[0] ?? null);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Cart item not found" },
        { status: 404 },
      );
    }

    const cartRow = await db
      .select()
      .from(carts)
      .where(eq(carts.id, String(item.cart_id)))
      .then((r) => r[0] ?? null);
    if (!cartRow) {
      return NextResponse.json(
        { ok: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    const isUserOwned =
      !!userId &&
      !!cartRow.user_id &&
      String(cartRow.user_id) === String(userId);
    const isGuestOwned =
      !cartRow.user_id &&
      !!qb &&
      String(cartRow.session_token ?? "") === String(qb);

    if (!isUserOwned && !isGuestOwned) {
      return NextResponse.json(
        { ok: false, error: "Not authorized to modify this cart item" },
        { status: 403 },
      );
    }

    await db.delete(cart_items).where(eq(cart_items.id, String(cartItemId)));

    const cart = await getCartSummary({ userId, sessionToken: qb });
    return NextResponse.json({ ok: true, cart });
  } catch (err: unknown) {
    console.error("POST /api/cart/item/delete error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
