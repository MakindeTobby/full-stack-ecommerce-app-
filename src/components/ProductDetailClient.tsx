"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import FlashCountdown from "@/components/FlashCountdown";
import ProductReviews from "@/components/ProductReviews";
import useAddToCart from "@/hooks/useAddToCart";

type Variant = {
  id?: string;
  sku?: string | null;
  barcode?: string | null;
  price: string;
  stock: number;
  attributes: Record<string, string>;
};

type CartItem = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
};

type PresenceResponse = {
  ok: boolean;
  viewerId?: string;
  activeViewers?: number;
};

type FlashLike = {
  ends_at?: string | null;
  override_type?: "percent" | "amount" | null;
  discount_type?: "percent" | "amount" | null;
  override_value?: number | string | null;
  discount_value?: number | string | null;
};

const cartFetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export default function ProductDetailClient({
  productId,
  productName,
  basePrice,
  variants,
  userId = null,
  displayPrice, // server-provided price (number | undefined)
  activeFlash, // any | null (may include ends_at)
  medias = [], // array of { id, url, position, ... }
}: {
  productId: string;
  productName: string;
  basePrice: string;
  displayPrice?: number;
  activeFlash?: FlashLike | null;
  variants: Variant[];
  userId?: string | null;
  medias?: { id: string; url: string }[];
}) {
  // currency formatter
  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NGN",
      }),
    [],
  );

  // ----- thumbnail state (client only) -----
  // track active thumbnail index (used for styling)
  const [activeThumb, setActiveThumb] = useState(0);

  // ----- attribute groups derived from variants -----
  const groups = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const [k, val] of Object.entries(v.attributes || {})) {
        if (!map.has(k)) map.set(k, new Set());
        map.get(k)?.add(val);
      }
    }
    return Array.from(map.entries()).map(([name, set]) => ({
      name,
      values: Array.from(set),
    }));
  }, [variants]);

  // Ensure deterministic initial selection from groups
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const g of groups) {
      if (g.values?.[0]) initial[g.name] = g.values[0];
    }
    return initial;
  });

  useEffect(() => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (!next[g.name] && g.values?.[0]) next[g.name] = g.values[0];
      }
      return next;
    });
  }, [groups]);

  // find matched variant for current selection
  const matched = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) => {
        for (const [k, val] of Object.entries(v.attributes || {})) {
          if ((selected[k] ?? "") !== val) return false;
        }
        return true;
      }) ?? null
    );
  }, [variants, selected]);

  // Price resolution:
  // 1) pick selected base (variant price if selected, else product base)
  // 2) if active flash exists, apply it to selected base
  // 3) fallback to server-provided displayPrice only if flash shape is incomplete
  const variantBasePrice = matched ? Number(matched.price) : NaN;
  const serverPrice = Number(displayPrice);
  const base = Number(basePrice ?? 0);
  const selectedBasePrice = Number.isFinite(variantBasePrice)
    ? variantBasePrice
    : base;

  const flashType = (activeFlash?.override_type ??
    activeFlash?.discount_type) as "percent" | "amount" | undefined;
  const flashValue = Number(
    activeFlash?.override_value ?? activeFlash?.discount_value ?? NaN,
  );
  const hasFlashPricing =
    !!activeFlash &&
    (flashType === "percent" || flashType === "amount") &&
    Number.isFinite(flashValue);

  let finalDisplayPrice = selectedBasePrice;
  if (hasFlashPricing) {
    finalDisplayPrice =
      flashType === "percent"
        ? Math.max(
            0,
            selectedBasePrice - selectedBasePrice * (flashValue / 100),
          )
        : Math.max(0, selectedBasePrice - flashValue);
  } else if (activeFlash && Number.isFinite(serverPrice)) {
    finalDisplayPrice = serverPrice;
  }

  //   const variantPrice = matched ? Number(matched.price) : NaN;
  //   const serverFlashPrice = Number(displayPrice); // resolved flash price from server
  //   const base = Number(basePrice ?? 0);

  //   // Final rule:
  //   // 1. Flash active → flash price
  //   // 2. No flash → variant price (if valid)
  //   // 3. No variant → base price
  //   const finalDisplayPrice =
  //     activeFlash && Number.isFinite(serverFlashPrice)
  //       ? serverFlashPrice
  //       : Number.isFinite(variantPrice)
  //       ? variantPrice
  //       : base;

  const stock = matched ? (matched.stock ?? 0) : 0;

  const [qty, setQty] = useState(1);

  const { add, loading } = useAddToCart();
  const { data: cartData } = useSWR("/api/cart", cartFetcher);
  const { data: presenceData } = useSWR<PresenceResponse>(
    `/api/products/${productId}/presence`,
    cartFetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  );

  const currentInCartQty = useMemo(() => {
    const items = (cartData?.cart?.items ?? []) as CartItem[];
    const selectedVariantId = matched?.id ? String(matched.id) : null;

    return items.reduce((sum, it) => {
      const sameProduct = String(it.product_id) === String(productId);
      const sameVariant =
        String(it.variant_id ?? "") === String(selectedVariantId ?? "");
      if (!sameProduct || !sameVariant) return sum;
      return sum + Number(it.quantity ?? 0);
    }, 0);
  }, [cartData, matched, productId]);

  const maxAddableQty = Math.max(0, stock - currentInCartQty);
  const activeViewers = Number(presenceData?.activeViewers ?? 0);
  const presenceText =
    activeViewers <= 1
      ? "You're the first here right now"
      : `${activeViewers} people are currently viewing this`;

  useEffect(() => {
    const viewerId = presenceData?.viewerId;
    if (!viewerId) return;

    const leave = () => {
      const url = `/api/products/${productId}/presence/leave`;
      const body = JSON.stringify({ viewerId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" }),
        );
        return;
      }
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [productId, presenceData?.viewerId]);

  useEffect(() => {
    if (maxAddableQty <= 0) {
      setQty(1);
      return;
    }
    setQty((prev) => Math.min(Math.max(1, prev), maxAddableQty));
  }, [maxAddableQty]);

  async function handleAddToCart() {
    if (!matched) {
      toast.error("Please select a valid variant");
      return;
    }
    if (qty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (maxAddableQty <= 0) {
      toast.error("This variant has reached stock limit in your cart");
      return;
    }
    if (qty > maxAddableQty) {
      toast.error(`Only ${maxAddableQty} more can be added for this variant`);
      return;
    }

    toast.loading("Adding to cart...", { id: "cart" });

    try {
      const json = await add({
        userId: userId ?? null,
        productId,
        variantId: matched.id ?? null,
        quantity: qty,
      });

      toast.success("Added to cart", { id: "cart" });
      setQty(1);
      return json;
    } catch (err: unknown) {
      console.error("Add to cart failed", err);
      const message =
        err instanceof Error ? err.message : "Failed to add to cart";
      toast.error(message, { id: "cart" });
      return null;
    }
  }

  const saved = Math.max(0, selectedBasePrice - finalDisplayPrice);

  // Thumbnail click handler: update server-rendered main image by id
  function handleThumbClick(idx: number) {
    const m = medias[idx];
    if (!m) return;
    setActiveThumb(idx);

    // mutate the already-rendered main image in DOM (keeps SSR main image)
    try {
      const el = document.getElementById(
        "main-product-image",
      ) as HTMLImageElement | null;
      if (el) {
        el.src = m.url;
        // update alt for accessibility
        el.alt = productName ?? el.alt;
      }
    } catch (e) {
      // fail silently; nothing critical
      console.warn("Failed to update main image element", e);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
        {presenceText}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xl font-semibold">
          {currency.format(finalDisplayPrice)}
        </div>

        {saved > 0 && (
          <div className="text-sm text-green-600 font-medium">
            You saved {currency.format(saved)}
          </div>
        )}

        {activeFlash?.ends_at && (
          <div className="ml-auto">
            <FlashCountdown endsAt={activeFlash.ends_at} />
          </div>
        )}
      </div>

      {/* Thumbnails (client-only) */}
      {medias.length > 0 && (
        <div className="flex gap-2">
          {medias.map((m, idx) => (
            <button
              key={m.id ?? `${idx}`}
              type="button"
              onClick={() => handleThumbClick(idx)}
              aria-pressed={activeThumb === idx}
              className={`border rounded overflow-hidden p-0 ${
                activeThumb === idx ? "ring-2 ring-indigo-500" : ""
              }`}
            >
              <img
                src={m.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-20 h-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.name}>
          <div className="mb-1 block text-sm font-medium">{g.name}</div>
          <div className="flex gap-2">
            {g.values.map((val) => (
              <button
                key={val}
                onClick={() => setSelected((s) => ({ ...s, [g.name]: val }))}
                className={`px-3 py-1 border rounded ${
                  selected[g.name] === val ? "bg-black text-white" : ""
                }`}
                type="button"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">Qty</div>
        <div className="inline-flex items-center rounded-md border border-black/15 bg-white">
          <button
            type="button"
            onClick={() => setQty((v) => Math.max(1, v - 1))}
            disabled={loading || qty <= 1}
            className="h-9 w-9 rounded-l-md text-lg disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <div className="flex h-9 min-w-10 items-center justify-center border-x border-black/10 px-3 text-sm font-medium">
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty((v) => Math.min(maxAddableQty, v + 1))}
            disabled={loading || maxAddableQty === 0 || qty >= maxAddableQty}
            className="h-9 w-9 rounded-r-md text-lg disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <div className="text-sm text-gray-600">
          In cart: {currentInCartQty} / Stock: {stock}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || stock === 0 || maxAddableQty <= 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
        >
          {loading
            ? "Adding..."
            : stock === 0
              ? "Out of stock"
              : maxAddableQty <= 0
                ? "Stock already in cart"
                : "Add to cart"}
        </button>
        <button type="button" className="px-4 py-2 border rounded">
          Buy now
        </button>
      </div>

      <ProductReviews productId={productId} userId={userId ?? null} />
    </div>
  );
}
