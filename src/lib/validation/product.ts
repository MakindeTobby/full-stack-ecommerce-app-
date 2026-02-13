// src/lib/validation/product.ts
import { z } from "zod";

/**
 * Matches db/schema.ts columns and types.
 * Note: numeric DB fields are represented as strings in forms (to preserve decimals)
 */

export const productVariantSchema = z.object({
  id: z.uuid(), // used on update
  sku: z.string().max(128).nullable().optional(),
  barcode: z.string().max(128).nullable().optional(),
  attributes: z.record(z.string(), z.string()).nullable().optional(), // { color: 'red', size: 'M' }
  price: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .optional()
    .default("0.00"),
  stock: z.number().int().min(0).optional().default(0),
});

export const productMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]).optional().default("image"),
  position: z.number().int().optional().default(0),
  alt_text: z.string().max(255).nullable().optional(),
});

export const createProductSchema = z.object({
  slug: z.string().min(1).max(255),
  category_id: z.uuid().nullable().optional(),
  name_en: z.string().min(1),
  name_cn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().nullable().optional(),
  base_price: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .default("0.00"),
  old_price: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .nullable()
    .optional(),
  sku: z.string().max(128).nullable().optional(),
  barcode: z.string().max(128).nullable().optional(),
  weight_kg: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .nullable()
    .optional(),
  width_cm: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .nullable()
    .optional(),
  height_cm: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .nullable()
    .optional(),
  depth_cm: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .nullable()
    .optional(),
  published: z.boolean().optional().default(false),
  publish_at: z.string().nullable().optional(), // ISO string or empty
  images: z.array(productMediaSchema).max(9).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  bulk_pricing: z
    .array(
      z.object({
        min_qty: z.number().int().min(1),
        price: z.string().regex(/^\d+(\.\d{1,3})?$/),
      })
    )
    .optional()
    .default([]),
  tags: z.array(z.string().max(64)).optional().default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
