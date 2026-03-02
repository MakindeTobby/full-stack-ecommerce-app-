"use client";

import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAddToCart from "@/hooks/useAddToCart";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export default function CartClient({ initialCart }: { initialCart: any }) {
  const { applyCoupon } = useAddToCart();
  const { data } = useSWR("/api/cart", fetcher, {
    fallbackData: { ok: true, cart: initialCart },
  });
  const cart = data?.cart ?? null;

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
        <p className="mt-1 text-sm text-slate-500">
          Add products to continue shopping.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Browse products
        </Link>
      </div>
    );
  }

  async function updateQty(cartItemId: string, newQty: number) {
    if (newQty < 1) return;
    toast.loading("Updating...", { id: `u-${cartItemId}` });
    try {
      const res = await fetch("/api/cart/item", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity: newQty }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Update failed");
      mutate("/api/cart");
      toast.success("Quantity updated", { id: `u-${cartItemId}` });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update", { id: `u-${cartItemId}` });
    }
  }

  async function removeItem(cartItemId: string) {
    if (!confirm("Remove this item?")) return;
    toast.loading("Removing...", { id: `r-${cartItemId}` });
    try {
      const res = await fetch("/api/cart/item/delete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Remove failed");
      mutate("/api/cart");
      toast.success("Removed", { id: `r-${cartItemId}` });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove", { id: `r-${cartItemId}` });
    }
  }

  async function clearCart() {
    if (!confirm("Clear your cart?")) return;
    toast.loading("Clearing cart...", { id: "clear" });
    try {
      const res = await fetch("/api/cart/clear", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Clear failed");
      mutate("/api/cart");
      toast.success("Cart cleared", { id: "clear" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to clear cart", { id: "clear" });
    }
  }

  const subTotalNum = Number(cart?.subTotal ?? 0);
  const totalNum = Number(cart?.total ?? cart?.subTotal ?? 0);
  const discountNum = Number(cart?.discountAmount ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-3">
        {cart.items.map((it: any) => (
          <article
            key={it.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {it.thumbnail ? (
                  <img
                    src={it.thumbnail}
                    alt={it.name_snapshot ?? "product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold text-slate-900">
                  {it.name_snapshot ?? it.sku ?? "Product"}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {it.sku ?? "No SKU"}
                </p>

                {Array.isArray(it.addons) && it.addons.length > 0 ? (
                  <div className="mt-1 text-xs text-slate-600">
                    Add-ons:{" "}
                    {it.addons
                      .map((a: { code: string; label?: string }) => a.label ?? a.code)
                      .join(", ")}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
                    <button
                      onClick={() =>
                        updateQty(it.id, Math.max(1, Number(it.quantity ?? 1) - 1))
                      }
                      className="h-9 w-9 text-slate-700 transition hover:bg-slate-100"
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      value={it.quantity}
                      min={1}
                      onChange={(e) =>
                        updateQty(it.id, Math.max(1, Number(e.target.value) || 1))
                      }
                      className="h-9 w-14 rounded-none border-0 border-x border-slate-200 bg-transparent p-0 text-center"
                    />
                    <button
                      onClick={() => updateQty(it.id, Number(it.quantity ?? 1) + 1)}
                      className="h-9 w-9 text-slate-700 transition hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(it.id)}
                    className="text-xs font-medium text-rose-600 transition hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {money.format(Number(it.unit_price ?? 0) * Number(it.quantity ?? 0))}
                </div>
                {Number(it.addons_total ?? 0) > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Add-ons{" "}
                    {money.format(
                      Number(it.addons_total ?? 0) * Number(it.quantity ?? 0),
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-base font-semibold text-slate-900">Order Summary</h2>
        <p className="mt-1 text-xs text-slate-500">
          {cart.itemCount} item{cart.itemCount > 1 ? "s" : ""} in your cart
        </p>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">{money.format(subTotalNum)}</span>
          </div>
          {discountNum > 0 ? (
            <div className="flex items-center justify-between text-emerald-700">
              <span>Discount</span>
              <span className="font-medium">- {money.format(discountNum)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{money.format(totalNum)}</span>
          </div>
        </div>

        <div className="mt-4">
          <CouponBox cartId={cart?.id} applyCoupon={applyCoupon} />
        </div>

        <div className="mt-5 space-y-2">
          <Link
            href="/checkout"
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Proceed to checkout
          </Link>
          <Button onClick={clearCart} variant="secondary" className="w-full">
            Clear cart
          </Button>
          <Link
            href="/products"
            className="block text-center text-xs text-slate-500 transition hover:text-slate-700"
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CouponBox({
  cartId,
  applyCoupon,
}: {
  cartId?: string | null;
  applyCoupon?: any;
}) {
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function onApply() {
    if (!cartId || !code.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await applyCoupon({ cartId, couponCode: code.trim() });
      if (res?.ok) {
        const saved = Number(res?.coupon?.discount_amount ?? 0);
        const label = res?.coupon?.code ?? code.trim().toUpperCase();
        setMessage({
          kind: "success",
          text: `Applied ${label} (${money.format(saved)} saved)`,
        });
        toast.success("Coupon applied");
        setCode("");
      } else {
        setMessage({
          kind: "error",
          text: res?.error ?? "Failed to apply coupon",
        });
      }
    } catch (e: any) {
      setMessage({
        kind: "error",
        text: e?.message ?? "Failed to apply coupon",
      });
      toast.error(e?.message ?? "Failed to apply coupon");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Coupon
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-9 flex-1 bg-white"
          placeholder="Enter promo code"
        />
        <Button
          disabled={!code.trim() || loading}
          onClick={onApply}
          variant="primary"
          size="sm"
        >
          {loading ? "Applying..." : "Apply"}
        </Button>
      </div>
      {message ? (
        <p
          className={`mt-2 text-xs ${message.kind === "success" ? "text-emerald-700" : "text-rose-600"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

