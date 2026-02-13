import { desc, eq, sql } from "drizzle-orm";
import { orders, users } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";

type OrdersPageOpts = {
  page?: number;
  pageSize?: number;
};

export async function getUserOrdersPage(userId: string, opts?: OrdersPageOpts) {
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
      .from(orders)
      .where(eq(orders.user_id, userId))
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  const rows = await db
    .select({
      id: orders.id,
      total_amount: orders.total_amount,
      status: orders.status,
      payment_status: orders.payment_status,
      created_at: orders.created_at,
    })
    .from(orders)
    .where(eq(orders.user_id, userId))
    .orderBy(desc(orders.created_at))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function getAdminOrdersPage(opts?: OrdersPageOpts) {
  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 50,
      maxPageSize: 100,
    },
  );

  const totalRow = (
    await db.select({ cnt: sql`COUNT(*)::int` }).from(orders)
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  const rows = await db
    .select({
      id: orders.id,
      total_amount: orders.total_amount,
      currency: orders.currency,
      status: orders.status,
      payment_status: orders.payment_status,
      created_at: orders.created_at,
      user_email: users.email,
      user_name: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.user_id, users.id))
    .orderBy(desc(orders.created_at))
    .limit(pageSize)
    .offset(offset);

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}
