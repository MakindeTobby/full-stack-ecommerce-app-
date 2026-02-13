// src/lib/validation/coupon.ts
import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .transform((s) => s.toUpperCase()),
  description: z.string().optional().nullable(),
  discount_type: z.union([z.literal("percent"), z.literal("amount")]),
  discount_value: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform(Number)
  ),
  min_order_amount: z.preprocess(
    (v) => (v == null || v === "" ? null : Number(v)),
    z.number().nonnegative().optional().nullable()
  ),
  max_redemptions: z.preprocess(
    (v) => (v == null || v === "" ? null : Number(v)),
    z.number().int().positive().optional().nullable()
  ),
  per_customer_limit: z
    .preprocess(
      (v) => (v == null || v === "" ? 1 : Number(v)),
      z.number().int().positive()
    )
    .default(1),
  starts_at: z.preprocess(
    (v) => (v ? new Date(String(v)) : null),
    z.date().optional().nullable()
  ),
  expires_at: z.preprocess(
    (v) => (v ? new Date(String(v)) : null),
    z.date().optional().nullable()
  ),
  active: z.boolean().optional().default(true),
});
