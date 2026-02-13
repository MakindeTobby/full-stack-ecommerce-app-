// app/api/auth/postSignIn/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchUserById, isProfileComplete } from "@/lib/auth/profile";
import { mergeGuestCartToUser } from "@/lib/db/queries/cart";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token || !token.id) {
      return NextResponse.json({ ok: false, redirectTo: "/signin" });
    }

    const userId = token.id.toString();
    const user = await fetchUserById(userId);
    if (!user) return NextResponse.json({ ok: false, redirectTo: "/signin" });

    const qbCookie = req.cookies.get("qb_session")?.value ?? null;

    let mergeResult = null;
    if (qbCookie) {
      try {
        const r = await mergeGuestCartToUser({
          sessionToken: qbCookie,
          userId,
        });
        mergeResult = r || null;
      } catch (err) {
        console.error("Cart merge failed during postSignIn:", err);
        // Do not block sign-in if cart merge fails.
        mergeResult = {
          error: String(
            (err as { message?: string })?.message ?? "merge_error",
          ),
        };
      }
    }

    let redirectTo = "/";
    if (user.role === "admin") redirectTo = "/admin";
    else if (!isProfileComplete(user)) redirectTo = "/account/setup";

    const res = NextResponse.json(
      {
        ok: true,
        redirectTo,
        merge: mergeResult,
      },
      { status: 200 },
    );

    if (qbCookie) {
      res.cookies.set("qb_session", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res;
  } catch (err: unknown) {
    console.error("postSignIn error", err);
    return NextResponse.json(
      {
        ok: false,
        redirectTo: "/",
        error: err instanceof Error ? err.message : "postSignIn failed",
      },
      { status: 200 },
    );
  }
}
