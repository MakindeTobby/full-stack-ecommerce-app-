// src/lib/db/transactions/products.ts
"use server";

import { db } from "@/db/server";
import {
  products,
  product_variants,
  product_media,
  bulk_pricing,
  tags,
  product_tags,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CreateProductInput } from "@/lib/validation/product";
import { generateUniqueSlug } from "../queries/product";
import { slugify } from "@/lib/slugify";

/**
 * Create product (transactional)
 */
export async function createProductTransaction(input: CreateProductInput) {
  return await db.transaction(async (tx) => {
    let slug = input.slug?.trim();

    // AUTO-GENERATE if empty
    if (!slug) {
      const base = slugify(input.name_en);
      slug = await generateUniqueSlug(base);
    } else {
      // normalize admin-provided slug
      slug = await generateUniqueSlug(slugify(slug));
    }

    // 1) insert product
    const inserted = await tx
      .insert(products)
      .values({
        slug,
        category_id: input.category_id ?? null,
        name_en: input.name_en,
        name_cn: input.name_cn ?? null,
        description: input.description ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        base_price: input.base_price,
        old_price: input.old_price ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        weight_kg: input.weight_kg ?? null,
        width_cm: input.width_cm ?? null,
        height_cm: input.height_cm ?? null,
        depth_cm: input.depth_cm ?? null,
        published: input.published ?? false,
        publish_at: input.publish_at ? new Date(input.publish_at) : null,
      })
      .returning({ id: products.id });

    const productId = inserted[0].id as string;
    if (Array.isArray(input.images) && input.images.length > 0) {
      const mediaRows = input.images.map((m) => ({
        product_id: productId,
        url: m.url,
        type: m.type ?? "image",
        position: m.position ?? 0,
        alt_text: m.alt_text ?? null,
        public_id: (m as any).public_id ?? null, // if available
      }));
      await tx.insert(product_media).values(mediaRows);
    }

    // 3) variants
    if (Array.isArray(input.variants) && input.variants.length > 0) {
      const variantRows = input.variants.map((v) => ({
        product_id: productId,
        sku: v.sku ?? null,
        barcode: v.barcode ?? null,
        attributes: v.attributes ? JSON.stringify(v.attributes) : null,
        price: v.price ?? "0.00",
        stock: typeof v.stock === "number" ? v.stock : 0,
      }));
      await tx.insert(product_variants).values(variantRows);
    }

    // 4) bulk pricing
    if (input.bulk_pricing?.length) {
      const bpRows = input.bulk_pricing.map((b) => ({
        product_id: productId,
        min_qty: b.min_qty,
        price: b.price,
      }));
      if (bpRows.length) await tx.insert(bulk_pricing).values(bpRows);
    }

    // 5) tags (create-if-not-exists and link)
    if (input.tags?.length) {
      for (const tname of input.tags) {
        // try find tag
        const found = await tx
          .select()
          .from(tags)
          .where(eq(tags.name, tname))
          .then((r) => r[0]);
        let tagId: string;
        if (!found) {
          const ins = await tx
            .insert(tags)
            .values({ name: tname })
            .returning({ id: tags.id });
          tagId = (ins as any)[0].id;
        } else {
          tagId = found.id;
        }
        await tx
          .insert(product_tags)
          .values({ product_id: productId, tag_id: tagId });
      }
    }

    return { productId };
  });
}

/**
 * Update product (transactional)
 * Simple strategy: update product row, delete child rows and re-insert
 */
export async function updateProductTransaction(
  productId: string,
  input: CreateProductInput & {
    images?: any[] | undefined;
    variants?: any[] | undefined;
  }
) {
  return await db.transaction(async (tx) => {
    let slug = input.slug?.trim();

    if (!slug) {
      // fetch current slug to keep same (avoid regenerating)
      const existing = await tx
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.id, productId))
        .then((r) => r[0]);
      slug = existing?.slug ?? slugify(input.name_en);
    } else {
      slug = slugify(slug);
    }
    // update product row
    await tx
      .update(products)
      .set({
        slug,
        category_id: input.category_id ?? null,
        name_en: input.name_en,
        name_cn: input.name_cn ?? null,
        description: input.description ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        base_price: input.base_price,
        old_price: input.old_price ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        weight_kg: input.weight_kg ?? null,
        width_cm: input.width_cm ?? null,
        height_cm: input.height_cm ?? null,
        depth_cm: input.depth_cm ?? null,
        published: input.published ?? false,
        publish_at: input.publish_at ? new Date(input.publish_at) : null,
      })
      .where(eq(products.id, productId));
    if (Array.isArray(input.images) && input.images.length > 0) {
      await tx
        .delete(product_media)
        .where(eq(product_media.product_id, productId));
      const mediaRows = input.images.map((m, idx) => ({
        product_id: productId,
        url: m.url,
        type: m.type ?? "image",
        position: m.position ?? idx,
        alt_text: m.alt_text ?? null,
        public_id: (m as any).public_id ?? null,
      }));
      if (mediaRows.length) await tx.insert(product_media).values(mediaRows);
    }

    // VARIANTS: if provided, delete existing and insert new
    // if (Array.isArray(input.variants)) {
    //   await tx
    //     .delete(product_variants)
    //     .where(eq(product_variants.product_id, productId));
    //   const vrows = (input.variants ?? [])
    //     .filter((v: any) => v != null)
    //     .map((v: any) => ({
    //       product_id: productId,
    //       sku: v.sku ?? null,
    //       barcode: v.barcode ?? null,
    //       attributes: v.attributes ? JSON.stringify(v.attributes) : null,
    //       price: v.price ?? "0.00",
    //       stock: typeof v.stock === "number" ? v.stock : 0,
    //     }));
    //   if (vrows.length) await tx.insert(product_variants).values(vrows);
    // }
    if (Array.isArray(input.variants)) {
      try {
        await tx
          .delete(product_variants)
          .where(eq(product_variants.product_id, productId));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error ?? "");
        if (
          msg.toLowerCase().includes("violates foreign key constraint") ||
          msg.toLowerCase().includes("product_variants")
        ) {
          throw new Error(
            "Cannot replace variants because some are already used in carts/orders. Edit category/basic fields without touching variants, or clear dependent cart/order references first.",
          );
        }
        throw error;
      }

      let vrows = (input.variants ?? [])
        .filter((v: any) => v != null)
        .map((v: any) => ({
          product_id: productId,
          sku: v.sku ?? null,
          barcode: v.barcode ?? null,
          attributes: v.attributes ? JSON.stringify(v.attributes) : null,
          price: v.price ?? "0.00",
          stock: typeof v.stock === "number" ? v.stock : 0,
        }));

      // ADD THIS LINE:
      vrows = await ensureUniqueSkus(tx, vrows);

      if (vrows.length) await tx.insert(product_variants).values(vrows);
    }

    // bulk_pricing: replace if provided
    if (Array.isArray(input.bulk_pricing) && input.bulk_pricing.length > 0) {
      await tx
        .delete(bulk_pricing)
        .where(eq(bulk_pricing.product_id, productId));
      const bpRows = input.bulk_pricing.map((b: any) => ({
        product_id: productId,
        min_qty: b.min_qty,
        price: b.price,
      }));
      if (bpRows.length) await tx.insert(bulk_pricing).values(bpRows);
    }

    // tags: only update if provided
    if (Array.isArray(input.tags)) {
      await tx
        .delete(product_tags)
        .where(eq(product_tags.product_id, productId));
      for (const tname of input.tags) {
        const found = await tx
          .select()
          .from(tags)
          .where(eq(tags.name, tname))
          .then((r) => r[0]);
        let tagId: string;
        if (!found) {
          const ins = await tx
            .insert(tags)
            .values({ name: tname })
            .returning({ id: tags.id });
          tagId = (ins as any)[0].id;
        } else {
          tagId = found.id;
        }
        await tx
          .insert(product_tags)
          .values({ product_id: productId, tag_id: tagId });
      }
    }

    // // tags: delete links and re-create
    // await tx.delete(product_tags).where(eq(product_tags.product_id, productId));
    // if (input.tags?.length) {
    //   for (const tname of input.tags) {
    //     const found = await tx
    //       .select()
    //       .from(tags)
    //       .where(eq(tags.name, tname))
    //       .then((r) => r[0]);
    //     let tagId: string;
    //     if (!found) {
    //       const ins = await tx
    //         .insert(tags)
    //         .values({ name: tname })
    //         .returning({ id: tags.id });
    //       tagId = (ins as any)[0].id;
    //     } else {
    //       tagId = found.id;
    //     }
    //     await tx
    //       .insert(product_tags)
    //       .values({ product_id: productId, tag_id: tagId });
    //   }
    // }

    return { productId };
  });
}

/**
/** Delete product (transactional) */
export async function deleteProductTransaction(productId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .delete(product_media)
      .where(eq(product_media.product_id, productId));
    await tx
      .delete(product_variants)
      .where(eq(product_variants.product_id, productId));
    await tx.delete(bulk_pricing).where(eq(bulk_pricing.product_id, productId));
    await tx.delete(product_tags).where(eq(product_tags.product_id, productId));
    await tx.delete(products).where(eq(products.id, productId));
    return { productId };
  });
}

async function ensureUniqueSkus(tx: any, vrows: any[]) {
  const used = new Set<string>();

  // 1. Load existing SKUs from DB (optional but recommended)
  // If you want global SKU uniqueness, uncomment line below.
  const existing = await tx
    .select({ sku: product_variants.sku })
    .from(product_variants);
  // for (const row of existing) if (row.sku) used.add(String(row.sku).trim());

  // If you want uniqueness only inside this product, uncomment below:
  // const existingProduct = await tx
  //   .select({ sku: product_variants.sku })
  //   .from(product_variants)
  //   .where(eq(product_variants.product_id, vrows[0]?.product_id));
  // for (const row of existingProduct) if (row.sku) used.add(String(row.sku).trim());

  // 2. De-duplicate incoming list
  for (const v of vrows) {
    let base = String(v.sku ?? "").trim();
    if (!base) base = "ITEM";

    let candidate = base;
    let i = 1;

    while (used.has(candidate)) {
      candidate = `${base}-${i++}`;
    }

    used.add(candidate);
    v.sku = candidate;
  }

  return vrows;
}
