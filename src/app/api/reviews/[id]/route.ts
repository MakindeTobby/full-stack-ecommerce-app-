import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateOwnReviewById } from "@/lib/db/queries/reviews";
import { reviewInputSchema } from "@/lib/validation/review";

export async function PATCH(
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
    const reviewId = String(id ?? "").trim();
    if (!reviewId) {
      return NextResponse.json(
        { ok: false, error: "Missing review id" },
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
      const row = await updateOwnReviewById({
        reviewId,
        userId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      });
      if (!row) {
        return NextResponse.json(
          { ok: false, error: "Review not found" },
          { status: 404 },
        );
      }
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
        error: err instanceof Error ? err.message : "Failed to update review",
      },
      { status: 500 },
    );
  }
}
