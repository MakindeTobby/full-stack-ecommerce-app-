import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cart_items, carts, product_variants } from "@/db/schema";
import { db } from "@/db/server";
import { getCartSummary } from "@/lib/db/queries/cart";

const patchItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function PATCH(req: Request) {
  try {
    const parsed = patchItemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid cartItemId/quantity" },
        { status: 400 },
      );
    }
    const { cartItemId, quantity } = parsed.data;

    const session: Session | null = await getServerSession(authOptions);

    const userId = session?.user?.id || null;
    const cookieStore = await cookies();
    const qb = cookieStore.get("qb_session")?.value ?? null;

    const rows = await db
      .select()
      .from(cart_items)
      .where(eq(cart_items.id, String(cartItemId)));
    const item = rows[0];
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

    if (item.variant_id) {
      const pvRows = await db
        .select()
        .from(product_variants)
        .where(eq(product_variants.id, String(item.variant_id)));
      const pv = pvRows[0];
      if (pv) {
        const max = Number(pv.stock ?? 0);
        if (quantity > max) {
          await db
            .update(cart_items)
            .set({ quantity: max })
            .where(eq(cart_items.id, String(cartItemId)));
          const cart = await getCartSummary({ userId, sessionToken: qb });
          return NextResponse.json({
            ok: true,
            cart,
            note: "quantity capped to stock",
          });
        }
      }
    }

    await db
      .update(cart_items)
      .set({ quantity: Number(quantity) })
      .where(eq(cart_items.id, String(cartItemId)));

    const cart = await getCartSummary({ userId, sessionToken: qb });
    return NextResponse.json({ ok: true, cart });
  } catch (err: unknown) {
    console.error("PATCH /api/cart/item error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
