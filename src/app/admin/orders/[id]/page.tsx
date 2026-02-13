import { eq, inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addresses,
  order_items,
  order_status_history,
  orders,
  product_media,
  users,
} from "@/db/schema";
import { db } from "@/db/server";
import {
  getAllowedNextStatuses,
  normalizeOrderStatus,
} from "@/lib/orders/status";
import OrderStatusActions from "./OrderStatusActions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const row = await db
    .select({
      id: orders.id,
      user_id: orders.user_id,
      total_amount: orders.total_amount,
      currency: orders.currency,
      status: orders.status,
      payment_status: orders.payment_status,
      shipping_provider: orders.shipping_provider,
      shipping_tracking: orders.shipping_tracking,
      created_at: orders.created_at,
      user_email: users.email,
      user_name: users.name,
      address_label: addresses.label,
      address_full_name: addresses.full_name,
      address_phone: addresses.phone,
      address_street: addresses.street,
      address_city: addresses.city,
      address_state: addresses.state,
      address_postal: addresses.postal_code,
      address_country: addresses.country,
    })
    .from(orders)
    .leftJoin(users, eq(orders.user_id, users.id))
    .leftJoin(addresses, eq(orders.address_id, addresses.id))
    .where(eq(orders.id, id))
    .then((r) => r[0] ?? null);

  if (!row) notFound();

  const items = await db
    .select({
      id: order_items.id,
      product_id: order_items.product_id,
      quantity: order_items.quantity,
      unit_price: order_items.unit_price,
      name_snapshot: order_items.name_snapshot,
      sku_snapshot: order_items.sku_snapshot,
    })
    .from(order_items)
    .where(eq(order_items.order_id, row.id));

  const productIds = Array.from(
    new Set(items.map((it) => String(it.product_id))),
  );

  const thumbMap: Record<string, string> = {};
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
      if (!thumbMap[pid]) thumbMap[pid] = m.url;
    }
  }

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.unit_price ?? 0) * Number(it.quantity ?? 0),
    0,
  );
  const currentStatus = normalizeOrderStatus(row.status);
  const allowedNext = getAllowedNextStatuses(currentStatus);

  const statusHistory = await db
    .select({
      id: order_status_history.id,
      from_status: order_status_history.from_status,
      to_status: order_status_history.to_status,
      actor: order_status_history.actor,
      note: order_status_history.note,
      created_at: order_status_history.created_at,
      changed_by_name: users.name,
      changed_by_email: users.email,
    })
    .from(order_status_history)
    .leftJoin(users, eq(order_status_history.changed_by_user_id, users.id))
    .where(eq(order_status_history.order_id, row.id))
    .orderBy(order_status_history.created_at);

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Order #{String(row.id)}</h1>
          <p className="text-sm text-slate-600">
            Placed {new Date(String(row.created_at)).toLocaleString()}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Back to orders
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="admin-panel lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Items</h2>
          <div className="space-y-3">
            {items.map((it) => (
              <div
                key={String(it.id)}
                className="flex items-center gap-4 rounded-lg border border-slate-200 p-3"
              >
                <div className="h-16 w-16 overflow-hidden rounded bg-slate-100">
                  {thumbMap[String(it.product_id)] ? (
                    <Image
                      src={thumbMap[String(it.product_id)]}
                      alt={it.name_snapshot ?? "Product"}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {it.name_snapshot ?? "Product"}
                  </div>
                  <div className="text-xs text-slate-500">
                    SKU: {it.sku_snapshot ?? "-"}
                  </div>
                </div>
                <div className="text-sm text-slate-700">Qty {it.quantity}</div>
                <div className="text-right font-medium">
                  {row.currency ?? "NGN"}{" "}
                  {(
                    Number(it.unit_price ?? 0) * Number(it.quantity ?? 0)
                  ).toFixed(2)}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-slate-500">
                No order items found.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="admin-panel">
            <h3 className="font-semibold">Order summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium">{row.status ?? "pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-medium">
                  {row.payment_status ?? "unpaid"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{`${row.currency ?? "NGN"} ${subtotal.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                <span>Total</span>
                <span>
                  {(row.currency ?? "NGN") +
                    " " +
                    Number(row.total_amount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
            <OrderStatusActions
              orderId={String(row.id)}
              currentStatus={currentStatus}
              allowedNext={allowedNext}
              shippingProvider={row.shipping_provider ?? null}
              shippingTracking={row.shipping_tracking ?? null}
            />
          </section>

          <section className="admin-panel">
            <h3 className="font-semibold">Customer</h3>
            <div className="mt-2 text-sm text-slate-700">
              <div>{row.user_name ?? "Customer"}</div>
              <div className="text-slate-500">
                {row.user_email ?? "No email"}
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <h3 className="font-semibold">Shipping address</h3>
            <div className="mt-2 text-sm text-slate-700">
              <div>{row.address_full_name ?? "-"}</div>
              <div>{row.address_phone ?? "-"}</div>
              <div>{row.address_street ?? "-"}</div>
              <div>
                {[row.address_city, row.address_state, row.address_postal]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              <div>{row.address_country ?? "-"}</div>
            </div>
          </section>

          <section className="admin-panel">
            <h3 className="font-semibold">Status timeline</h3>
            <div className="mt-2 space-y-2 text-sm">
              {statusHistory.map((h) => (
                <div
                  key={String(h.id)}
                  className="rounded border border-slate-200 p-2"
                >
                  <div className="font-medium text-slate-800">
                    {h.from_status
                      ? `${h.from_status} -> ${h.to_status}`
                      : h.to_status}
                  </div>
                  <div className="text-xs text-slate-500">
                    {h.created_at
                      ? new Date(String(h.created_at)).toLocaleString()
                      : "-"}{" "}
                    | by{" "}
                    {h.changed_by_name ??
                      h.changed_by_email ??
                      h.actor ??
                      "system"}
                  </div>
                  {h.note && (
                    <div className="mt-1 text-xs text-slate-600">{h.note}</div>
                  )}
                </div>
              ))}
              {statusHistory.length === 0 && (
                <div className="text-xs text-slate-500">
                  No status history yet.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
