// src/lib/validation/media.ts
import { z } from "zod";

export const mediaRecordSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]),
  position: z.number().int().nonnegative(),
  alt_text: z.string().max(255).nullable().optional(),
});
