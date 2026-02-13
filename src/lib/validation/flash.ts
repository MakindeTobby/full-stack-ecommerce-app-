// src/lib/validation/flash.ts
import { z } from "zod";

export const flashSaleSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  discount_type: z.enum(["percent", "amount"]),
  discount_value: z.preprocess(
    (v) => (v === "" ? null : v),
    z.number().positive()
  ),
  starts_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(String(s))), {
      message: "Invalid start date",
    }),
  ends_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(String(s))), {
      message: "Invalid end date",
    }),
  priority: z.preprocess((v) => Number(v ?? 1), z.number().int().min(0)),
});

export type FlashSaleInput = z.infer<typeof flashSaleSchema>;
