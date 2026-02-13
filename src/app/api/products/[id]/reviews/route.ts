import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getProductReviewsBundle,
  upsertUserProductReview,
} from "@/lib/db/queries/reviews";
import { reviewInputSchema } from "@/lib/validation/review";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = String(id ?? "").trim();
    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Missing product id" },
        { status: 400 },
      );
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = token?.id ? String(token.id) : null;

    const data = await getProductReviewsBundle({ productId, userId });
    return NextResponse.json({ ok: true, ...data });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to load reviews",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = token?.id ? String(token.id) : null;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const productId = String(id ?? "").trim();
    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Missing product id" },
        { status: 400 },
      );
    }

    const parsed = reviewInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    try {
      const row = await upsertUserProductReview({
        userId,
        productId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      });
      return NextResponse.json({ ok: true, review: row });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "REVIEW_NOT_ELIGIBLE") {
        return NextResponse.json(
          {
            ok: false,
            error: "You can only review products from your delivered orders.",
          },
          { status: 403 },
        );
      }
      throw err;
    }
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to submit review",
      },
      { status: 500 },
    );
  }
}
