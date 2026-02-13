import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { carts, orders, users } from "@/db/schema";
import { db } from "@/db/server";
import { createOrderFromCart } from "@/lib/db/transactions/orders";
import { sendOrderCreatedEmail } from "@/lib/notifications/orders";

const createOrderSchema = z.object({
  cartId: z.string().min(1),
  userId: z.string().min(1).optional(),
  addressId: z.union([z.string().min(1), z.null()]).optional(),
  couponCode: z.union([z.string().min(1), z.null()]).optional(),
  currency: z.string().optional().default("NGN"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;
    if (!sessionUserId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const input = createOrderSchema.parse(await req.json());
    const {
      cartId,
      userId: clientUserId,
      addressId = null,
      couponCode = null,
      currency,
    } = input;
    const userId = sessionUserId;

    if (clientUserId && String(clientUserId) !== String(sessionUserId)) {
      return NextResponse.json(
        { ok: false, error: "Authenticated user does not match request user" },
        { status: 403 },
      );
    }

    const cartRow = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cartId))
      .orderBy(carts.created_at)
      .then((rows) => rows[0] ?? null);
    if (!cartRow) {
      return NextResponse.json(
        { ok: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    if (!cartRow.user_id || String(cartRow.user_id) !== String(userId)) {
      return NextResponse.json(
        { ok: false, error: "Cart does not belong to user" },
        { status: 403 },
      );
    }

    const result = await createOrderFromCart({
      cartId,
      userId,
      addressId,
      couponCode,
      currency,
    });

    const orderId = extractOrderId(result);
    if (!orderId) {
      console.error("createOrderFromCart returned unexpected:", result);
      return NextResponse.json(
        { ok: false, error: "Order creation failed" },
        { status: 500 },
      );
    }

    const mailRow = await db
      .select({
        email: users.email,
        total_amount: orders.total_amount,
        currency: orders.currency,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, orderId))
      .then((rows) => rows[0] ?? null);

    if (mailRow?.email) {
      try {
        await sendOrderCreatedEmail({
          to: mailRow.email,
          orderId,
          totalAmount: mailRow.total_amount,
          currency: mailRow.currency,
        });
      } catch (mailErr) {
        console.error("Order created email failed:", mailErr);
      }
    }

    return NextResponse.json({ ok: true, orderId });
  } catch (err: unknown) {
    if (isZodError(err)) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: getErrDetails(err) },
        { status: 400 },
      );
    }
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      { ok: false, error: getErrMessage(err, "Order creation failed") },
      { status: 500 },
    );
  }
}

function extractOrderId(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const root = result as Record<string, unknown>;
  const direct = root.orderId;
  if (typeof direct === "string" && direct.length > 0) return direct;
  const order = root.order;
  if (!order || typeof order !== "object") return null;
  const nested = (order as Record<string, unknown>).id;
  return typeof nested === "string" && nested.length > 0 ? nested : null;
}

function getErrMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function getErrDetails(err: unknown): unknown {
  if (!err || typeof err !== "object") return undefined;
  const details = (err as { errors?: unknown }).errors;
  return details ?? undefined;
}

function isZodError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as { name?: unknown }).name === "ZodError";
}
