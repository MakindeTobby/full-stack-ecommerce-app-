import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createOrGetCartForUser, getCartById } from "@/lib/db/queries/cart";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cartId = url.searchParams.get("cartId");

    if (cartId) {
      const cart = await getCartById(cartId);
      return NextResponse.json({ ok: true, cart });
    }

    const session: Session | null = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("qb_session")?.value ?? null;

    const cartRow = await createOrGetCartForUser({
      userId,
      sessionToken,
    });
    const cart = await getCartById(String(cartRow.id));
    return NextResponse.json({ ok: true, cart });
  } catch (err: unknown) {
    console.error("/api/cart GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
