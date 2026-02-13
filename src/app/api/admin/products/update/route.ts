// app/api/admin/products/update/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateProductTransaction } from "@/lib/db/transactions/products";

export async function POST(req: NextRequest) {
  try {
    // ensure admin
    await requireAdmin(req);

    const body = await req.json();
    const productId = body.productId;
    if (!productId)
      return NextResponse.json(
        { ok: false, error: "productId required" },
        { status: 400 },
      );

    // Expect body to contain fields: name_en, base_price, sku, published, variants (array), images (optional)
    const payload = {
      slug: body.slug,
      category_id: body.category_id ?? null,
      name_en: body.name_en,
      description: body.description ?? null,
      base_price: body.base_price,
      sku: body.sku ?? null,
      published: Boolean(body.published),
      images: Array.isArray(body.images) ? body.images : undefined,
      variants: Array.isArray(body.variants) ? body.variants : undefined,
      bulk_pricing: Array.isArray(body.bulk_pricing)
        ? body.bulk_pricing
        : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
    };

    await updateProductTransaction(productId, payload);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("api update product error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status?: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "update failed",
      },
      { status },
    );
  }
}
