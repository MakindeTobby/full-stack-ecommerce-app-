// src/lib/pdf/generateOrderReceipt.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/db/server";
import { orders, order_items, coupons, coupon_redemptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateOrderReceipt(orderId: string) {
  const orderRow = await db
    .select({
      id: orders.id,
      user_id: orders.user_id,
      total_amount: orders.total_amount,
      currency: orders.currency,
      status: orders.status,
      payment_status: orders.payment_status,
      created_at: orders.created_at,
      shipping_provider: orders.shipping_provider,
      shipping_tracking: orders.shipping_tracking,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .then((r) => r[0] ?? null);

  if (!orderRow) throw new Error("Order not found");

  const items = await db
    .select({
      id: order_items.id,
      product_id: order_items.product_id,
      name_snapshot: order_items.name_snapshot,
      sku_snapshot: order_items.sku_snapshot,
      quantity: order_items.quantity,
      unit_price: order_items.unit_price,
    })
    .from(order_items)
    .where(eq(order_items.order_id, orderRow.id));
  const appliedCoupon = await db
    .select({
      code: coupons.code,
      discount_type: coupons.discount_type,
      discount_value: coupons.discount_value,
    })
    .from(coupon_redemptions)
    .innerJoin(coupons, eq(coupon_redemptions.coupon_id, coupons.id))
    .where(eq(coupon_redemptions.order_id, orderRow.id))
    .then((r) => r[0] ?? null);

  // --- PDF-LIB PART ---
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  // Header
  page.drawText("Queen Beulah Collections", {
    x: 40,
    y,
    size: 20,
    font: boldFont,
  });

  page.drawText("Receipt", {
    x: width - 120,
    y,
    size: 12,
    font,
  });

  y -= 20;
  page.drawText(`Order #${String(orderRow.id)}`, {
    x: width - 180,
    y,
    size: 10,
    font,
  });

  y -= 30;

  // Order meta
  const dateStr = new Date(String(orderRow.created_at)).toLocaleString();
  page.drawText(`Date: ${dateStr}`, { x: 40, y, size: 10, font });
  y -= 14;
  page.drawText(
    `Status: ${orderRow.status} • Payment: ${orderRow.payment_status}`,
    { x: 40, y, size: 10, font }
  );
  y -= 14;
  if (orderRow.shipping_provider) {
    page.drawText(
      `Shipping: ${orderRow.shipping_provider}${
        orderRow.shipping_tracking ? ` • ${orderRow.shipping_tracking}` : ""
      }`,
      { x: 40, y, size: 10, font }
    );
    y -= 18;
  } else {
    y -= 10;
  }

  // Table header
  y -= 10;
  const headerY = y;
  page.drawText("Item", { x: 40, y, size: 11, font: boldFont });
  page.drawText("Qty", { x: 320, y, size: 11, font: boldFont });
  page.drawText("Unit", { x: 360, y, size: 11, font: boldFont });
  page.drawText("Total", { x: 430, y, size: 11, font: boldFont });

  // Line under header
  y -= 5;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 14;

  let runningTotal = 0;

  for (const it of items) {
    if (y < 80) {
      // new page if needed
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }

    const qty = Number(it.quantity ?? 0);
    const up = Number(it.unit_price ?? 0);
    const lineTotal = qty * up;
    runningTotal += lineTotal;

    const title = it.name_snapshot ?? it.sku_snapshot ?? "Product";

    page.drawText(title, {
      x: 40,
      y,
      size: 10,
      font,
      maxWidth: 260,
    });

    page.drawText(String(qty), {
      x: 320,
      y,
      size: 10,
      font,
    });

    page.drawText(`${up.toFixed(2)}`, {
      x: 360,
      y,
      size: 10,
      font,
    });

    page.drawText(`${lineTotal.toFixed(2)}`, {
      x: 430,
      y,
      size: 10,
      font,
    });

    y -= 14;
  }

  // Totals
  y -= 10;
  page.drawText(`Subtotal: ${runningTotal.toFixed(2)}`, {
    x: width - 200,
    y,
    size: 11,
    font,
  });
  const totalAmount = Number(orderRow.total_amount);
  const couponDiscount = Math.max(0, runningTotal - totalAmount);
  if (appliedCoupon && couponDiscount > 0) {
    y -= 16;
    page.drawText(`Coupon (${appliedCoupon.code}): -${couponDiscount.toFixed(2)}`, {
      x: width - 260,
      y,
      size: 11,
      font,
    });
  }
  y -= 16;
  page.drawText(`Total: ${totalAmount.toFixed(2)}`, {
    x: width - 200,
    y,
    size: 12,
    font: boldFont,
  });

  // Footer
  y -= 40;
  page.drawText("Thank you for shopping with Queen Beulah Collections.", {
    x: 40,
    y,
    size: 9,
    font,
  });
  y -= 12;
  page.drawText("If you have questions, contact support@queenbeulah.example", {
    x: 40,
    y,
    size: 9,
    font,
  });

  const pdfBytes = await pdfDoc.save(); // Uint8Array
  return Buffer.from(pdfBytes); // Node Response expects Buffer/ArrayBuffer
}
