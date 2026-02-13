// lib/validation/orders.ts
import { z } from "zod";

/**
 * Request body for POST /api/orders
 * - cartId and userId required (server should ensure these match auth)
 * - addressId optional (nullable)
 * - couponCode optional (uppercase or trimmed)
 * - currency optional, ISO-like short code
 */
export const createOrderSchema = z.object({
  cartId: z.uuid(),
  userId: z.uuid(),
  addressId: z.uuid().nullable().optional(),
  couponCode: z.string().trim().min(1).optional(),
  currency: z.string().trim().min(3).max(6).default("NGN"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
