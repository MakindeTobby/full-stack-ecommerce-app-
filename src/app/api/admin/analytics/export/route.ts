import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getAdminOrdersExportRows,
  getAdminRevenueSeries,
  parseAnalyticsRange,
} from "@/lib/db/queries/analytics";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const kind = (url.searchParams.get("kind") ?? "orders").trim();
    const range = parseAnalyticsRange(
      url.searchParams.get("range") ?? undefined,
    );

    if (kind !== "orders" && kind !== "revenue") {
      return NextResponse.json(
        { ok: false, error: "Invalid kind. Use orders or revenue." },
        { status: 400 },
      );
    }

    if (kind === "orders") {
      const rows = await getAdminOrdersExportRows(range);
      const csv = buildOrdersCsv(rows);
      return csvResponse(csv, `orders-${range}.csv`);
    }

    const series = await getAdminRevenueSeries(range);
    const csv = buildRevenueCsv(series.points);
    return csvResponse(csv, `revenue-${range}.csv`);
  } catch (err: unknown) {
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
        error: err instanceof Error ? err.message : "Export failed",
      },
      { status },
    );
  }
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildOrdersCsv(
  rows: Array<{
    orderId: string;
    createdAt: Date | null;
    status: string | null;
    paymentStatus: string | null;
    totalAmount: number;
    currency: string | null;
    userEmail: string | null;
  }>,
) {
  const lines = [
    [
      "order_id",
      "created_at",
      "status",
      "payment_status",
      "total_amount",
      "currency",
      "customer_email",
    ].join(","),
    ...rows.map((r) =>
      [
        csvCell(r.orderId),
        csvCell(r.createdAt ? r.createdAt.toISOString() : ""),
        csvCell(r.status ?? ""),
        csvCell(r.paymentStatus ?? ""),
        csvCell(r.totalAmount.toFixed(2)),
        csvCell(r.currency ?? ""),
        csvCell(r.userEmail ?? ""),
      ].join(","),
    ),
  ];

  return lines.join("\n");
}

function buildRevenueCsv(
  rows: Array<{
    bucket: string;
    ordersCount: number;
    paidOrders: number;
    paidRevenue: number;
  }>,
) {
  const lines = [
    ["bucket", "orders_count", "paid_orders", "paid_revenue"].join(","),
    ...rows.map((r) =>
      [
        csvCell(r.bucket),
        csvCell(String(r.ordersCount)),
        csvCell(String(r.paidOrders)),
        csvCell(r.paidRevenue.toFixed(2)),
      ].join(","),
    ),
  ];

  return lines.join("\n");
}

function csvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
