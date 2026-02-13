import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActiveCampaignsForActor } from "@/lib/db/queries/campaigns";

const GUEST_COOKIE = "qb_guest_key";

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });
    const userId = token?.id ? String(token.id) : null;

    let guestKey = req.cookies.get(GUEST_COOKIE)?.value ?? null;
    let shouldSetGuestCookie = false;
    if (!userId && !guestKey) {
      guestKey = crypto.randomUUID();
      shouldSetGuestCookie = true;
    }

    const campaigns = await getActiveCampaignsForActor({
      userId,
      guestKey,
    });

    const res = NextResponse.json({
      ok: true,
      campaigns,
    });

    if (shouldSetGuestCookie && guestKey) {
      res.cookies.set({
        name: GUEST_COOKIE,
        value: guestKey,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (err: unknown) {
    console.error("GET /api/campaigns/active error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to fetch campaigns",
      },
      { status: 500 },
    );
  }
}
