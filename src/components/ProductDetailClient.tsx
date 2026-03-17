"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import FlashCountdown from "@/components/FlashCountdown";
import ProductReviews from "@/components/ProductReviews";
import useAddToCart from "@/hooks/useAddToCart";
import { ADDON_DEFINITIONS } from "@/lib/pricing/addons";

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
  addons?: Array<{ code: string; label?: string }>;
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
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

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

  const selectedAddonSignature = useMemo(
    () => [...selectedAddons].sort().join("|"),
    [selectedAddons],
  );

  const currentInCartQty = useMemo(() => {
    const items = (cartData?.cart?.items ?? []) as CartItem[];
    const selectedVariantId = matched?.id ? String(matched.id) : null;

    return items.reduce((sum, it) => {
      const sameProduct = String(it.product_id) === String(productId);
      const sameVariant =
        String(it.variant_id ?? "") === String(selectedVariantId ?? "");
      const cartAddonSig = (it.addons ?? [])
        .map((a) => String(a.code))
        .sort()
        .join("|");
      const sameAddons = cartAddonSig === selectedAddonSignature;
      if (!sameProduct || !sameVariant || !sameAddons) return sum;
      return sum + Number(it.quantity ?? 0);
    }, 0);
  }, [cartData, matched, productId, selectedAddonSignature]);

  const selectedAddonTotal = useMemo(() => {
    return selectedAddons.reduce((sum, code) => {
      const addon = ADDON_DEFINITIONS.find((a) => a.code === code);
      return sum + Number(addon?.price ?? 0);
    }, 0);
  }, [selectedAddons]);

  const finalDisplayPriceWithAddons = finalDisplayPrice + selectedAddonTotal;

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
        addons: selectedAddons,
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
  const discountPercent =
    selectedBasePrice > 0
      ? Math.round((saved / selectedBasePrice) * 100)
      : 0;
  const stockProgress = Math.max(
    8,
    Math.min(100, stock > 0 ? (maxAddableQty / Math.max(stock, 1)) * 100 : 0),
  );

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
    <div className="mt-4 space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <p className="text-[11px] font-medium text-amber-700 sm:text-xs">
          {presenceText}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[1.75rem] font-bold tracking-tight text-slate-900 sm:text-3xl">
                {currency.format(finalDisplayPriceWithAddons)}
              </span>
              {saved > 0 ? (
                <span className="text-base font-medium text-slate-400 line-through">
                  {currency.format(selectedBasePrice + selectedAddonTotal)}
                </span>
              ) : null}
              {discountPercent > 0 ? (
                <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>
            {saved > 0 ? (
              <p className="mt-0.5 text-xs font-medium text-green-600">
                You save {currency.format(saved)}
              </p>
            ) : null}
            {selectedAddonTotal > 0 ? (
              <p className="mt-1 text-xs text-slate-600">
                Includes add-ons: {currency.format(selectedAddonTotal)}
              </p>
            ) : null}
          </div>

          {activeFlash?.ends_at ? <FlashCountdown endsAt={activeFlash.ends_at} /> : null}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${stockProgress}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-amber-600">
            {maxAddableQty > 0 ? `Only ${maxAddableQty} left` : "Low stock"}
          </p>
        </div>
      </div>

      {/* {medias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {medias.map((m, idx) => (
            <button
              key={m.id ?? `${idx}`}
              type="button"
              onClick={() => handleThumbClick(idx)}
              aria-pressed={activeThumb === idx}
              className={`overflow-hidden rounded-xl border-2 transition-all ${activeThumb === idx
                  ? "border-violet-500"
                  : "border-transparent hover:border-slate-300"
                }`}
            >
              <img
                src={m.url}
                alt={`Thumbnail ${idx + 1}`}
                className="h-[68px] w-[68px] object-cover sm:h-[72px] sm:w-[72px]"
              />
            </button>
          ))}
        </div>
      )} */}

      {groups.map((g) => (
        <div key={g.name} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {g.name} —{" "}
            <span className="normal-case font-semibold text-slate-800">
              {selected[g.name] ?? "-"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {g.values.map((val) => (
              <button
                key={val}
                onClick={() => setSelected((s) => ({ ...s, [g.name]: val }))}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition sm:px-3.5 ${selected[g.name] === val
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                  }`}
                type="button"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Add-ons
        </p>
        <div className="flex flex-wrap gap-2">
          {ADDON_DEFINITIONS.map((addon) => {
            const checked = selectedAddons.includes(addon.code);
            return (
              <button
                key={addon.code}
                type="button"
                onClick={() =>
                  setSelectedAddons((prev) =>
                    checked
                      ? prev.filter((code) => code !== addon.code)
                      : [...prev, addon.code],
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition sm:px-3.5 ${checked
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                  }`}
              >
                {addon.label} (+{currency.format(addon.price)})
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Quantity
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setQty((v) => Math.max(1, v - 1))}
              disabled={loading || qty <= 1}
              className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div className="flex h-10 min-w-[44px] items-center justify-center border-x border-slate-200 px-2 text-sm font-semibold tabular-nums">
              {qty}
            </div>
            <button
              type="button"
              onClick={() => setQty((v) => Math.min(maxAddableQty, v + 1))}
              disabled={loading || maxAddableQty === 0 || qty >= maxAddableQty}
              className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="text-xs text-slate-500">
            In cart: {currentInCartQty} / Stock: {stock}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || stock === 0 || maxAddableQty <= 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-600 bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md disabled:opacity-60 sm:px-6 sm:py-3.5"
        >
          {loading
            ? "Adding..."
            : stock === 0
              ? "Out of stock"
              : maxAddableQty <= 0
                ? "Stock already in cart"
                : "Add to cart"}
        </button>
        <a
          href="/checkout"
          className="flex flex-1 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md sm:px-6 sm:py-3.5"
        >
          Buy now
        </a>
      </div>

      <a
        href="https://wa.me/2348033333333"
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#128C52] transition hover:bg-[#25D366]/20"
      >
        Ask on WhatsApp
      </a>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="text-xl">🚚</span>
          <p className="text-[11px] font-semibold text-slate-800">
            Free delivery
          </p>
          <p className="text-[10px] text-slate-500">Orders N15k+</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="text-xl">✅</span>
          <p className="text-[11px] font-semibold text-slate-800">Authentic</p>
          <p className="text-[10px] text-slate-500">100% genuine</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="text-xl">↩️</span>
          <p className="text-[11px] font-semibold text-slate-800">
            Easy returns
          </p>
          <p className="text-[10px] text-slate-500">7-day policy</p>
        </div>
      </div>

      <ProductReviews productId={productId} userId={userId ?? null} />
    </div>
  );
}
