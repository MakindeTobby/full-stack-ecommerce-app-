// app/api/admin/media/delete/route.ts
import { v2 as cloudinaryV2 } from "cloudinary";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { product_media } from "@/db/schema";
import { db } from "@/db/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const secret = process.env.NEXTAUTH_SECRET;

// configure cloudinary v2 (if not already)
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    // if requireAdmin is typed for NextRequest, this now matches
    await requireAdmin(req);

    const token = await getToken({ req, secret });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const mediaId = json.mediaId;
    if (!mediaId) {
      return NextResponse.json(
        { ok: false, error: "mediaId required" },
        { status: 400 },
      );
    }

    // fetch row
    const row = (
      await db.select().from(product_media).where(eq(product_media.id, mediaId))
    ).at(0);

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Media not found" },
        { status: 404 },
      );
    }

    // delete from cloudinary if public_id present
    if (row.public_id) {
      try {
        await cloudinaryV2.uploader.destroy(row.public_id, {
          resource_type: row.type === "video" ? "video" : "image",
        });
      } catch (err) {
        console.error("cloudinary destroy error", err);
        // decide if you want to fail or still delete DB row
      }
    }

    // delete db row
    await db.delete(product_media).where(eq(product_media.id, mediaId));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("delete media error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "delete failed",
      },
      { status: 500 },
    );
  }
}
