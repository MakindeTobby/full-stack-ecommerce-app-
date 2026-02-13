import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { carts, coupon_redemptions, coupons } from "@/db/schema";
import { db } from "@/db/server";
import { getCartById } from "@/lib/db/queries/cart";
import { applyCouponSchema } from "@/lib/validation/cart";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;
    const cookieStore = await cookies();
    const qb = cookieStore.get("qb_session")?.value ?? null;

    const body = await req.json();
    const input = applyCouponSchema.parse(body);
    const { cartId, couponCode } = input;

    const code = String(couponCode ?? "")
      .trim()
      .toUpperCase();

    const cartRow = (
      await db.select().from(carts).where(eq(carts.id, cartId)).limit(1)
    ).at(0);

    if (!cartRow) {
      return NextResponse.json(
        { ok: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    const isOwnedBySessionUser =
      !!sessionUserId &&
      !!cartRow.user_id &&
      String(cartRow.user_id) === String(sessionUserId);

    const isOwnedByGuestSession =
      !cartRow.user_id &&
      !!cartRow.session_token &&
      !!qb &&
      String(cartRow.session_token) === String(qb);

    if (!isOwnedBySessionUser && !isOwnedByGuestSession) {
      return NextResponse.json(
        { ok: false, error: "Not authorized to apply coupon to this cart" },
        { status: 403 },
      );
    }

    if (String(cartRow.coupon_code ?? "") === code) {
      return NextResponse.json(
        { ok: false, error: "Coupon already applied to this cart" },
        { status: 409 },
      );
    }

    const couponRow = (
      await db.select().from(coupons).where(eq(coupons.code, code)).limit(1)
    ).at(0);

    if (!couponRow) {
      return NextResponse.json(
        { ok: false, error: "Invalid coupon" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (!couponRow.active) {
      return NextResponse.json(
        { ok: false, error: "Coupon inactive" },
        { status: 400 },
      );
    }

    if (couponRow.starts_at && new Date(couponRow.starts_at) > now) {
      return NextResponse.json(
        { ok: false, error: "Coupon not started" },
        { status: 400 },
      );
    }

    if (couponRow.expires_at && new Date(couponRow.expires_at) < now) {
      return NextResponse.json(
        { ok: false, error: "Coupon expired" },
        { status: 400 },
      );
    }

    if (couponRow.max_redemptions) {
      const usedRows = await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(coupon_redemptions)
        .where(eq(coupon_redemptions.coupon_id, couponRow.id));

      const used = readCount(usedRows.at(0));
      if (used >= Number(couponRow.max_redemptions)) {
        return NextResponse.json(
          { ok: false, error: "Coupon has reached max redemptions" },
          { status: 400 },
        );
      }
    }

    if (couponRow.per_customer_limit && sessionUserId) {
      const usedByUserRows = await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(coupon_redemptions)
        .where(
          and(
            eq(coupon_redemptions.coupon_id, couponRow.id),
            eq(coupon_redemptions.user_id, sessionUserId),
          ),
        );

      const usedByUser = readCount(usedByUserRows.at(0));
      if (usedByUser >= Number(couponRow.per_customer_limit)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Coupon redemption limit reached for this customer",
          },
          { status: 400 },
        );
      }
    }

    const cart = await getCartById(cartId);
    if (!cart) {
      return NextResponse.json(
        { ok: false, error: "Cart not found" },
        { status: 404 },
      );
    }

    const subtotal = Number(cart.subTotal ?? "0");

    if (
      couponRow.min_order_amount &&
      Number(couponRow.min_order_amount) > subtotal
    ) {
      return NextResponse.json(
        { ok: false, error: "Cart does not meet coupon minimum" },
        { status: 400 },
      );
    }

    await db
      .update(carts)
      .set({ coupon_code: code })
      .where(eq(carts.id, cartId));

    let discount = 0;
    if (couponRow.discount_type === "percent") {
      discount = subtotal * (Number(couponRow.discount_value) / 100);
    } else {
      discount = Number(couponRow.discount_value);
    }

    const total = Math.max(0, subtotal - discount);
    const updatedCart = await getCartById(cartId);

    return NextResponse.json({
      ok: true,
      coupon: {
        code,
        discount_type: couponRow.discount_type,
        discount_value: String(couponRow.discount_value),
        discount_amount: discount.toFixed(2),
      },
      totals: {
        subTotal: updatedCart?.subTotal || 0,
        discount: discount.toFixed(2),
        total: total.toFixed(2),
      },
      cart: updatedCart,
    });
  } catch (err: unknown) {
    if (isZodError(err)) {
      return NextResponse.json(
        { error: "Invalid input", details: getErrDetails(err) },
        { status: 400 },
      );
    }

    console.error("/api/cart/apply-coupon error", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

function isZodError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as { name?: unknown }).name === "ZodError";
}

function getErrDetails(err: unknown): unknown {
  if (!err || typeof err !== "object") return undefined;
  return (err as { errors?: unknown }).errors;
}

function readCount(row: unknown): number {
  if (!row || typeof row !== "object") return 0;
  const cnt = (row as { cnt?: unknown }).cnt;
  return Number(cnt ?? 0);
}
