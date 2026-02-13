// app/api/order/[id]/receipt/route.ts
import { NextResponse } from "next/server";
import { generateOrderReceipt } from "@/lib/pdf/generateOrderReceipt";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing order id" },
        { status: 400 },
      );
    }

    const pdfBuffer = await generateOrderReceipt(id);

    const filename = `receipt-${String(id)}.pdf`;
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/order/[id]/receipt error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Receipt generation failed",
      },
      { status: 500 },
    );
  }
}
