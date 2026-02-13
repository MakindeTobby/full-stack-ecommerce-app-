// app/order/[id]/page.tsx
import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  coupon_redemptions,
  coupons,
  order_items,
  order_status_history,
  orders,
  product_media,
} from "@/db/schema";
import { db } from "@/db/server";
import OrderLiveUpdates from "./OrderLiveUpdates";
import SimulatePaymentButton from "./SimulatePaymentButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const id = (await params).id;
  const search = (await searchParams) ?? {};
  const paymentQuery = Array.isArray(search.payment)
    ? search.payment[0]
    : search.payment;

  // fetch order row (support numeric or uuid ids)
  const orderRow = await db
    .select({
      id: orders.id,
      user_id: orders.user_id,
      address_id: orders.address_id,
      total_amount: orders.total_amount,
      currency: orders.currency,
      status: orders.status,
      payment_status: orders.payment_status,
      shipping_provider: orders.shipping_provider,
      shipping_tracking: orders.shipping_tracking,
      created_at: orders.created_at,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .then((r) => r[0] ?? null);

  if (!orderRow) {
    // Next will render 404 page
    notFound();
  }

  // fetch items for this order
  const items = await db
    .select({
      id: order_items.id,
      product_id: order_items.product_id,
      variant_id: order_items.variant_id,
      quantity: order_items.quantity,
      unit_price: order_items.unit_price,
      name_snapshot: order_items.name_snapshot,
      sku_snapshot: order_items.sku_snapshot,
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

  const statusHistory = await db
    .select({
      id: order_status_history.id,
      from_status: order_status_history.from_status,
      to_status: order_status_history.to_status,
      created_at: order_status_history.created_at,
    })
    .from(order_status_history)
    .where(eq(order_status_history.order_id, orderRow.id))
    .orderBy(order_status_history.created_at);

  // fetch thumbnails for products in the order (first media)
  const productIds = Array.from(
    new Set(items.map((it: any) => String(it.product_id))),
  );
  const thumbnailsMap: Record<string, string | null> = {};
  if (productIds.length > 0) {
    const medias = await db
      .select({
        product_id: product_media.product_id,
        url: product_media.url,
        position: product_media.position,
      })
      .from(product_media)
      .where(inArray(product_media.product_id, productIds))
      .orderBy(product_media.product_id, product_media.position);

    for (const m of medias) {
      const pid = String(m.product_id);
      if (!thumbnailsMap[pid]) thumbnailsMap[pid] = m.url;
    }
  }
  const itemSubTotal = items.reduce(
    (sum: number, it: any) =>
      sum + Number(it.unit_price ?? 0) * Number(it.quantity ?? 0),
    0,
  );
  const orderTotal = Number(orderRow.total_amount ?? 0);
  const couponDiscount = Math.max(0, itemSubTotal - orderTotal);

  return (
    <AppShell>
      <OrderLiveUpdates orderId={String(orderRow.id)} />
      <div className="qb-page">
        <div className="mb-6">
          <h1 className="qb-title">Order Confirmed</h1>
          {paymentQuery === "success" && (
            <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Payment confirmed successfully.
            </div>
          )}
          {paymentQuery === "failed" && (
            <div className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Payment could not be confirmed. You can try again.
            </div>
          )}
          <Link
            href={`/api/order/${orderRow.id}/receipt`}
            target="_blank"
            className="inline-block rounded bg-gray-800 px-3 py-2 text-white"
          >
            Download receipt (PDF)
          </Link>
          {/* <button
          onClick={() => handleDownload(orderRow.id)}
          className="inline-flex items-center px-3 py-2 border rounded"
        >
          Download Receipt
        </button> */}
          <p className="text-sm text-gray-500">Order #{String(orderRow.id)}</p>
        </div>

        <section className="qb-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium">{orderRow.status}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Payment</div>
              <div className="font-medium">{orderRow.payment_status}</div>
              <div className="mt-2">
                <SimulatePaymentButton
                  orderId={String(orderRow.id)}
                  paymentStatus={String(orderRow.payment_status ?? "unpaid")}
                />
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Placed</div>
              <div className="font-medium">
                {new Date(String(orderRow.created_at)).toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-medium">Items</h2>
          <div className="space-y-3">
            {items.map((it: any) => (
              <div key={it.id} className="qb-card flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded bg-gray-100">
                  {thumbnailsMap[String(it.product_id)] ? (
                    <img
                      src={thumbnailsMap[String(it.product_id)] || "thumbnail"}
                      alt={it.name_snapshot ?? it.sku_snapshot ?? "product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {it.name_snapshot ?? it.sku_snapshot ?? "Product"}
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {it.sku_snapshot}
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    Qty: {it.quantity}
                  </div>
                </div>
                <div className="text-right font-semibold">
                  ${(Number(it.unit_price) * Number(it.quantity)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-medium">Order Timeline</h2>
          <div className="space-y-2">
            {statusHistory.map((h) => (
              <div key={String(h.id)} className="qb-card">
                <div className="font-medium capitalize">
                  {h.to_status ?? "pending"}
                </div>
                <div className="text-xs text-gray-500">
                  {h.created_at
                    ? new Date(String(h.created_at)).toLocaleString()
                    : "-"}
                </div>
              </div>
            ))}
            {statusHistory.length === 0 && (
              <div className="qb-card text-sm text-gray-500">
                No timeline updates yet.
              </div>
            )}
            {orderRow.shipping_provider && orderRow.shipping_tracking && (
              <div className="qb-card text-sm">
                Tracking: {orderRow.shipping_provider} •{" "}
                {orderRow.shipping_tracking}
              </div>
            )}
          </div>
        </section>

        <section className="qb-card">
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="font-semibold">${itemSubTotal.toFixed(2)}</div>
          </div>
          {appliedCoupon && couponDiscount > 0 && (
            <div className="mt-2 flex justify-between">
              <div className="text-sm text-gray-500">
                Coupon ({appliedCoupon.code})
              </div>
              <div className="font-semibold text-green-700">
                -${couponDiscount.toFixed(2)}
              </div>
            </div>
          )}
          <div className="mt-2 flex justify-between">
            <div className="text-sm text-gray-500">Total</div>
            <div className="font-semibold">${orderTotal.toFixed(2)}</div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link href="/orders" className="rounded border px-3 py-2">
              View all orders
            </Link>
            <Link
              href="/"
              className="rounded bg-indigo-600 px-3 py-2 text-white"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
