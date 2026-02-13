// src/lib/validation/cart.ts
import { z } from "zod";

/**
 * Schema for /api/cart/add
 * Accepts UUID string or number for ids (backwards compatible)
 */
const uuidOrNumber = z.preprocess((val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (s === "") return undefined;
    return s;
  }
  return val;
}, z.union([z.string(), z.number()]));

export const addToCartSchema = z.object({
  cartId: z.uuid().nullable().optional(),
  userId: z.uuid().nullable().optional(),
  sessionToken: z.string().nullable().optional(),

  productId: z.uuid(),
  variantId: z.uuid().optional().nullable(),
  quantity: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().int().positive()),
});

export const updateCartItemSchema = z.object({
  cartId: z.uuid(),
  itemId: z.uuid(),
  quantity: z.number().int().min(0).max(999),
});

export const removeCartItemSchema = z.object({
  cartId: z.uuid(),
  itemId: z.uuid(),
});

export const applyCouponSchema = z.object({
  cartId: z.uuid(),
  couponCode: z.string().min(1),
});
