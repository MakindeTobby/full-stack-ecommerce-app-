// app/api/admin/upload-image/route.ts
import { NextResponse } from "next/server";
import { uploadProductMedia } from "@/lib/actions/media";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const productIdStr = url.searchParams.get("productId");
    if (!productIdStr)
      return NextResponse.json(
        { ok: false, error: "productId required" },
        { status: 400 },
      );
    const productId = productIdStr;

    // parse multipart form-data (Request.formData available in Node runtimes)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json(
        { ok: false, error: "file missing" },
        { status: 400 },
      );

    const result = await uploadProductMedia(productId, file);
    return NextResponse.json({ ok: true, url: result.url });
  } catch (err: unknown) {
    console.error("upload-image error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "upload failed",
      },
      { status: 500 },
    );
  }
}
