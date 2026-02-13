// app/cart/CartClient.tsx
"use client";
import React from "react";
import useSWR, { mutate } from "swr";
import toast from "react-hot-toast";
import useAddToCart from "@/hooks/useAddToCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export default function CartClient({ initialCart }: { initialCart: any }) {
  const { applyCoupon } = useAddToCart();
  const { data } = useSWR("/api/cart", fetcher, {
    fallbackData: { ok: true, cart: initialCart },
  });
  const cart = data?.cart ?? null;

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="p-6 text-center text-gray-600">Your cart is empty</div>
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
      console.error("updateQty error", e);
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
      console.error("removeItem error", e);
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
      console.error("clearCart error", e);
      toast.error(e.message ?? "Failed to clear cart", { id: "clear" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {cart.items.map((it: any) => (
          <div key={it.id} className="flex items-center gap-4 border-b pb-4">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
              {it.thumbnail ? (
                <img
                  src={it.thumbnail}
                  alt={it.name_snapshot ?? "product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium">
                {it.name_snapshot ?? it.sku ?? "Product"}
              </div>
              <div className="text-sm text-gray-500">{it.sku}</div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))}
                  className="rounded border px-2 py-1"
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
                  className="h-8 w-16 p-1 text-center"
                />
                <button
                  onClick={() => updateQty(it.id, it.quantity + 1)}
                  className="rounded border px-2 py-1"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold">
                ${(Number(it.unit_price) * Number(it.quantity)).toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="text-sm text-red-600 mt-2"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <Button
            onClick={clearCart}
            variant="secondary"
            size="sm"
          >
            Clear cart
          </Button>
        </div>
        <div className="text-right">
          <div className="text-sm">Items: {cart.itemCount}</div>
          <div className="text-xl font-semibold">Total: ${cart.subTotal}</div>

          {/* coupon UI */}
          <div className="mt-4">
            <CouponBox cartId={cart?.id} applyCoupon={applyCoupon} />
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div>Subtotal</div>
            <div className="font-semibold">${cart?.subTotal ?? "0.00"}</div>
          </div>

          {/* {cart?.appliedCoupon && (
            <div className="mt-2 flex justify-between items-center text-sm text-green-700">
              <div>Coupon ({cart.appliedCoupon.code})</div>
              <div>- ${cart.discount ?? "0.00"}</div>
            </div>
          )} */}

          <div className="mt-3 flex justify-between items-center">
            <div className="font-medium">Total</div>
            <div className="font-semibold">
              ${cart?.total ?? cart?.subTotal ?? "0.00"}
            </div>
          </div>
          <div className="mt-2">
            <a
              href="/checkout"
              className="inline-block rounded-md bg-black px-4 py-2 text-white"
            >
              Proceed to checkout
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// small coupon box (client) component
function CouponBox({
  cartId,
  applyCoupon,
}: {
  cartId?: string | null;
  applyCoupon?: any;
}) {
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  async function onApply() {
    if (!cartId) return;
    setLoading(true);
    try {
      const res = await applyCoupon({ cartId, couponCode: code });
      setResult(res);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to apply");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm">Coupon</label>
      <div className="flex gap-2 mt-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1"
          placeholder="Enter promo code"
        />
        <Button
          disabled={!code || loading}
          onClick={onApply}
          variant="primary"
          size="sm"
        >
          {loading ? "Applying..." : "Apply"}
        </Button>
      </div>
      {result?.ok && (
        <div className="mt-3 text-sm text-green-600">
          Applied {result.coupon.code} - saved $
          {Number(result.coupon.discount_amount).toFixed(2)}
        </div>
      )}
      {result?.ok === false && (
        <div className="mt-3 text-sm text-red-600">{result?.error}</div>
      )}
    </div>
  );
}
