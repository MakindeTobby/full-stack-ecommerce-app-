"use client";
import { useState } from "react";
import { mutate } from "swr";

/**
 * useAddToCart - small reusable hook
 * - add(payload) => calls POST /api/cart/add
 * - supports { userId?, cartId?, productId, variantId?, quantity }
 * - manages loading state and throws on error (so callers can catch)
 */
export default function useAddToCart() {
  const [loading, setLoading] = useState(false);

  async function add(opts: {
    productId: string;
    variantId?: string | null;
    quantity?: number;
    userId?: string | null;
    cartId?: string | null;
    sessionToken?: string | null; // not usually set from client (HttpOnly cookie used)
  }) {
    setLoading(true);
    try {
      const body = {
        userId: opts.userId ?? null,
        cartId: opts.cartId ?? null,
        productId: opts.productId,
        variantId: opts.variantId ?? null,
        quantity: opts.quantity ?? 1,
      };

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin", // ensures cookies are sent
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json?.error ?? "Failed to add to cart";
        const details = json?.details;
        const e = new Error(err);
        // attach details for nicer UX
        (e as any).details = details;
        throw e;
      }
      mutate("/api/cart"); // refresh cart data

      return json;
    } finally {
      setLoading(false);
    }
  }
  async function applyCoupon(payload: { cartId: string; couponCode: string }) {
    const res = await fetch("/api/cart/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Invalid coupon");
    mutate("/api/cart"); // refresh cart data
    return json;
  }

  return { add, loading, applyCoupon };
}
