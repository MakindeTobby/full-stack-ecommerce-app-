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

  const money = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });

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

  if (!orderRow) notFound();

  const items = await db
    .select({
      id: order_items.id,
      product_id: order_items.product_id,
      variant_id: order_items.variant_id,
      quantity: order_items.quantity,
      unit_price: order_items.unit_price,
      name_snapshot: order_items.name_snapshot,
      sku_snapshot: order_items.sku_snapshot,
      addons_json: order_items.addons_json,
      addons_total: order_items.addons_total,
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

  const productIds = Array.from(new Set(items.map((it) => String(it.product_id))));
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

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Order Confirmed
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Order #{String(orderRow.id)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Placed {new Date(String(orderRow.created_at)).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/api/order/${orderRow.id}/receipt`}
                target="_blank"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Download receipt
              </Link>
              <Link
                href="/orders"
                className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                All orders
              </Link>
            </div>
          </div>

          {paymentQuery === "success" ? (
            <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Payment confirmed successfully.
            </div>
          ) : null}
          {paymentQuery === "failed" ? (
            <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Payment could not be confirmed. You can try again.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
            <div className="mt-2">
              <StatusBadge status={String(orderRow.status ?? "pending")} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment</p>
            <div className="mt-2">
              <PaymentBadge status={String(orderRow.payment_status ?? "unpaid")} />
            </div>
            <div className="mt-3">
              <SimulatePaymentButton
                orderId={String(orderRow.id)}
                paymentStatus={String(orderRow.payment_status ?? "unpaid")}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {money.format(orderTotal)}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Items</h2>
            {items.map((it: any) => {
              const addons = Array.isArray(it.addons_json)
                ? it.addons_json.map((v: unknown) => String(v))
                : [];
              return (
                <article
                  key={it.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {thumbnailsMap[String(it.product_id)] ? (
                        <img
                          src={thumbnailsMap[String(it.product_id)] || ""}
                          alt={it.name_snapshot ?? it.sku_snapshot ?? "product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {it.name_snapshot ?? it.sku_snapshot ?? "Product"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                        {it.sku_snapshot ?? "No SKU"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">Qty: {it.quantity}</p>
                      {addons.length > 0 ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Add-ons: {addons.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        {money.format(Number(it.unit_price ?? 0) * Number(it.quantity ?? 0))}
                      </div>
                      {Number(it.addons_total ?? 0) > 0 ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Add-ons: {money.format(Number(it.addons_total ?? 0) * Number(it.quantity ?? 0))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
            {items.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                No items found for this order.
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Order Summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">{money.format(itemSubTotal)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium">- {money.format(couponDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{money.format(orderTotal)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
              <div className="mt-3 space-y-2">
                {statusHistory.map((h) => (
                  <div key={String(h.id)} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm font-medium capitalize text-slate-900">
                      {h.to_status ?? "pending"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {h.created_at
                        ? new Date(String(h.created_at)).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                ))}

                {statusHistory.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    No timeline updates yet.
                  </div>
                ) : null}

                {orderRow.shipping_provider && orderRow.shipping_tracking ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    Tracking: {orderRow.shipping_provider} • {orderRow.shipping_tracking}
                  </div>
                ) : null}
              </div>
            </section>

            <div className="flex gap-2">
              <Link
                href="/"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const isPositive =
    value === "delivered" || value === "shipped" || value === "processing";
  const isNegative = value === "cancelled" || value === "failed";
  const cls = isNegative
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : isPositive
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const cls =
    value === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase ${cls}`}>
      {status}
    </span>
  );
}

