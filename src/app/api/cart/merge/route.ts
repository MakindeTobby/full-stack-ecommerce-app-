import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { mergeGuestCartToUser } from "@/lib/db/queries/cart";

export async function POST(_req: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }
    const userId = session.user?.id;

    const cookieStore = await cookies();
    const qb = cookieStore.get("qb_session")?.value ?? null;

    if (!qb) {
      return NextResponse.json({
        ok: true,
        mergedCount: 0,
        conflicts: [],
        userCartId: null,
      });
    }

    const result = await mergeGuestCartToUser({ sessionToken: qb, userId });

    const res = NextResponse.json({ ok: true, ...result });
    res.cookies.set("qb_session", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });

    return res;
  } catch (err: unknown) {
    console.error("API /api/cart/merge error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "merge failed" },
      { status: 500 },
    );
  }
}
