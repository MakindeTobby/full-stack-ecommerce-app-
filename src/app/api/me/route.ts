import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchUserById } from "@/lib/auth/profile";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.id) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const user = await fetchUserById(String(token.id));
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, user });
  } catch (err: unknown) {
    console.error("GET /api/me error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
