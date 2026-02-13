// src/lib/auth/requireAdmin.ts
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { NextApiRequest } from "next";

// Accept both App Router (NextRequest) and Pages API (NextApiRequest)
type ReqLike = NextRequest | NextApiRequest;

export async function requireAdmin(req?: ReqLike) {
  const secret = process.env.NEXTAUTH_SECRET!;
  const token = req && (await getToken({ req, secret })); // ✅ req is now a compatible type

  if (!token || token.role !== "admin") {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }

  return token;
}
