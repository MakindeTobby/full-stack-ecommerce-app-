import { z } from "zod";

const optionalText = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}, z.string().nullable());

const optionalDate = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}, z.date().nullable());

const optionalInt = z.preprocess((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}, z.number().int().nullable());

export const campaignInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    type: z.enum(["popup", "banner", "flash_strip"]),
    title: z.string().trim().min(2).max(200),
    body: optionalText,
    media_url: optionalText,
    cta_label: optionalText,
    cta_url: optionalText,
    audience: z.enum(["all", "guest", "new_user", "returning"]),
    is_active: z.boolean(),
    start_at: optionalDate,
    end_at: optionalDate,
    priority: z.preprocess(
      (v) => Number(v ?? 1),
      z.number().int().min(0).max(999),
    ),
    trigger_delay_seconds: z.preprocess(
      (v) => Number(v ?? 0),
      z.number().int().min(0).max(3600),
    ),
    frequency_mode: z.enum(["once_per_session", "once_per_day", "max_total"]),
    frequency_max_total: optionalInt,
  })
  .superRefine((data, ctx) => {
    if (
      data.start_at &&
      data.end_at &&
      data.end_at.getTime() <= data.start_at.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_at"],
        message: "End date must be after start date",
      });
    }
    if (data.frequency_mode === "max_total") {
      if (!data.frequency_max_total || data.frequency_max_total < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["frequency_max_total"],
          message: "Max total frequency must be at least 1",
        });
      }
    }
  });

export type CampaignInput = z.infer<typeof campaignInputSchema>;
