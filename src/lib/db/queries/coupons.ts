// src/lib/db/queries/coupons.ts
import { and, desc, eq, sql } from "drizzle-orm";
import { carts, coupon_redemptions, coupons, orders, users } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";

type CouponsPageOpts = {
  page?: number;
  pageSize?: number;
};

type CouponUpdatePayload = Partial<{
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: string | number;
  min_order_amount: string | number | null;
  max_redemptions: number | null;
  per_customer_limit: number;
  starts_at: Date | null;
  expires_at: Date | null;
  active: boolean;
}>;

export async function getCouponsPage(opts?: CouponsPageOpts) {
  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 10,
      maxPageSize: 100,
    },
  );

  const totalRow = (
    await db.select({ cnt: sql`COUNT(*)::int` }).from(coupons)
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      description: coupons.description,
      discount_type: coupons.discount_type,
      discount_value: coupons.discount_value,
      active: coupons.active,
      starts_at: coupons.starts_at,
      expires_at: coupons.expires_at,
      created_at: coupons.created_at,
    })
    .from(coupons)
    .orderBy(desc(coupons.created_at))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function getAllCoupons() {
  const { rows } = await getCouponsPage({
    page: 1,
    pageSize: 200,
  });
  return rows;
}

export async function getCouponById(id: string) {
  const coupon = (
    await db.select().from(coupons).where(eq(coupons.id, id)).limit(1)
  ).at(0);
  if (!coupon) return null;

  const totalRedemptionsRow = (
    await db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(coupon_redemptions)
      .where(eq(coupon_redemptions.coupon_id, id))
  ).at(0);
  const totalRedemptions = Number(totalRedemptionsRow?.cnt ?? 0);

  const redemptions = await db
    .select({
      id: coupon_redemptions.id,
      user_id: coupon_redemptions.user_id,
      order_id: coupon_redemptions.order_id,
      created_at: coupon_redemptions.created_at,
      user_email: users.email,
      order_total: orders.total_amount,
    })
    .from(coupon_redemptions)
    .leftJoin(users, eq(users.id, coupon_redemptions.user_id))
    .leftJoin(orders, eq(orders.id, coupon_redemptions.order_id))
    .where(eq(coupon_redemptions.coupon_id, id))
    .orderBy(desc(coupon_redemptions.created_at))
    .limit(50);

  return { coupon, totalRedemptions, redemptions };
}

export async function updateCouponById(
  id: string,
  payload: CouponUpdatePayload,
) {
  await db
    .update(coupons)
    .set({
      code: payload.code,
      description: payload.description ?? null,
      discount_type: payload.discount_type,
      discount_value:
        payload.discount_value == null ? undefined : String(payload.discount_value),
      min_order_amount:
        payload.min_order_amount == null ? null : String(payload.min_order_amount),
      max_redemptions: payload.max_redemptions ?? null,
      per_customer_limit: payload.per_customer_limit ?? 1,
      starts_at: payload.starts_at ?? null,
      expires_at: payload.expires_at ?? null,
      active: payload.active ?? false,
    })
    .where(eq(coupons.id, id));
  return getCouponById(id);
}

export async function deleteCouponById(id: string) {
  await db.transaction(async (tx) => {
    const coupon = (
      await tx
        .select({ code: coupons.code })
        .from(coupons)
        .where(eq(coupons.id, id))
        .limit(1)
    ).at(0);

    if (!coupon) return;

    await tx
      .update(carts)
      .set({ coupon_code: "" })
      .where(eq(carts.coupon_code, coupon.code));

    await tx
      .delete(coupon_redemptions)
      .where(eq(coupon_redemptions.coupon_id, id));

    await tx.delete(coupons).where(eq(coupons.id, id));
  });

  return true;
}

export async function setCouponActive(id: string, active: boolean) {
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
  return (
    await db.select().from(coupons).where(eq(coupons.id, id)).limit(1)
  ).at(0);
}

export async function findCouponByCode(code: string) {
  return (
    (await db.select().from(coupons).where(eq(coupons.code, code))).at(0) ??
    null
  );
}

export async function countCouponRedemptions(couponId: number | string) {
  const rows = await db
    .select({ cnt: sql`COUNT(*)::int` })
    .from(coupon_redemptions)
    .where(eq(coupon_redemptions.coupon_id, couponId.toString()));
  return Number(rows?.[0]?.cnt ?? 0);
}

export async function countCouponRedemptionsForUser(
  couponId: number | string,
  userId: string | null,
) {
  if (!userId) return 0;
  const rows = await db
    .select({ cnt: sql`COUNT(*)::int` })
    .from(coupon_redemptions)
    .where(
      and(
        eq(coupon_redemptions.coupon_id, couponId.toString()),
        eq(coupon_redemptions.user_id, userId),
      ),
    );
  return Number(rows?.[0]?.cnt ?? 0);
}
