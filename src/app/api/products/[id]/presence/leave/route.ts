import { type NextRequest, NextResponse } from "next/server";
import { leaveProductViewer } from "@/lib/realtime/productPresence";

export const dynamic = "force-dynamic";

export async function POST(
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

  let viewerId: string | null = null;
  try {
    const body = (await req.json()) as { viewerId?: unknown };
    if (typeof body.viewerId === "string" && body.viewerId.trim()) {
      viewerId = body.viewerId.trim();
    }
  } catch {
    viewerId = null;
  }

  if (!viewerId) {
    return NextResponse.json({ ok: true });
  }

  leaveProductViewer(productId, viewerId);
  return NextResponse.json({ ok: true });
}
