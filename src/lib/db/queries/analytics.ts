import { and, eq, gte, sql } from "drizzle-orm";
import {
  carts,
  categories,
  order_items,
  orders,
  products,
  users,
} from "@/db/schema";
import { db } from "@/db/server";

export type AnalyticsRangeKey = "7d" | "30d" | "90d" | "mtd" | "all";

type KeyValueCount = {
  key: string;
  count: number;
};

type TopProductRow = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
};

export type RevenueSeriesPoint = {
  bucket: string;
  ordersCount: number;
  paidOrders: number;
  paidRevenue: number;
};

export type RevenueSeries = {
  granularity: "day" | "month";
  points: RevenueSeriesPoint[];
};

export type AdminOrdersExportRow = {
  orderId: string;
  createdAt: Date | null;
  status: string | null;
  paymentStatus: string | null;
  totalAmount: number;
  currency: string | null;
  userEmail: string | null;
};

export type AdminAnalyticsSnapshot = {
  window: {
    key: AnalyticsRangeKey;
    label: string;
    startsAt: Date | null;
  };
  counts: {
    products: number;
    orders: number;
    users: number;
    categories: number;
  };
  revenue: {
    todayPaid: number;
    last7dPaid: number;
    last30dPaid: number;
    mtdPaid: number;
    periodPaid: number;
  };
  ordersKpi: {
    paid7d: number;
    paid30d: number;
    aov30d: number;
    paidPeriod: number;
    aovPeriod: number;
  };
  funnel: {
    cartsCreated: number;
    ordersCreated: number;
    paidOrders: number;
    cartToOrderRate: number;
    orderToPaidRate: number;
  };
  distributions: {
    status: KeyValueCount[];
    payment: KeyValueCount[];
  };
  topProducts: {
    byRevenue: TopProductRow[];
    byUnits: TopProductRow[];
  };
};

export function parseAnalyticsRange(
  raw: string | undefined,
): AnalyticsRangeKey {
  if (
    raw === "7d" ||
    raw === "30d" ||
    raw === "90d" ||
    raw === "mtd" ||
    raw === "all"
  ) {
    return raw;
  }
  return "30d";
}

export async function getAdminAnalyticsSnapshot(
  range: AnalyticsRangeKey = "30d",
): Promise<AdminAnalyticsSnapshot> {
  const now = new Date();
  const startToday = startOfDay(now);
  const start7d = daysAgoStart(now, 7);
  const start30d = daysAgoStart(now, 30);
  const startMonth = startOfMonth(now);
  const periodStart = rangeStart(range, now);
  const periodLabel = rangeLabel(range);

  const [
    counts,
    revenue,
    paidKpis,
    funnelRaw,
    statusDist,
    paymentDist,
    topRevenue,
    topUnits,
  ] = await Promise.all([
    getCounts(),
    getRevenue(startToday, start7d, start30d, startMonth, periodStart),
    getPaidOrderKpis(start7d, start30d, periodStart),
    getFunnel(periodStart),
    getStatusDistribution(periodStart),
    getPaymentDistribution(periodStart),
    getTopProductsByRevenue(periodStart),
    getTopProductsByUnits(periodStart),
  ]);

  const aov30d =
    paidKpis.paid30d > 0 ? revenue.last30dPaid / paidKpis.paid30d : 0;
  const cartToOrderRate =
    funnelRaw.cartsCreated > 0
      ? (funnelRaw.ordersCreated / funnelRaw.cartsCreated) * 100
      : 0;
  const orderToPaidRate =
    funnelRaw.ordersCreated > 0
      ? (funnelRaw.paidOrders / funnelRaw.ordersCreated) * 100
      : 0;
  const aovPeriod =
    paidKpis.paidPeriod > 0 ? revenue.periodPaid / paidKpis.paidPeriod : 0;

  return {
    window: {
      key: range,
      label: periodLabel,
      startsAt: periodStart,
    },
    counts,
    revenue,
    ordersKpi: {
      paid7d: paidKpis.paid7d,
      paid30d: paidKpis.paid30d,
      aov30d,
      paidPeriod: paidKpis.paidPeriod,
      aovPeriod,
    },
    funnel: {
      ...funnelRaw,
      cartToOrderRate,
      orderToPaidRate,
    },
    distributions: {
      status: statusDist,
      payment: paymentDist,
    },
    topProducts: {
      byRevenue: topRevenue,
      byUnits: topUnits,
    },
  };
}

export async function getAdminRevenueSeries(
  range: AnalyticsRangeKey = "30d",
): Promise<RevenueSeries> {
  const now = new Date();
  const start = rangeStart(range, now);
  const useMonthly = range === "all";
  const bucket = useMonthly
    ? sql<string>`to_char(date_trunc('month', ${orders.created_at}), 'YYYY-MM')`
    : sql<string>`to_char(date_trunc('day', ${orders.created_at}), 'YYYY-MM-DD')`;
  const baseQuery = db
    .select({
      bucket,
      ordersCount: sql<number>`COUNT(*)::int`,
      paidOrders: sql<number>`SUM(CASE WHEN ${orders.payment_status} = 'paid' THEN 1 ELSE 0 END)::int`,
      paidRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.payment_status} = 'paid' THEN ${orders.total_amount}::numeric ELSE 0 END), 0)::numeric`,
    })
    .from(orders);

  const query = start ? baseQuery.where(gte(orders.created_at, start)) : baseQuery;

  const rows = await query
    .groupBy(
      useMonthly
        ? sql`date_trunc('month', ${orders.created_at})`
        : sql`date_trunc('day', ${orders.created_at})`,
    )
    .orderBy(
      useMonthly
        ? sql`date_trunc('month', ${orders.created_at}) ASC`
        : sql`date_trunc('day', ${orders.created_at}) ASC`,
    );

  return {
    granularity: useMonthly ? "month" : "day",
    points: rows.map((r) => ({
      bucket: String(r.bucket ?? ""),
      ordersCount: Number(r.ordersCount ?? 0),
      paidOrders: Number(r.paidOrders ?? 0),
      paidRevenue: Number(r.paidRevenue ?? 0),
    })),
  };
}

export async function getAdminOrdersExportRows(
  range: AnalyticsRangeKey = "30d",
): Promise<AdminOrdersExportRow[]> {
  const now = new Date();
  const start = rangeStart(range, now);
  const baseQuery = db
    .select({
      orderId: orders.id,
      createdAt: orders.created_at,
      status: orders.status,
      paymentStatus: orders.payment_status,
      totalAmount: orders.total_amount,
      currency: orders.currency,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.user_id));

  const query = start ? baseQuery.where(gte(orders.created_at, start)) : baseQuery;

  const rows = await query.orderBy(sql`${orders.created_at} DESC`);
  return rows.map((r) => ({
    orderId: String(r.orderId),
    createdAt: r.createdAt,
    status: r.status,
    paymentStatus: r.paymentStatus,
    totalAmount: Number(r.totalAmount ?? 0),
    currency: r.currency,
    userEmail: r.userEmail ?? null,
  }));
}

async function getCounts() {
  const [prodRows, orderRows, userRows, categoryRows] = await Promise.all([
    db.select({ cnt: sql`COUNT(*)::int` }).from(products),
    db.select({ cnt: sql`COUNT(*)::int` }).from(orders),
    db.select({ cnt: sql`COUNT(*)::int` }).from(users),
    db.select({ cnt: sql`COUNT(*)::int` }).from(categories),
  ]);

  return {
    products: readCount(prodRows[0]),
    orders: readCount(orderRows[0]),
    users: readCount(userRows[0]),
    categories: readCount(categoryRows[0]),
  };
}

async function getRevenue(
  startToday: Date,
  start7d: Date,
  start30d: Date,
  startMonth: Date,
  periodStart: Date | null,
) {
  const [todayRows, rows7d, rows30d, monthRows, periodRows] = await Promise.all(
    [
      paidRevenueSince(startToday),
      paidRevenueSince(start7d),
      paidRevenueSince(start30d),
      paidRevenueSince(startMonth),
      paidRevenueSince(periodStart),
    ],
  );

  return {
    todayPaid: readNumber(todayRows[0], "amount"),
    last7dPaid: readNumber(rows7d[0], "amount"),
    last30dPaid: readNumber(rows30d[0], "amount"),
    mtdPaid: readNumber(monthRows[0], "amount"),
    periodPaid: readNumber(periodRows[0], "amount"),
  };
}

async function getPaidOrderKpis(
  start7d: Date,
  start30d: Date,
  periodStart: Date | null,
) {
  const [rows7d, rows30d, periodRows] = await Promise.all([
    db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(orders)
      .where(
        and(eq(orders.payment_status, "paid"), gte(orders.created_at, start7d)),
      ),
    db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, "paid"),
          gte(orders.created_at, start30d),
        ),
      ),
    countPaidOrdersSince(periodStart),
  ]);

  return {
    paid7d: readCount(rows7d[0]),
    paid30d: readCount(rows30d[0]),
    paidPeriod: readCount(periodRows[0]),
  };
}

async function getFunnel(start: Date | null) {
  const [cartRows, orderRows, paidRows] = await Promise.all([
    countCartsSince(start),
    countOrdersSince(start),
    countPaidOrdersSince(start),
  ]);

  return {
    cartsCreated: readCount(cartRows[0]),
    ordersCreated: readCount(orderRows[0]),
    paidOrders: readCount(paidRows[0]),
  };
}

async function getStatusDistribution(
  start: Date | null,
): Promise<KeyValueCount[]> {
  const baseQuery = db
    .select({
      key: sql<string>`COALESCE(${orders.status}, 'unknown')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders);

  const query = start ? baseQuery.where(gte(orders.created_at, start)) : baseQuery;

  const rows = await query.groupBy(orders.status).orderBy(sql`COUNT(*) DESC`);
  return rows.map((r) => ({ key: String(r.key), count: Number(r.count ?? 0) }));
}

async function getPaymentDistribution(
  start: Date | null,
): Promise<KeyValueCount[]> {
  const baseQuery = db
    .select({
      key: sql<string>`COALESCE(${orders.payment_status}, 'unknown')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(orders);

  const query = start ? baseQuery.where(gte(orders.created_at, start)) : baseQuery;

  const rows = await query
    .groupBy(orders.payment_status)
    .orderBy(sql`COUNT(*) DESC`);
  return rows.map((r) => ({ key: String(r.key), count: Number(r.count ?? 0) }));
}

async function getTopProductsByRevenue(
  start: Date | null,
): Promise<TopProductRow[]> {
  const baseQuery = db
    .select({
      productId: products.id,
      name: products.name_en,
      units: sql<number>`COALESCE(SUM(${order_items.quantity}), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(${order_items.quantity} * ${order_items.unit_price}::numeric), 0)::numeric`,
    })
    .from(order_items)
    .innerJoin(orders, eq(orders.id, order_items.order_id))
    .innerJoin(products, eq(products.id, order_items.product_id));

  const query = start
    ? baseQuery.where(
        and(eq(orders.payment_status, "paid"), gte(orders.created_at, start)),
      )
    : baseQuery.where(eq(orders.payment_status, "paid"));

  const rows = await query
    .groupBy(products.id, products.name_en)
    .orderBy(
      sql`COALESCE(SUM(${order_items.quantity} * ${order_items.unit_price}::numeric), 0) DESC`,
    )
    .limit(10);

  return rows.map((r) => ({
    productId: String(r.productId),
    name: String(r.name ?? "Product"),
    units: Number(r.units ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

async function getTopProductsByUnits(
  start: Date | null,
): Promise<TopProductRow[]> {
  const baseQuery = db
    .select({
      productId: products.id,
      name: products.name_en,
      units: sql<number>`COALESCE(SUM(${order_items.quantity}), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(${order_items.quantity} * ${order_items.unit_price}::numeric), 0)::numeric`,
    })
    .from(order_items)
    .innerJoin(orders, eq(orders.id, order_items.order_id))
    .innerJoin(products, eq(products.id, order_items.product_id));

  const query = start
    ? baseQuery.where(
        and(eq(orders.payment_status, "paid"), gte(orders.created_at, start)),
      )
    : baseQuery.where(eq(orders.payment_status, "paid"));

  const rows = await query
    .groupBy(products.id, products.name_en)
    .orderBy(sql`COALESCE(SUM(${order_items.quantity}), 0) DESC`)
    .limit(10);

  return rows.map((r) => ({
    productId: String(r.productId),
    name: String(r.name ?? "Product"),
    units: Number(r.units ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

function paidRevenueSince(since: Date | null) {
  const query = db
    .select({
      amount: sql<number>`COALESCE(SUM(${orders.total_amount}::numeric), 0)::numeric`,
    })
    .from(orders);

  return since
    ? query.where(
        and(eq(orders.payment_status, "paid"), gte(orders.created_at, since)),
      )
    : query.where(eq(orders.payment_status, "paid"));
}

function countPaidOrdersSince(start: Date | null) {
  const query = db.select({ cnt: sql`COUNT(*)::int` }).from(orders);
  return start
    ? query.where(
        and(eq(orders.payment_status, "paid"), gte(orders.created_at, start)),
      )
    : query.where(eq(orders.payment_status, "paid"));
}

function countOrdersSince(start: Date | null) {
  const query = db.select({ cnt: sql`COUNT(*)::int` }).from(orders);
  return start ? query.where(gte(orders.created_at, start)) : query;
}

function countCartsSince(start: Date | null) {
  const query = db.select({ cnt: sql`COUNT(*)::int` }).from(carts);
  return start ? query.where(gte(carts.created_at, start)) : query;
}

function readCount(row: { cnt?: unknown } | undefined) {
  return Number(row?.cnt ?? 0);
}

function readNumber(row: Record<string, unknown> | undefined, key: string) {
  return Number(row?.[key] ?? 0);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgoStart(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangeStart(range: AnalyticsRangeKey, now: Date) {
  if (range === "7d") return daysAgoStart(now, 7);
  if (range === "30d") return daysAgoStart(now, 30);
  if (range === "90d") return daysAgoStart(now, 90);
  if (range === "mtd") return startOfMonth(now);
  return null;
}

function rangeLabel(range: AnalyticsRangeKey) {
  if (range === "7d") return "Last 7 days";
  if (range === "30d") return "Last 30 days";
  if (range === "90d") return "Last 90 days";
  if (range === "mtd") return "Month to date";
  return "All time";
}
