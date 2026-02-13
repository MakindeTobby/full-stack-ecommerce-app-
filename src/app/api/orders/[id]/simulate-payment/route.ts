import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { order_status_history, orders } from "@/db/schema";
import { db } from "@/db/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = String(id ?? "").trim();
    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing order id" },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;
    const sessionRole = session?.user?.role ?? "customer";
    if (!sessionUserId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const orderRow = await db
      .select({
        id: orders.id,
        user_id: orders.user_id,
        payment_status: orders.payment_status,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .then((r) => r[0] ?? null);

    if (!orderRow) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const isOwner = String(orderRow.user_id ?? "") === String(sessionUserId);
    const isAdmin = sessionRole === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Not authorized for this order" },
        { status: 403 },
      );
    }

    if (String(orderRow.payment_status ?? "").toLowerCase() === "paid") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        order: orderRow,
      });
    }

    const nextStatus =
      String(orderRow.status ?? "").toLowerCase() === "pending"
        ? "processing"
        : orderRow.status;

    const updated = await db
      .update(orders)
      .set({
        payment_status: "paid",
        status: nextStatus,
        updated_at: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.user_id, orderRow.user_id)))
      .returning({
        id: orders.id,
        payment_status: orders.payment_status,
        status: orders.status,
        updated_at: orders.updated_at,
      })
      .then((r) => r[0] ?? null);

    if (String(orderRow.status ?? "") !== String(nextStatus ?? "")) {
      await db.insert(order_status_history).values({
        order_id: orderId,
        from_status: String(orderRow.status ?? "pending"),
        to_status: String(nextStatus ?? "processing"),
        actor: "payment",
        changed_by_user_id: orderRow.user_id,
        note: "Simulated payment confirmed",
      });
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (err: unknown) {
    console.error("POST /api/orders/[id]/simulate-payment error", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to simulate payment",
      },
      { status: 500 },
    );
  }
}
