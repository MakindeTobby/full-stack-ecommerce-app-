import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { trackCampaignEvent } from "@/lib/db/queries/campaigns";

const GUEST_COOKIE = "qb_guest_key";

const eventSchema = z.object({
  event: z.enum(["shown", "clicked", "dismissed"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const campaignId = String(id ?? "").trim();
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Missing campaign id" },
        { status: 400 },
      );
    }

    const parsed = eventSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid event payload" },
        { status: 400 },
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });
    const userId = token?.id ? String(token.id) : null;
    let guestKey = req.cookies.get(GUEST_COOKIE)?.value ?? null;
    let shouldSetGuestCookie = false;
    if (!userId && !guestKey) {
      guestKey = crypto.randomUUID();
      shouldSetGuestCookie = true;
    }

    const saved = await trackCampaignEvent({
      campaignId,
      actor: { userId, guestKey },
      event: parsed.data.event,
    });
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    const res = NextResponse.json({ ok: true });
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
    console.error("POST /api/campaigns/[id]/event error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to track event",
      },
      { status: 500 },
    );
  }
}
