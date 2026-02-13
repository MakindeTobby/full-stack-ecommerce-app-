// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PATH = "/admin";
const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If not under /admin, skip
  if (!pathname.startsWith(ADMIN_PATH)) return NextResponse.next();

  // get JWT token (NextAuth)
  const token = await getToken({ req, secret });

  // if no token -> redirect to sign-in
  if (!token) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // if role is admin allow
  if (token.role === "admin") return NextResponse.next();

  // otherwise redirect to not-authorized or home
  const notAuth = new URL("/not-authorized", req.url);
  return NextResponse.redirect(notAuth);
}

// specify matcher for admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
