import { and, desc, eq, sql } from "drizzle-orm";
import {
  order_items,
  orders,
  product_reviews,
  products,
  users,
} from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";

export type ReviewStatus = "pending" | "approved" | "rejected";

export async function getProductReviewsBundle(args: {
  productId: string;
  userId?: string | null;
}) {
  const [summary, reviews, mine, canReview] = await Promise.all([
    getReviewSummary(args.productId),
    getApprovedReviews(args.productId),
    args.userId ? getUserReviewForProduct(args.userId, args.productId) : null,
    args.userId ? canUserReviewProduct(args.userId, args.productId) : false,
  ]);

  return { summary, reviews, mine, canReview };
}

export async function upsertUserProductReview(args: {
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
}) {
  const eligibility = await getReviewEligibility(args.userId, args.productId);
  if (!eligibility.ok) {
    throw new Error("REVIEW_NOT_ELIGIBLE");
  }

  const existing = await getUserReviewForProduct(args.userId, args.productId);
  if (existing) {
    const nextStatus: ReviewStatus =
      existing.status === "approved"
        ? "pending"
        : normalizeReviewStatus(existing.status);

    const row = await db
      .update(product_reviews)
      .set({
        rating: args.rating,
        title: args.title,
        body: args.body,
        status: nextStatus,
        is_verified_purchase: true,
        order_id: eligibility.orderId,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(product_reviews.id, existing.id),
          eq(product_reviews.user_id, args.userId),
        ),
      )
      .returning()
      .then((rows) => rows[0] ?? null);
    return row;
  }

  const row = await db
    .insert(product_reviews)
    .values({
      product_id: args.productId,
      user_id: args.userId,
      order_id: eligibility.orderId,
      rating: args.rating,
      title: args.title,
      body: args.body,
      status: "pending",
      is_verified_purchase: true,
      updated_at: new Date(),
    })
    .returning()
    .then((rows) => rows[0] ?? null);

  return row;
}

export async function updateOwnReviewById(args: {
  reviewId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
}) {
  const mine = await db
    .select({
      id: product_reviews.id,
      productId: product_reviews.product_id,
    })
    .from(product_reviews)
    .where(
      and(
        eq(product_reviews.id, args.reviewId),
        eq(product_reviews.user_id, args.userId),
      ),
    )
    .then((rows) => rows[0] ?? null);
  if (!mine) return null;

  const eligibility = await getReviewEligibility(
    args.userId,
    String(mine.productId),
  );
  if (!eligibility.ok) {
    throw new Error("REVIEW_NOT_ELIGIBLE");
  }

  return db
    .update(product_reviews)
    .set({
      rating: args.rating,
      title: args.title,
      body: args.body,
      status: "pending",
      is_verified_purchase: true,
      order_id: eligibility.orderId,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(product_reviews.id, args.reviewId),
        eq(product_reviews.user_id, args.userId),
      ),
    )
    .returning()
    .then((rows) => rows[0] ?? null);
}

export async function getPendingReviewsPage(opts?: {
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 20,
      maxPageSize: 100,
    },
  );

  const totalRow = (
    await db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(product_reviews)
      .where(eq(product_reviews.status, "pending"))
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  const rows = await db
    .select({
      id: product_reviews.id,
      product_id: product_reviews.product_id,
      rating: product_reviews.rating,
      title: product_reviews.title,
      body: product_reviews.body,
      status: product_reviews.status,
      is_verified_purchase: product_reviews.is_verified_purchase,
      created_at: product_reviews.created_at,
      user_name: users.name,
      user_email: users.email,
      product_name: products.name_en,
      product_slug: products.slug,
    })
    .from(product_reviews)
    .innerJoin(users, eq(users.id, product_reviews.user_id))
    .innerJoin(products, eq(products.id, product_reviews.product_id))
    .where(eq(product_reviews.status, "pending"))
    .orderBy(desc(product_reviews.created_at))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function setReviewModerationStatus(args: {
  reviewId: string;
  status: ReviewStatus;
}) {
  return db
    .update(product_reviews)
    .set({ status: args.status, updated_at: new Date() })
    .where(eq(product_reviews.id, args.reviewId))
    .returning()
    .then((rows) => rows[0] ?? null);
}

async function getReviewEligibility(userId: string, productId: string) {
  const row = await db
    .select({
      orderId: orders.id,
    })
    .from(order_items)
    .innerJoin(orders, eq(orders.id, order_items.order_id))
    .where(
      and(
        eq(order_items.product_id, productId),
        eq(orders.user_id, userId),
        eq(orders.status, "delivered"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return row
    ? { ok: true as const, orderId: String(row.orderId) }
    : { ok: false as const, orderId: null };
}

async function canUserReviewProduct(userId: string, productId: string) {
  const eligibility = await getReviewEligibility(userId, productId);
  return eligibility.ok;
}

async function getUserReviewForProduct(userId: string, productId: string) {
  return (
    (
      await db
        .select({
          id: product_reviews.id,
          rating: product_reviews.rating,
          title: product_reviews.title,
          body: product_reviews.body,
          status: product_reviews.status,
          is_verified_purchase: product_reviews.is_verified_purchase,
          created_at: product_reviews.created_at,
          updated_at: product_reviews.updated_at,
        })
        .from(product_reviews)
        .where(
          and(
            eq(product_reviews.user_id, userId),
            eq(product_reviews.product_id, productId),
          ),
        )
        .limit(1)
    ).at(0) ?? null
  );
}

async function getApprovedReviews(productId: string) {
  return db
    .select({
      id: product_reviews.id,
      rating: product_reviews.rating,
      title: product_reviews.title,
      body: product_reviews.body,
      is_verified_purchase: product_reviews.is_verified_purchase,
      created_at: product_reviews.created_at,
      user_name: users.name,
    })
    .from(product_reviews)
    .innerJoin(users, eq(users.id, product_reviews.user_id))
    .where(
      and(
        eq(product_reviews.product_id, productId),
        eq(product_reviews.status, "approved"),
      ),
    )
    .orderBy(desc(product_reviews.created_at))
    .limit(100);
}

async function getReviewSummary(productId: string) {
  const rows = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      avg: sql<number>`COALESCE(AVG(${product_reviews.rating}::numeric), 0)::numeric`,
      one: sql<number>`SUM(CASE WHEN ${product_reviews.rating} = 1 THEN 1 ELSE 0 END)::int`,
      two: sql<number>`SUM(CASE WHEN ${product_reviews.rating} = 2 THEN 1 ELSE 0 END)::int`,
      three: sql<number>`SUM(CASE WHEN ${product_reviews.rating} = 3 THEN 1 ELSE 0 END)::int`,
      four: sql<number>`SUM(CASE WHEN ${product_reviews.rating} = 4 THEN 1 ELSE 0 END)::int`,
      five: sql<number>`SUM(CASE WHEN ${product_reviews.rating} = 5 THEN 1 ELSE 0 END)::int`,
    })
    .from(product_reviews)
    .where(
      and(
        eq(product_reviews.product_id, productId),
        eq(product_reviews.status, "approved"),
      ),
    );
  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    average: Number(row?.avg ?? 0),
    breakdown: {
      1: Number(row?.one ?? 0),
      2: Number(row?.two ?? 0),
      3: Number(row?.three ?? 0),
      4: Number(row?.four ?? 0),
      5: Number(row?.five ?? 0),
    },
  };
}

function normalizeReviewStatus(value: string | null | undefined): ReviewStatus {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  if (s === "approved" || s === "pending" || s === "rejected") {
    return s;
  }
  return "pending";
}
