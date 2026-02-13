// src/lib/pricing/resolveFlashPrice.ts
import { db } from "@/db/server";
import { flash_sales, flash_sale_products } from "@/db/schema";
import { and, eq, lte, gte, sql, inArray } from "drizzle-orm";

/**
 * applyDiscount - small util
 */
export function applyDiscount(
  base: number,
  type: "percent" | "amount",
  value: number
) {
  if (type === "percent") {
    return Math.max(0, base - base * (value / 100));
  }
  return Math.max(0, base - value);
}

/**
 * resolveFlashPrice
 * - For a single productId
 * - Returns { price: number, activeFlash: null | { id, discount_type, discount_value, override_type, override_value, priority, starts_at, ends_at } }
 */
export async function resolveFlashPrice(productId: string, basePrice: number) {
  const now = new Date();

  const rows = await db
    .select({
      fs_id: flash_sales.id,
      fs_discount_type: flash_sales.discount_type,
      fs_discount_value: flash_sales.discount_value,
      fs_priority: flash_sales.priority,
      fs_starts_at: flash_sales.starts_at,
      fs_ends_at: flash_sales.ends_at,
      override_type: flash_sale_products.override_discount_type,
      override_value: flash_sale_products.override_discount_value,
    })
    .from(flash_sale_products)
    .innerJoin(
      flash_sales,
      eq(flash_sale_products.flash_sale_id, flash_sales.id)
    )
    .where(
      and(
        eq(flash_sale_products.product_id, productId),
        lte(flash_sales.starts_at, now),
        gte(flash_sales.ends_at, now)
      )
    )
    .orderBy(flash_sales.priority);

  if (!rows || rows.length === 0) {
    return { price: basePrice, activeFlash: null };
  }

  const fs = rows[0] as any;
  const type = (fs.override_type ?? fs.fs_discount_type) as
    | "percent"
    | "amount";
  const val = Number(fs.override_value ?? fs.fs_discount_value ?? 0);
  const finalPrice = applyDiscount(Number(basePrice), type, val);

  return {
    price: Number(finalPrice),
    activeFlash: {
      id: fs.fs_id,
      discount_type: fs.fs_discount_type,
      discount_value: Number(fs.fs_discount_value),
      override_type: fs.override_type ?? null,
      override_value: fs.override_value ? Number(fs.override_value) : null,
      priority: Number(fs.fs_priority),
      starts_at: fs.fs_starts_at,
      ends_at: fs.fs_ends_at,
    },
  };
}

/**
 * resolveFlashPricesForProducts
 * - Batch resolver: accepts array of productIds and a map of productId -> basePrice
 * - Returns a map { [productId]: { price, activeFlash } }
 * - Useful to avoid N+1 queries on product listings
 */
export async function resolveFlashPricesForProducts(
  productIds: string[],
  basePricesMap: Record<string, number>
) {
  if (!productIds || productIds.length === 0) {
    return {};
  }
  const now = new Date();

  const rows = await db
    .select({
      product_id: flash_sale_products.product_id,
      fs_id: flash_sales.id,
      fs_discount_type: flash_sales.discount_type,
      fs_discount_value: flash_sales.discount_value,
      fs_priority: flash_sales.priority,
      fs_starts_at: flash_sales.starts_at,
      fs_ends_at: flash_sales.ends_at,
      override_type: flash_sale_products.override_discount_type,
      override_value: flash_sale_products.override_discount_value,
    })
    .from(flash_sale_products)
    .innerJoin(
      flash_sales,
      eq(flash_sale_products.flash_sale_id, flash_sales.id)
    )
    .where(
      and(
        inArray(flash_sale_products.product_id, productIds),
        lte(flash_sales.starts_at, now),
        gte(flash_sales.ends_at, now)
      )
    )
    .orderBy(flash_sales.priority);

  // we want highest-priority per product id
  const map: Record<string, any> = {};
  for (const r of rows as any[]) {
    const pid = String(r.product_id);
    if (!map[pid]) {
      const type = (r.override_type ?? r.fs_discount_type) as
        | "percent"
        | "amount";
      const val = Number(r.override_value ?? r.fs_discount_value ?? 0);
      const base = Number(basePricesMap[pid] ?? 0);
      map[pid] = {
        price: applyDiscount(base, type, val),
        activeFlash: {
          id: r.fs_id,
          discount_type: r.fs_discount_type,
          discount_value: Number(r.fs_discount_value),
          override_type: r.override_type ?? null,
          override_value: r.override_value ? Number(r.override_value) : null,
          priority: Number(r.fs_priority),
          starts_at: r.fs_starts_at,
          ends_at: r.fs_ends_at,
        },
      };
    }
  }

  // fill defaults (no active flash) for products not in map
  for (const pid of productIds) {
    if (!map[pid]) {
      map[pid] = { price: Number(basePricesMap[pid] ?? 0), activeFlash: null };
    }
  }

  return map;
}
