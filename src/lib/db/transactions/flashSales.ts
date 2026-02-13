// src/lib/db/transactions/flashSales.ts
"use server";
import { db } from "@/db/server";
import { flash_sales, flash_sale_products } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

/**
 * createFlashSaleTransaction
 * - Inserts flash_sale and associated flash_sale_products (array of { productId, override_type?, override_value? })
 */
export async function createFlashSaleTransaction(payload: {
  title: string;
  description?: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  starts_at: string;
  ends_at: string;
  priority?: number;
  products?: Array<{
    productId: string;
    override_type?: "percent" | "amount" | null;
    override_value?: number | null;
  }>;
}) {
  const {
    title,
    description = null,
    discount_type,
    discount_value,
    starts_at,
    ends_at,
    priority = 1,
    products = [],
  } = payload;

  const result = await db.transaction(async (tx) => {
    const id = uuidv4();

    // === Quick fix: coerce numbers to strings (if your schema expects strings) ===
    // or use `as any` to silence TS until you fix the schema/typegen.
    await tx.insert(flash_sales).values({
      // cast to any if TypeScript still complains about the insert shape
      id,
      title,
      description,
      discount_type,
      // ensure type matches schema. If schema expects string, convert:
      discount_value: discount_value,
      starts_at: new Date(starts_at),
      ends_at: new Date(ends_at),
      priority: String(priority) as any,
    } as any);

    if (products && products.length > 0) {
      for (const p of products) {
        await tx.insert(flash_sale_products).values({
          id: uuidv4(),
          flash_sale_id: id,
          product_id: p.productId,
          override_discount_type: p.override_type ?? null,
          override_discount_value:
            p.override_value == null ? null : p.override_value,
        } as any);
      }
    }

    return { id };
  });

  return result;
}

/**
 * updateFlashSaleTransaction
 * - Updates flash_sales row and replaces product attachments (simple approach)
 */
export async function updateFlashSaleTransaction(
  id: string,
  payload: {
    title?: string;
    description?: string | null;
    discount_type?: "percent" | "amount";
    discount_value?: number;
    starts_at?: string;
    ends_at?: string;
    priority?: number;
    products?: Array<{
      productId: string;
      override_type?: "percent" | "amount" | null;
      override_value?: number | null;
    }>;
  }
) {
  const result = await db.transaction(async (tx) => {
    const setObj: any = {};
    if (payload.title !== undefined) setObj.title = payload.title;
    if (payload.description !== undefined)
      setObj.description = payload.description;
    if (payload.discount_type !== undefined)
      setObj.discount_type = payload.discount_type;
    if (payload.discount_value !== undefined)
      setObj.discount_value = payload.discount_value;
    if (payload.starts_at !== undefined)
      setObj.starts_at = new Date(payload.starts_at);
    if (payload.ends_at !== undefined)
      setObj.ends_at = new Date(payload.ends_at);
    if (payload.priority !== undefined) setObj.priority = payload.priority;

    if (Object.keys(setObj).length > 0) {
      await tx.update(flash_sales).set(setObj).where(eq(flash_sales.id, id));
    }

    if (payload.products) {
      // delete existing attachments
      await tx
        .delete(flash_sale_products)
        .where(eq(flash_sale_products.flash_sale_id, id));
      // insert new attachments
      for (const p of payload.products) {
        await tx.insert(flash_sale_products).values({
          id: uuidv4(),
          flash_sale_id: id,
          product_id: p.productId,
          override_discount_type: p.override_type ?? null,
          override_discount_value: p.override_value ?? null,
        } as any);
      }
    }

    return { id };
  });

  return result;
}

/**
 * deleteFlashSale
 */
export async function deleteFlashSale(id: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(flash_sale_products)
      .where(eq(flash_sale_products.flash_sale_id, id));
    await tx.delete(flash_sales).where(eq(flash_sales.id, id));
  });
  return { id };
}
