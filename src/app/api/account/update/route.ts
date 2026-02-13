import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { users } from "@/db/schema";
import { db } from "@/db/server";

const bodySchema = z.object({
  userId: z.uuid().optional(),
  name: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ?? null;
    const sessionRole = session?.user?.role ?? "customer";
    if (!sessionUserId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const input = bodySchema.parse(json);
    const targetUserId = input.userId ?? sessionUserId;
    const isOwner = String(targetUserId) === String(sessionUserId);
    const isAdmin = sessionRole === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    await db
      .update(users)
      .set({ name: input.name })
      .where(eq(users.id, targetUserId));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (isZodError(err)) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: getErrDetails(err) },
        { status: 400 },
      );
    }
    console.error("account update error", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "bad" },
      { status: 400 },
    );
  }
}

function isZodError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as { name?: unknown }).name === "ZodError";
}

function getErrDetails(err: unknown): unknown {
  if (!err || typeof err !== "object") return undefined;
  return (err as { errors?: unknown }).errors;
}
