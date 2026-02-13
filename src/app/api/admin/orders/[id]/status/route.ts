import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  inventory_logs,
  order_items,
  orders,
  product_variants,
  users,
} from "@/db/schema";
import { db } from "@/db/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendOrderStatusChangedEmail } from "@/lib/notifications/orders";
import { insertOrderStatusHistory } from "@/lib/orders/history";
import {
  canTransitionOrderStatus,
  normalizeOrderStatus,
  ORDER_STATUSES,
} from "@/lib/orders/status";

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  shipping_provider: z.string().trim().max(128).optional().nullable(),
  shipping_tracking: z.string().trim().max(128).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminToken = await requireAdmin(req);
    const { id } = await params;
    const orderId = String(id ?? "").trim();
    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing order id" },
        { status: 400 },
      );
    }

    const parsed = updateStatusSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const nextStatus = parsed.data.status;
    const shippingProvider = normalizeText(parsed.data.shipping_provider);
    const shippingTracking = normalizeText(parsed.data.shipping_tracking);
    const note = normalizeText(parsed.data.note);
    const adminUserId = readTokenUserId(adminToken);
    if (nextStatus === "shipped" && (!shippingProvider || !shippingTracking)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Shipping provider and tracking are required for shipped status",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const orderRow = await tx
        .select({
          id: orders.id,
          user_id: orders.user_id,
          status: orders.status,
          payment_status: orders.payment_status,
          total_amount: orders.total_amount,
          currency: orders.currency,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .then((rows) => rows[0] ?? null);
      if (!orderRow) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const currentStatus = normalizeOrderStatus(orderRow.status);
      if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
        const allowed = ORDER_STATUSES.filter((s) =>
          canTransitionOrderStatus(currentStatus, s),
        );
        return {
          ok: false as const,
          status: 400,
          error: `Invalid transition from ${currentStatus} to ${nextStatus}`,
          details: { currentStatus, allowedNext: allowed },
        };
      }

      if (currentStatus !== "cancelled" && nextStatus === "cancelled") {
        const items = await tx
          .select({
            variant_id: order_items.variant_id,
            quantity: order_items.quantity,
          })
          .from(order_items)
          .where(eq(order_items.order_id, orderId));

        for (const item of items) {
          if (!item.variant_id) continue;
          const qty = Number(item.quantity ?? 0);
          if (!Number.isFinite(qty) || qty <= 0) continue;

          await tx
            .update(product_variants)
            .set({ stock: sql`stock + ${qty}` })
            .where(eq(product_variants.id, item.variant_id));

          await tx.insert(inventory_logs).values({
            variant_id: item.variant_id,
            change: qty,
            reason: "order_cancelled",
            reference: `order:${orderId}`,
          });
        }
      }

      if (currentStatus !== nextStatus) {
        await insertOrderStatusHistory(tx, {
          orderId,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          actor: "admin",
          changedByUserId: adminUserId,
          note,
        });
      }

      const updated = await tx
        .update(orders)
        .set({
          status: nextStatus,
          shipping_provider:
            nextStatus === "shipped"
              ? shippingProvider
              : (shippingProvider ?? undefined),
          shipping_tracking:
            nextStatus === "shipped"
              ? shippingTracking
              : (shippingTracking ?? undefined),
          updated_at: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.user_id, orderRow.user_id)),
        )
        .returning({
          id: orders.id,
          status: orders.status,
          payment_status: orders.payment_status,
          shipping_provider: orders.shipping_provider,
          shipping_tracking: orders.shipping_tracking,
          updated_at: orders.updated_at,
        })
        .then((rows) => rows[0] ?? null);

      return {
        ok: true as const,
        updated,
        changed: currentStatus !== nextStatus,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        userId: String(orderRow.user_id),
        totalAmount: orderRow.total_amount,
        currency: orderRow.currency,
      };
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status },
      );
    }

    if (result.changed) {
      const userRow = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, result.userId))
        .then((rows) => rows[0] ?? null);
      if (userRow?.email) {
        try {
          const baseUrl = new URL(req.url).origin;
          await sendOrderStatusChangedEmail({
            to: userRow.email,
            orderId,
            totalAmount: result.totalAmount,
            currency: result.currency,
            fromStatus: result.fromStatus,
            toStatus: result.toStatus,
            shippingProvider: result.updated?.shipping_provider ?? null,
            shippingTracking: result.updated?.shipping_tracking ?? null,
            note,
            baseUrl,
          });
        } catch (mailErr) {
          console.error("Order status email failed:", mailErr);
        }
      }
    }

    return NextResponse.json({ ok: true, order: result.updated });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status?: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to update status",
      },
      { status },
    );
  }
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  return s.length > 0 ? s : null;
}

function readTokenUserId(token: unknown): string | null {
  if (!token || typeof token !== "object") return null;
  const value = (token as { id?: unknown }).id;
  if (typeof value !== "string") return null;
  return value.trim() || null;
}
