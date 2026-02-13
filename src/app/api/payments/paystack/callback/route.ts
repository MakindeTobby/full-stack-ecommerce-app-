import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { order_status_history, orders, users } from "@/db/schema";
import { db } from "@/db/server";
import { sendPaymentConfirmedEmail } from "@/lib/notifications/orders";
import {
  getAppBaseUrl,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = (url.searchParams.get("reference") ?? "").trim();
  if (!reference) {
    return redirect(req, "/orders?payment=failed");
  }

  try {
    const verified = await verifyPaystackTransaction(reference);
    const metadata = (verified.metadata ?? {}) as Record<string, unknown>;
    const orderId = String(metadata.orderId ?? "").trim();
    const metadataUserId = String(metadata.userId ?? "").trim();

    if (!orderId || String(verified.status).toLowerCase() !== "success") {
      return redirect(req, "/orders?payment=failed");
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
      return redirect(req, "/orders?payment=failed");
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
      return redirect(
        req,
        `/order/${encodeURIComponent(orderId)}?payment=failed`,
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
          note: "Paystack payment confirmed",
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
            baseUrl: getAppBaseUrl(req),
          });
        } catch (mailErr) {
          console.error("Payment confirmed email failed:", mailErr);
        }
      }
    }

    return redirect(
      req,
      `/order/${encodeURIComponent(orderId)}?payment=success`,
    );
  } catch (err) {
    console.error("GET /api/payments/paystack/callback error:", err);
    return redirect(req, "/orders?payment=failed");
  }
}

function redirect(req: Request, path: string) {
  const base = getAppBaseUrl(req);
  return NextResponse.redirect(new URL(path, base));
}
