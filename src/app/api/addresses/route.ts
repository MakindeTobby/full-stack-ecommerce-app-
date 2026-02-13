import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addresses } from "@/db/schema";
import { db } from "@/db/server";
import { buildPaginationMeta, parsePaginationParams } from "@/lib/pagination";

const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(64).optional(),
  full_name: z.string().trim().min(1).max(128).optional(),
  phone: z.string().trim().max(32).optional(),
  street: z.string().trim().min(1).max(256),
  city: z.string().trim().min(1).max(128),
  state: z.string().trim().max(128).optional(),
  postal_code: z.string().trim().max(32).optional(),
  country: z.string().trim().min(2).max(128),
});

export async function GET(req: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = session.user.id as string;

    const url = new URL(req.url);
    const { page, pageSize, offset } = parsePaginationParams(url.searchParams, {
      defaultPage: 1,
      defaultPageSize: 20,
      maxPageSize: 100,
    });

    const totalRow = (
      await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(addresses)
        .where(eq(addresses.user_id, userId))
    ).at(0);
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.user_id, userId))
      .orderBy(desc(addresses.created_at))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      ok: true,
      addresses: rows,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "failed";
    console.error("GET /api/addresses error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = session.user.id as string;

    const parsed = createAddressSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid address input",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const payload = {
      user_id: userId,
      label: body.label ?? "Home",
      full_name: body.full_name ?? session.user.name ?? "",
      phone: body.phone ?? "",
      street: body.street,
      city: body.city,
      state: body.state ?? "",
      postal_code: body.postal_code ?? "",
      country: body.country,
    };

    const inserted = await db.insert(addresses).values(payload).returning();
    const addr = inserted[0];
    return NextResponse.json({ ok: true, address: addr });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "failed";
    console.error("POST /api/addresses error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
