import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { campaign_impressions, campaigns, users } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";

export type CampaignType = "popup" | "banner" | "flash_strip";
export type CampaignAudience = "all" | "guest" | "new_user" | "returning";
export type CampaignFrequencyMode =
  | "once_per_session"
  | "once_per_day"
  | "max_total";
export type CampaignEvent = "shown" | "clicked" | "dismissed";

export type CampaignPayload = {
  id: string;
  name: string;
  type: CampaignType;
  title: string;
  body: string | null;
  mediaUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  audience: CampaignAudience;
  frequencyMode: CampaignFrequencyMode;
  frequencyMaxTotal: number | null;
  startAt: Date | null;
  endAt: Date | null;
  priority: number;
  triggerDelaySeconds: number;
};

export type CampaignAdminInput = {
  name: string;
  type: CampaignType;
  title: string;
  body: string | null;
  media_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  audience: CampaignAudience;
  is_active: boolean;
  start_at: Date | null;
  end_at: Date | null;
  priority: number;
  trigger_delay_seconds: number;
  frequency_mode: CampaignFrequencyMode;
  frequency_max_total: number | null;
};

type Actor = {
  userId: string | null;
  guestKey: string | null;
};

type ImpressionStats = {
  shownCount: number;
  lastShownAt: Date | null;
};

const NEW_USER_WINDOW_DAYS = 14;

export async function getActiveCampaignsForActor(
  actor: Actor,
): Promise<CampaignPayload[]> {
  const now = new Date();

  const liveRows = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.is_active, true),
        or(isNull(campaigns.start_at), lte(campaigns.start_at, now)),
        or(isNull(campaigns.end_at), gte(campaigns.end_at, now)),
      ),
    )
    .orderBy(desc(campaigns.priority), desc(campaigns.created_at));

  if (liveRows.length === 0) return [];

  const userCreatedAt = actor.userId
    ? await getUserCreatedAt(actor.userId)
    : null;
  const userIsNew = isNewUser(userCreatedAt, now);

  const actorStats = await getShownStats({
    campaignIds: liveRows.map((r) => String(r.id)),
    actor,
  });

  const eligible = liveRows.filter((row) => {
    const audience = normalizeAudience(row.audience);
    if (!audiencePasses(audience, actor.userId, userIsNew)) return false;

    const frequencyMode = normalizeFrequencyMode(row.frequency_mode);
    const stats = actorStats.get(String(row.id)) ?? {
      shownCount: 0,
      lastShownAt: null,
    };

    if (frequencyMode === "once_per_day") {
      if (stats.lastShownAt) {
        const ms = now.getTime() - stats.lastShownAt.getTime();
        if (ms < 24 * 60 * 60 * 1000) return false;
      }
    }

    if (frequencyMode === "max_total") {
      const cap = Number(row.frequency_max_total ?? 0);
      if (cap > 0 && stats.shownCount >= cap) return false;
    }

    return true;
  });

  const pickedByType = new Map<CampaignType, CampaignPayload>();
  for (const row of eligible) {
    const type = normalizeType(row.type);
    if (pickedByType.has(type)) continue;
    pickedByType.set(type, toCampaignPayload(row));
  }

  return Array.from(pickedByType.values());
}

export async function trackCampaignEvent(args: {
  campaignId: string;
  actor: Actor;
  event: CampaignEvent;
}) {
  const exists = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, args.campaignId))
    .then((rows) => rows[0] ?? null);
  if (!exists) return false;

  await db.insert(campaign_impressions).values({
    campaign_id: args.campaignId,
    user_id: args.actor.userId,
    guest_key: args.actor.guestKey,
    event: args.event,
  });
  return true;
}

export async function getCampaignsPage(opts?: {
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 12,
      maxPageSize: 100,
    },
  );

  const totalRow = (
    await db.select({ cnt: sql`COUNT(*)::int` }).from(campaigns)
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  const rows = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.created_at))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function getCampaignById(id: string) {
  return (
    (await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1)).at(
      0,
    ) ?? null
  );
}

export async function createCampaign(input: CampaignAdminInput) {
  const row = await db
    .insert(campaigns)
    .values({
      name: input.name,
      type: input.type,
      title: input.title,
      body: input.body,
      media_url: input.media_url,
      cta_label: input.cta_label,
      cta_url: input.cta_url,
      audience: input.audience,
      is_active: input.is_active,
      start_at: input.start_at,
      end_at: input.end_at,
      priority: input.priority,
      trigger_delay_seconds: input.trigger_delay_seconds,
      frequency_mode: input.frequency_mode,
      frequency_max_total: input.frequency_max_total,
      updated_at: new Date(),
    })
    .returning({ id: campaigns.id })
    .then((rows) => rows[0] ?? null);

  return row?.id ? String(row.id) : null;
}

export async function updateCampaignById(
  id: string,
  input: CampaignAdminInput,
) {
  await db
    .update(campaigns)
    .set({
      name: input.name,
      type: input.type,
      title: input.title,
      body: input.body,
      media_url: input.media_url,
      cta_label: input.cta_label,
      cta_url: input.cta_url,
      audience: input.audience,
      is_active: input.is_active,
      start_at: input.start_at,
      end_at: input.end_at,
      priority: input.priority,
      trigger_delay_seconds: input.trigger_delay_seconds,
      frequency_mode: input.frequency_mode,
      frequency_max_total: input.frequency_max_total,
      updated_at: new Date(),
    })
    .where(eq(campaigns.id, id));
}

export async function deleteCampaignById(id: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(campaign_impressions)
      .where(eq(campaign_impressions.campaign_id, id));
    await tx.delete(campaigns).where(eq(campaigns.id, id));
  });
}

async function getUserCreatedAt(userId: string) {
  const row = await db
    .select({ created_at: users.created_at })
    .from(users)
    .where(eq(users.id, userId))
    .then((rows) => rows[0] ?? null);
  return row?.created_at ?? null;
}

function isNewUser(createdAt: Date | null, now: Date) {
  if (!createdAt) return false;
  const ms = now.getTime() - createdAt.getTime();
  return ms <= NEW_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function audiencePasses(
  audience: CampaignAudience,
  userId: string | null,
  userIsNew: boolean,
) {
  if (audience === "all") return true;
  if (audience === "guest") return !userId;
  if (audience === "new_user") return !!userId && userIsNew;
  if (audience === "returning") return !!userId && !userIsNew;
  return false;
}

async function getShownStats(args: {
  campaignIds: string[];
  actor: Actor;
}): Promise<Map<string, ImpressionStats>> {
  const result = new Map<string, ImpressionStats>();
  if (args.campaignIds.length === 0) return result;
  if (!args.actor.userId && !args.actor.guestKey) return result;

  const actorFilter = args.actor.userId
    ? eq(campaign_impressions.user_id, args.actor.userId)
    : eq(campaign_impressions.guest_key, args.actor.guestKey ?? "");

  const rows = await db
    .select({
      campaignId: campaign_impressions.campaign_id,
      shownCount: sql<number>`COUNT(*)::int`,
      lastShownAt: sql<Date | null>`MAX(${campaign_impressions.created_at})`,
    })
    .from(campaign_impressions)
    .where(
      and(
        inArray(campaign_impressions.campaign_id, args.campaignIds),
        eq(campaign_impressions.event, "shown"),
        actorFilter,
      ),
    )
    .groupBy(campaign_impressions.campaign_id);

  for (const row of rows) {
    result.set(String(row.campaignId), {
      shownCount: Number(row.shownCount ?? 0),
      lastShownAt: row.lastShownAt ?? null,
    });
  }
  return result;
}

function toCampaignPayload(
  row: typeof campaigns.$inferSelect,
): CampaignPayload {
  return {
    id: String(row.id),
    name: row.name,
    type: normalizeType(row.type),
    title: row.title,
    body: row.body ?? null,
    mediaUrl: row.media_url ?? null,
    ctaLabel: row.cta_label ?? null,
    ctaUrl: row.cta_url ?? null,
    audience: normalizeAudience(row.audience),
    frequencyMode: normalizeFrequencyMode(row.frequency_mode),
    frequencyMaxTotal:
      row.frequency_max_total == null ? null : Number(row.frequency_max_total),
    startAt: row.start_at ?? null,
    endAt: row.end_at ?? null,
    priority: Number(row.priority ?? 1),
    triggerDelaySeconds: Number(row.trigger_delay_seconds ?? 0),
  };
}

function normalizeType(value: string | null | undefined): CampaignType {
  if (value === "popup" || value === "banner" || value === "flash_strip") {
    return value;
  }
  return "popup";
}

function normalizeAudience(value: string | null | undefined): CampaignAudience {
  if (
    value === "all" ||
    value === "guest" ||
    value === "new_user" ||
    value === "returning"
  ) {
    return value;
  }
  return "all";
}

function normalizeFrequencyMode(
  value: string | null | undefined,
): CampaignFrequencyMode {
  if (
    value === "once_per_session" ||
    value === "once_per_day" ||
    value === "max_total"
  ) {
    return value;
  }
  return "once_per_session";
}
