import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { order_status_history, orders, users } from "@/db/schema";
import { db } from "@/db/server";
import { sendPaymentConfirmedEmail } from "@/lib/notifications/orders";
import {
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from "@/lib/payments/paystack";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const validSignature = verifyPaystackWebhookSignature(rawBody, signature);
    if (!validSignature) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookEvent;
    if (payload.event !== "charge.success") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const reference = String(payload.data?.reference ?? "").trim();
    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "Missing transaction reference" },
        { status: 400 },
      );
    }

    const verified = await verifyPaystackTransaction(reference);
    const metadata = (verified.metadata ?? {}) as Record<string, unknown>;
    const orderId = String(metadata.orderId ?? "").trim();
    const metadataUserId = String(metadata.userId ?? "").trim();

    if (!orderId || String(verified.status).toLowerCase() !== "success") {
      return NextResponse.json(
        { ok: false, error: "Invalid verified transaction payload" },
        { status: 400 },
      );
    }

    const orderRow = await db
      .select({
        id: orders.id,
        user_id: orders.user_id,
        total_amount: orders.total_amount,
        currency: orders.currency,
        status: orders.status,
        payment_status: orders.payment_status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .then((rows) => rows[0] ?? null);

    if (!orderRow) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const expectedAmountMinor = Math.round(
      Number(orderRow.total_amount ?? 0) * 100,
    );
    const paidAmountMinor = Number(verified.amount ?? 0);
    const amountMatches =
      expectedAmountMinor > 0 && expectedAmountMinor === paidAmountMinor;
    const currencyMatches =
      String(orderRow.currency ?? "").toUpperCase() ===
      String(verified.currency ?? "").toUpperCase();
    const userMatches =
      metadataUserId.length > 0 &&
      String(orderRow.user_id ?? "") === String(metadataUserId);

    if (!amountMatches || !currencyMatches || !userMatches) {
      return NextResponse.json(
        { ok: false, error: "Transaction does not match order" },
        { status: 400 },
      );
    }

    if (String(orderRow.payment_status ?? "").toLowerCase() !== "paid") {
      const nextStatus =
        String(orderRow.status ?? "").toLowerCase() === "pending"
          ? "processing"
          : orderRow.status;

      await db
        .update(orders)
        .set({
          payment_status: "paid",
          status: nextStatus,
          updated_at: new Date(),
        })
        .where(
          and(eq(orders.id, orderId), eq(orders.user_id, orderRow.user_id)),
        );

      if (String(orderRow.status ?? "") !== String(nextStatus ?? "")) {
        await db.insert(order_status_history).values({
          order_id: orderId,
          from_status: String(orderRow.status ?? "pending"),
          to_status: String(nextStatus ?? "processing"),
          actor: "payment",
          changed_by_user_id: orderRow.user_id,
          note: "Paystack webhook payment confirmed",
        });
      }

      const userRow = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, orderRow.user_id))
        .then((rows) => rows[0] ?? null);
      if (userRow?.email) {
        try {
          await sendPaymentConfirmedEmail({
            to: userRow.email,
            orderId,
            totalAmount: orderRow.total_amount,
            currency: orderRow.currency,
          });
        } catch (mailErr) {
          console.error("Webhook payment email failed:", mailErr);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/payments/paystack/webhook error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Webhook failed",
      },
      { status: 500 },
    );
  }
}
