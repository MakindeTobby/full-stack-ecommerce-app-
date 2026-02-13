// lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSessionServer(req?: Request) {
  // in server components use getServerSession(authOptions)
  return await getServerSession(authOptions as any);
}
