import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { orders, users } from "@/db/schema";
import { db } from "@/db/server";
import {
  getAppBaseUrl,
  initializePaystackTransaction,
} from "@/lib/payments/paystack";

const initializeSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;
    const sessionRole = session?.user?.role ?? "customer";
    if (!sessionUserId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const parsed = initializeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const { orderId } = parsed.data;

    const orderRow = await db
      .select({
        id: orders.id,
        user_id: orders.user_id,
        total_amount: orders.total_amount,
        currency: orders.currency,
        payment_status: orders.payment_status,
        email: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, orderId))
      .then((rows) => rows[0] ?? null);

    if (!orderRow) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const isOwner = String(orderRow.user_id) === String(sessionUserId);
    const isAdmin = sessionRole === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Not authorized for this order" },
        { status: 403 },
      );
    }

    if (String(orderRow.payment_status ?? "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const amount = Number(orderRow.total_amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid order amount" },
        { status: 400 },
      );
    }

    const currency = String(orderRow.currency ?? "NGN").toUpperCase();
    const amountKobo = Math.round(amount * 100);
    const callbackUrl = `${getAppBaseUrl(req)}/api/payments/paystack/callback`;

    const initialized = await initializePaystackTransaction({
      email: orderRow.email,
      amountKobo,
      currency,
      callbackUrl,
      metadata: {
        orderId: String(orderRow.id),
        userId: String(orderRow.user_id),
      },
    });

    return NextResponse.json({
      ok: true,
      authorizationUrl: initialized.authorization_url,
      reference: initialized.reference,
      accessCode: initialized.access_code,
    });
  } catch (err: unknown) {
    console.error("POST /api/payments/paystack/initialize error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to initialize payment",
      },
      { status: 500 },
    );
  }
}
