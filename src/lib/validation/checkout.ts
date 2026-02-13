// src/lib/validation/checkout.ts
import { z } from "zod";

/**
 * Checkout payload for POST /api/orders
 * - cartId: string (UUID)
 * - userId: string (UUID) — required for V1
 * - addressId: string (UUID)
 * - couponCode: optional string
 * - currency: optional
 */
export const createOrderSchema = z.object({
  cartId: z.string().uuid(),
  userId: z.string().uuid(),
  addressId: z.string().uuid().nullable().optional(),
  couponCode: z.string().min(1).optional().nullable(),
  currency: z.string().optional().default("NGN"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// If you later allow guest checkout, change userId to z.union([z.string().uuid(), z.null()]) and update server logic accordingly.
