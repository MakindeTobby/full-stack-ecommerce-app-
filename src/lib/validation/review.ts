import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.preprocess((v) => Number(v ?? 0), z.number().int().min(1).max(5)),
  title: z.preprocess((v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  }, z.string().max(160).nullable()),
  body: z.preprocess((v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  }, z.string().max(2500).nullable()),
});

export const reviewModerationSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
