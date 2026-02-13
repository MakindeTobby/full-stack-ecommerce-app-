import { eq, inArray, sql } from "drizzle-orm";
import { cart_items, carts, coupons, product_media } from "@/db/schema";
import { db } from "@/db/server";

export async function getCartById(cartId: string) {
  const cartRow = (
    await db.select().from(carts).where(eq(carts.id, cartId))
  ).at(0);
  if (!cartRow) return null;

  const items = await db
    .select({
      id: cart_items.id,
      product_id: cart_items.product_id,
      variant_id: cart_items.variant_id,
      name_snapshot: cart_items.name_snapshot,
      sku: cart_items.sku,
      attributes: sql`(
        SELECT attributes FROM product_variants
        WHERE product_variants.id = cart_items.variant_id
        LIMIT 1
      )`,
      quantity: cart_items.quantity,
      unit_price: cart_items.unit_price,
      thumbnail: sql`(
        SELECT url FROM product_media
        WHERE product_media.product_id = cart_items.product_id
        ORDER BY product_media.position NULLS LAST, product_media.id
        LIMIT 1
      )`,
    })
    .from(cart_items)
    .where(eq(cart_items.cart_id, cartId))
    .orderBy(cart_items.id);

  let itemCount = 0;
  let subTotal = 0;
  const normalized = items.map((it) => {
    itemCount += Number(it.quantity ?? 0);
    subTotal += Number(it.unit_price ?? 0) * Number(it.quantity ?? 0);
    return {
      id: String(it.id),
      product_id: String(it.product_id),
      variant_id: it.variant_id ? String(it.variant_id) : null,
      name_snapshot: it.name_snapshot ?? null,
      attributes: it.attributes ?? null,
      sku: it.sku ?? null,
      quantity: Number(it.quantity ?? 0),
      unit_price: String(it.unit_price ?? "0.00"),
      thumbnail: it.thumbnail ?? null,
    };
  });

  let appliedCoupon = null;
  let discountAmount = 0;
  let total = Number(subTotal);

  if (cartRow.coupon_code) {
    const c = (
      await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, cartRow.coupon_code))
        .limit(1)
    ).at(0);
    if (c) {
      appliedCoupon = {
        code: c.code,
        discount_type: c.discount_type,
        discount_value: String(c.discount_value),
      };

      if (c.discount_type === "percent") {
        discountAmount = (total * Number(c.discount_value)) / 100;
      } else {
        discountAmount = Number(c.discount_value ?? 0);
      }
      total = Math.max(0, total - discountAmount);
    }
  }

  return {
    id: String(cartRow.id),
    itemCount,
    subTotal: Number(subTotal).toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    total: total.toFixed(2),
    appliedCoupon,
    items: normalized,
  };
}

export async function getCartSummary(opts: {
  userId?: string | null;
  sessionToken?: string | null;
}) {
  const { userId = null, sessionToken = null } = opts;

  let cartRow: typeof carts.$inferSelect | null = null;
  if (userId) {
    cartRow = await db
      .select()
      .from(carts)
      .where(eq(carts.user_id, userId))
      .then((r) => r[0] ?? null);
  }
  if (!cartRow && sessionToken) {
    cartRow = await db
      .select()
      .from(carts)
      .where(eq(carts.session_token, sessionToken))
      .then((r) => r[0] ?? null);
  }
  if (!cartRow) return null;

  const cartId = String(cartRow.id);
  const items = await db
    .select({
      id: cart_items.id,
      product_id: cart_items.product_id,
      variant_id: cart_items.variant_id,
      name_snapshot: cart_items.name_snapshot,
      sku: cart_items.sku,
      quantity: cart_items.quantity,
      unit_price: cart_items.unit_price,
    })
    .from(cart_items)
    .where(eq(cart_items.cart_id, cartId));

  if (!items || items.length === 0) {
    return { id: cartId, itemCount: 0, subTotal: "0.00", items: [] };
  }

  const productIds = Array.from(
    new Set(items.map((it) => String(it.product_id))),
  );
  const medias = await db
    .select({
      product_id: product_media.product_id,
      url: product_media.url,
      position: product_media.position,
    })
    .from(product_media)
    .where(inArray(product_media.product_id, productIds))
    .orderBy(product_media.product_id, product_media.position);

  const thumbnailMap: Record<string, string> = {};
  for (const m of medias) {
    const pid = String(m.product_id);
    if (!thumbnailMap[pid]) thumbnailMap[pid] = m.url;
  }

  let itemCount = 0;
  let subTotal = 0;
  const mapped = items.map((it) => {
    const q = Number(it.quantity ?? 0);
    const up = Number(it.unit_price ?? "0");
    itemCount += q;
    subTotal += up * q;
    return {
      id: String(it.id),
      product_id: String(it.product_id),
      variant_id: it.variant_id ? String(it.variant_id) : null,
      name_snapshot: it.name_snapshot ?? null,
      sku: it.sku ?? null,
      quantity: q,
      unit_price: String(it.unit_price ?? "0.00"),
      thumbnail: thumbnailMap[String(it.product_id)] ?? null,
    };
  });

  return {
    id: cartId,
    itemCount,
    subTotal: Number(subTotal).toFixed(2),
    items: mapped,
  };
}
