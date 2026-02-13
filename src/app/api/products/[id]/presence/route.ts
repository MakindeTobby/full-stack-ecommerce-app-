import { type NextRequest, NextResponse } from "next/server";
import {
  getActiveViewerCount,
  touchProductViewer,
} from "@/lib/realtime/productPresence";

const VIEWER_COOKIE = "qb_viewer_id";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = String(id ?? "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "Missing product id" },
      { status: 400 },
    );
  }

  let viewerId = req.cookies.get(VIEWER_COOKIE)?.value ?? null;
  let shouldSetCookie = false;
  if (!viewerId) {
    viewerId = crypto.randomUUID();
    shouldSetCookie = true;
  }

  touchProductViewer(productId, viewerId);
  const count = getActiveViewerCount(productId);

  const res = NextResponse.json({
    ok: true,
    productId,
    viewerId,
    activeViewers: count,
  });

  if (shouldSetCookie) {
    res.cookies.set({
      name: VIEWER_COOKIE,
      value: viewerId,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}
