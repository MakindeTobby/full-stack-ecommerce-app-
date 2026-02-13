// lib/db/transactions/orders.ts
"use server";
import { and, eq, sql } from "drizzle-orm";
import {
  cart_items,
  carts,
  coupon_redemptions,
  coupons,
  inventory_logs,
  order_items,
  order_status_history,
  orders,
  product_variants,
  products,
} from "@/db/schema";
import { db } from "@/db/server";

/**
 * createOrderFromCart
 * - Atomic transaction to create an order from a cart
 * - Validates coupon (if provided), decrements inventory atomically, snapshots items, inserts order + items, logs inventory, clears cart
 *
 * Returns: { orderId }
 *
 * Notes:
 * - numeric columns use string values; we format totals with toFixed(2)
 * - uses atomic UPDATE..WHERE stock >= qty .. RETURNING pattern for safety
 */

type CreateOrderOpts = {
  cartId: string;
  userId: string;
  addressId?: string | null;
  couponCode?: string | null;
  currency?: string;
};

type CouponRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: unknown;
  min_order_amount: unknown;
  max_redemptions: unknown;
  per_customer_limit: unknown;
  starts_at: Date | null;
  expires_at: Date | null;
  active: boolean | null;
};

export async function createOrderFromCart(opts: CreateOrderOpts) {
  const {
    cartId,
    userId,
    addressId = null,
    couponCode = null,
    currency = "NGN",
  } = opts;

  const result = await db.transaction(async (tx) => {
    const cartRow = (
      await tx
        .select({ couponCode: carts.coupon_code })
        .from(carts)
        .where(eq(carts.id, cartId))
    ).at(0);
    let effectiveCouponCode = couponCode;
    if (!effectiveCouponCode && cartRow?.couponCode) {
      effectiveCouponCode = cartRow.couponCode;
    }
    // 1) read cart items
    const items = await tx
      .select({
        id: cart_items.id,
        product_id: cart_items.product_id,
        variant_id: cart_items.variant_id,
        quantity: cart_items.quantity,
        unit_price: cart_items.unit_price,
        sku: cart_items.sku,
        name_snapshot: cart_items.name_snapshot,
      })
      .from(cart_items)
      .where(eq(cart_items.cart_id, cartId));

    if (!items || items.length === 0) throw new Error("Cart is empty");

    // 2) subtotal calculation (unit_price stored as string)
    let subTotal = 0;
    for (const it of items) {
      subTotal += Number(it.unit_price) * it.quantity;
    }

    // inside your tx transaction — replacement for the coupon validation block

    let couponRow: CouponRow | null = null;
    if (effectiveCouponCode) {
      // fetch coupon row
      const couponRows = await tx
        .select({
          id: coupons.id,
          code: coupons.code,
          discount_type: coupons.discount_type,
          discount_value: coupons.discount_value,
          min_order_amount: coupons.min_order_amount,
          max_redemptions: coupons.max_redemptions,
          per_customer_limit: coupons.per_customer_limit,
          starts_at: coupons.starts_at,
          expires_at: coupons.expires_at,
          active: coupons.active,
        })
        .from(coupons)
        .where(eq(coupons.code, effectiveCouponCode));

      couponRow = couponRows[0] ?? null;
      if (!couponRow) throw new Error("Invalid coupon");
      if (!couponRow.active) throw new Error("Coupon inactive");

      const now = new Date();
      if (couponRow.starts_at && new Date(couponRow.starts_at) > now)
        throw new Error("Coupon not started");
      if (couponRow.expires_at && new Date(couponRow.expires_at) < now)
        throw new Error("Coupon expired");
      if (
        couponRow.min_order_amount &&
        Number(couponRow.min_order_amount) > subTotal
      )
        throw new Error("Cart does not meet coupon minimum");

      // check global redemption limit
      if (couponRow.max_redemptions) {
        const usedRows = await tx
          .select({ cnt: sql`COUNT(*)::int` })
          .from(coupon_redemptions)
          .where(eq(coupon_redemptions.coupon_id, couponRow.id));

        const used = readCount(usedRows[0]);
        if (used >= Number(couponRow.max_redemptions))
          throw new Error("Coupon has reached max redemptions");
      }

      // check per-customer redemption limit
      if (couponRow.per_customer_limit) {
        const usedByUserRows = await tx
          .select({ cnt: sql`COUNT(*)::int` })
          .from(coupon_redemptions)
          .where(
            and(
              eq(coupon_redemptions.coupon_id, couponRow.id),
              eq(coupon_redemptions.user_id, userId),
            ),
          );

        const usedByUser = Number(usedByUserRows[0]?.cnt ?? 0);
        if (usedByUser >= Number(couponRow.per_customer_limit))
          throw new Error("Coupon redemption limit reached for this customer");
      }
    }

    // 4) Inventory checks + atomic decrements
    for (const it of items) {
      const qty = it.quantity;
      const variantId = it.variant_id;
      if (variantId) {
        // atomic update: decrement if stock >= qty
        const updated = await tx
          .update(product_variants)
          .set({ stock: sql`stock - ${qty}` })
          .where(sql`id = ${variantId} AND stock >= ${qty}`)
          .returning({
            id: product_variants.id,
            stock: product_variants.stock,
          });

        if (updated.length === 0) {
          throw new Error(`Insufficient stock for variant ${variantId}`);
        }

        // log inventory change
        await tx.insert(inventory_logs).values({
          variant_id: variantId,
          change: -qty,
          reason: "order_creation",
          reference: `cart:${cartId}`,
        });
      } else {
        // optionally handle product-level stock if you track it
      }
    }

    // 5) create order row
    const totalWithCoupon = applyCouponToSubtotal(subTotal, couponRow);
    const totalStr = Number(totalWithCoupon).toFixed(2);

    const inserted = await tx
      .insert(orders)
      .values({
        user_id: userId,
        address_id: addressId ?? null,
        total_amount: totalStr,
        currency,
        status: "pending",
        payment_status: "unpaid",
      })
      .returning({ id: orders.id });

    const orderId = inserted[0]?.id;
    if (!orderId) {
      throw new Error("Failed to create order");
    }

    await tx.insert(order_status_history).values({
      order_id: orderId,
      from_status: null,
      to_status: "pending",
      actor: "system",
      note: "Order created",
    });

    // 6) create order_items (snapshot)
    for (const it of items) {
      // ensure we have product snapshot name
      const prod = await tx
        .select({ name_en: products.name_en })
        .from(products)
        .where(eq(products.id, it.product_id))
        .then((r) => r[0]);

      await tx.insert(order_items).values({
        order_id: orderId,
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        quantity: it.quantity,
        unit_price: it.unit_price,
        name_snapshot: prod?.name_en ?? it.name_snapshot ?? null,
        sku_snapshot: it.sku ?? null,
      });
    }

    // 7) coupon redemption record
    if (couponRow) {
      await tx.insert(coupon_redemptions).values({
        coupon_id: couponRow.id,
        user_id: userId,
        order_id: orderId,
      });
    }

    // 8) clear cart items
    await tx.delete(cart_items).where(eq(cart_items.cart_id, cartId));
    await tx.update(carts).set({ coupon_code: "" }).where(eq(carts.id, cartId));

    return { orderId };
  });

  return result;
}

/**
 * applyCouponToSubtotal - basic utility
 * supports percent|amount types
 */
function applyCouponToSubtotal(subtotal: number, couponRow: CouponRow | null) {
  if (!couponRow) return subtotal;
  const type = couponRow.discount_type;
  const value = Number(couponRow.discount_value ?? 0);
  if (type === "percent") {
    return Math.max(0, subtotal - subtotal * (value / 100));
  }
  // amount
  return Math.max(0, subtotal - value);
}

function readCount(row: { cnt?: unknown } | undefined) {
  return Number(row?.cnt ?? 0);
}
