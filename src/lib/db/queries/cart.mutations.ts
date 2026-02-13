import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { cart_items, carts, product_variants, products } from "@/db/schema";
import { db } from "@/db/server";
import { resolveFlashPrice } from "@/lib/pricing/resolveFlashPrice";

export async function mergeGuestCartToUser(opts: {
  sessionToken?: string | null;
  userId: string;
}) {
  const { sessionToken = null, userId } = opts;

  if (!sessionToken) {
    return { mergedCount: 0, conflicts: [], userCartId: null };
  }

  const result = await db.transaction(async (tx) => {
    const guestCartRow = await tx
      .select()
      .from(carts)
      .where(eq(carts.session_token, sessionToken))
      .then((r) => r[0] ?? null);

    if (!guestCartRow) {
      const userCartRow = await tx
        .select()
        .from(carts)
        .where(eq(carts.user_id, userId))
        .then((r) => r[0] ?? null);

      if (userCartRow) {
        return { mergedCount: 0, conflicts: [], userCartId: userCartRow.id };
      }

      const inserted = await tx
        .insert(carts)
        .values({ user_id: userId, session_token: null })
        .returning({ id: carts.id });
      return {
        mergedCount: 0,
        conflicts: [],
        userCartId: inserted[0].id,
      };
    }

    const guestCartId = guestCartRow.id;
    const existingUserCartRow = await tx
      .select()
      .from(carts)
      .where(eq(carts.user_id, userId))
      .then((r) => r[0] ?? null);

    let userCartId = existingUserCartRow?.id ?? null;
    if (!userCartId) {
      const inserted = await tx
        .insert(carts)
        .values({ user_id: userId, session_token: null })
        .returning({ id: carts.id });
      userCartId = inserted[0]?.id ?? null;
    }

    if (!userCartId) {
      throw new Error("Failed to resolve user cart during merge");
    }
    const guestItems = await tx
      .select()
      .from(cart_items)
      .where(eq(cart_items.cart_id, guestCartId));
    const userItems = await tx
      .select()
      .from(cart_items)
      .where(eq(cart_items.cart_id, userCartId));

    const userItemMap = new Map<string, (typeof userItems)[number]>();
    for (const ui of userItems) {
      const key = `${ui.product_id}::${String(ui.variant_id ?? "null")}`;
      userItemMap.set(key, ui);
    }

    const conflicts: Array<{
      productId: string;
      variantId: string | null;
      requested: number;
      final: number;
    }> = [];
    let mergedCount = 0;

    for (const gi of guestItems) {
      const key = `${gi.product_id}::${String(gi.variant_id ?? "null")}`;
      const qtyToMove = gi.quantity;

      if (userItemMap.has(key)) {
        const existing = userItemMap.get(key);
        if (!existing) continue;
        let newQty = existing.quantity + qtyToMove;

        if (gi.variant_id) {
          const pv = await tx
            .select()
            .from(product_variants)
            .where(eq(product_variants.id, gi.variant_id))
            .then((r) => r[0] ?? null);

          if (pv && typeof pv.stock === "number" && newQty > pv.stock) {
            conflicts.push({
              productId: gi.product_id,
              variantId: gi.variant_id,
              requested: newQty,
              final: pv.stock,
            });
            newQty = pv.stock;
          }
        }

        await tx
          .update(cart_items)
          .set({ quantity: newQty })
          .where(eq(cart_items.id, existing.id));
        mergedCount++;
      } else {
        let insertQty = qtyToMove;

        if (gi.variant_id) {
          const pv = await tx
            .select()
            .from(product_variants)
            .where(eq(product_variants.id, gi.variant_id))
            .then((r) => r[0] ?? null);

          if (pv && typeof pv.stock === "number" && insertQty > pv.stock) {
            conflicts.push({
              productId: gi.product_id,
              variantId: gi.variant_id,
              requested: insertQty,
              final: pv.stock,
            });
            insertQty = pv.stock;
          }
        }

        if (insertQty > 0) {
          await tx.insert(cart_items).values({
            cart_id: userCartId,
            product_id: gi.product_id,
            name_snapshot: gi.name_snapshot ?? null,
            variant_id: gi.variant_id ?? null,
            sku: gi.sku ?? null,
            quantity: insertQty,
            unit_price: gi.unit_price,
          });
          mergedCount++;
        }
      }
    }

    await tx.delete(cart_items).where(eq(cart_items.cart_id, guestCartId));
    await tx.delete(carts).where(eq(carts.id, guestCartId));

    return { mergedCount, conflicts, userCartId };
  });

  return result;
}

export async function createOrGetCartForUser(opts: {
  cartId?: string | null;
  userId?: string | null;
  sessionToken?: string | null;
}) {
  const { cartId, userId, sessionToken } = opts;
  if (cartId) {
    const rows = await db.select().from(carts).where(eq(carts.id, cartId));
    if (rows.length) return rows[0];
  }

  if (userId) {
    const rows = await db.select().from(carts).where(eq(carts.user_id, userId));
    if (rows.length) return rows[0];
  }

  if (!userId && sessionToken) {
    const rows = await db
      .select()
      .from(carts)
      .where(eq(carts.session_token, sessionToken));
    if (rows.length) return rows[0];
  }

  const newId = uuidv4();
  const inserted = await db
    .insert(carts)
    .values({
      id: newId,
      user_id: userId ?? null,
      session_token: sessionToken ?? newId,
    })
    .returning({
      id: carts.id,
      user_id: carts.user_id,
      session_token: carts.session_token,
    });
  return inserted[0];
}

export async function addItemToCart(
  cartId: string,
  payload: { productId: string; variantId?: string | null; quantity: number },
) {
  const { productId, variantId = null, quantity } = payload;
  if (quantity <= 0) throw new Error("Quantity must be > 0");

  const productRow = (
    await db
      .select({
        name_en: products.name_en,
        base_price: products.base_price,
        sku: products.sku,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
  ).at(0);

  if (!productRow) throw new Error("Product not found");
  const productName = productRow.name_en ?? "Unknown Product";

  let baseUnitPrice = Number(productRow.base_price ?? 0);
  let unitPriceStr = Number(baseUnitPrice).toFixed(2);
  let sku: string | null = null;

  if (variantId) {
    const v = (
      await db
        .select({ price: product_variants.price, sku: product_variants.sku })
        .from(product_variants)
        .where(eq(product_variants.id, variantId))
        .limit(1)
    ).at(0);
    if (!v) throw new Error("Variant not found");
    baseUnitPrice = Number(v.price ?? productRow.base_price ?? 0);
    sku = v.sku ?? null;
  } else {
    sku = productRow.sku ?? null;
  }

  const { price: effectiveUnitPrice } = await resolveFlashPrice(
    productId,
    baseUnitPrice,
  );
  unitPriceStr = Number(effectiveUnitPrice).toFixed(2);

  const existing =
    (
      await db
        .select()
        .from(cart_items)
        .where(
          and(
            eq(cart_items.cart_id, cartId),
            eq(cart_items.product_id, productId),
            variantId
              ? eq(cart_items.variant_id, variantId)
              : sql`cart_items.variant_id IS NULL`,
          ),
        )
        .limit(1)
    ).at(0) ?? null;

  if (existing) {
    const newQty = Number(existing.quantity) + quantity;
    await db
      .update(cart_items)
      .set({
        quantity: newQty,
        unit_price: unitPriceStr,
      })
      .where(eq(cart_items.id, existing.id));

    return (
      await db
        .select()
        .from(cart_items)
        .where(eq(cart_items.id, existing.id))
        .limit(1)
    ).at(0);
  }

  const id = uuidv4();
  await db.insert(cart_items).values({
    id,
    cart_id: cartId,
    product_id: productId,
    name_snapshot: productName,
    variant_id: variantId ?? null,
    sku,
    quantity,
    unit_price: unitPriceStr,
  });

  return (
    await db.select().from(cart_items).where(eq(cart_items.id, id)).limit(1)
  ).at(0);
}

export async function clearCart(cartId: string) {
  await db.delete(cart_items).where(eq(cart_items.cart_id, cartId));
  await db.update(carts).set({ coupon_code: "" }).where(eq(carts.id, cartId));
  return true;
}
