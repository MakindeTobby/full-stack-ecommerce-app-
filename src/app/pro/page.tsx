"use client"
import React, { useEffect, useMemo, useRef, useState } from "react";

type VariantOption = { label: string; value: string };

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function ProductDetailPage() {
    // Theme
    const [isDark, setIsDark] = useState(false);

    // Cart / qty
    const [qty, setQty] = useState(1);
    const maxQty = 3;
    const [cart, setCart] = useState(0);

    // Thumbnails
    const thumbs = ["👜", "👝", "💼", "🎒"];
    const [activeThumb, setActiveThumb] = useState(0);

    // Variants
    const colorOptions: VariantOption[] = [
        { label: "Black", value: "Black" },
        { label: "Nude", value: "Nude" },
        { label: "Burgundy", value: "Burgundy" },
    ];
    const sizeOptions: VariantOption[] = [
        { label: "Small", value: "Small" },
        { label: "Medium", value: "Medium" },
        { label: "Large", value: "Large" },
    ];
    const [selectedColor, setSelectedColor] = useState("Black");
    const [selectedSize, setSelectedSize] = useState("Medium");

    // Toast
    const toastTimer = useRef<number | null>(null);
    const [toast, setToast] = useState({ open: false, msg: "Added to cart!" });

    // Flash countdown: 02:47:30
    const [secs, setSecs] = useState(2 * 3600 + 47 * 60 + 30);

    // Inject fonts (self-contained like HTML)
    useEffect(() => {
        const href =
            "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Geist:wght@300;400;500;600;700&display=swap";
        const exists = Array.from(document.querySelectorAll("link")).some((l) => l.getAttribute("href") === href);
        if (!exists) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        }
    }, []);

    // Tailwind darkMode via class on html
    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    // Countdown tick
    useEffect(() => {
        const id = window.setInterval(() => {
            setSecs((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    const th = useMemo(() => Math.floor(secs / 3600), [secs]);
    const tm = useMemo(() => Math.floor((secs % 3600) / 60), [secs]);
    const ts = useMemo(() => secs % 60, [secs]);

    const showToast = (msg: string) => {
        setToast({ open: true, msg });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2400);
    };

    const changeQty = (delta: number) => {
        setQty((q) => Math.max(1, Math.min(maxQty, q + delta)));
    };

    const addCart = () => {
        setCart((c) => c + qty);
        showToast(`${qty} × Quilted Bag added to cart`);
        // mimic original behavior: disable + reset feel
        setTimeout(() => setQty(1), 1500);
    };

    const variantBtnBase =
        "variant-btn rounded-lg border px-3.5 py-2 text-sm font-medium transition";
    const variantBtnInactive = isDark
        ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-violet-500 hover:text-violet-300"
        : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700";
    const variantBtnActive =
        "active-var border-violet-600 bg-violet-600 text-white shadow-sm";

    return (
        <div
            id="body"
            className={cn(
                "min-h-screen transition-colors",
                isDark ? "bg-[#0B0F19] text-slate-50" : "bg-[#FFFFFF] text-slate-900"
            )}
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
            {/* Local CSS replicated from HTML */}
            <style>{`
        .font-display { font-family:'DM Serif Display', Georgia, serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .35s ease both; }
        .scrollbar-hide { scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .card { transition: background-color .2s, border-color .2s; }
      `}</style>

            {/* HEADER */}
            <header
                id="navbar"
                className={cn(
                    "sticky top-0 z-50 border-b backdrop-blur-md",
                    isDark ? "border-[#1F2937] bg-[#0B0F19]/95" : "border-slate-200 bg-white/95"
                )}
            >
                <div className={cn("hidden border-b px-4 py-1.5 sm:block", isDark ? "border-[#1F2937] bg-[#0d1117]" : "border-slate-100 bg-slate-50")}>
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <span className={cn("text-[11px]", isDark ? "text-slate-400" : "text-slate-500")}>
                            🚚 Free delivery on orders above ₦15,000 · Pay on delivery available
                        </span>
                        <div className="flex gap-4">
                            <a href="#" className="text-[11px] text-slate-500 hover:text-violet-600 transition">
                                Track Order
                            </a>
                            <a href="#" className="text-[11px] text-slate-500 hover:text-violet-600 transition">
                                Help
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
                    <a href="#" className="flex flex-col leading-none flex-shrink-0">
                        <span id="logoText" className={cn("font-display text-lg font-normal", isDark ? "text-slate-50" : "text-slate-900")}>
                            Queen Beulah
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-600">Collections</span>
                    </a>

                    <nav className="hidden md:flex items-center gap-0.5 ml-4">
                        <a href="#" className={cn("rounded-md px-3 py-1.5 text-sm transition", isDark ? "text-slate-300 hover:bg-[#1F2937] hover:text-white" : "text-slate-600 hover:bg-slate-100")}>
                            Home
                        </a>
                        <a href="#" className="rounded-md bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
                            Shop
                        </a>
                        <a href="#" className="rounded-md px-3 py-1.5 text-sm text-red-600 font-medium hover:bg-red-50 transition">
                            Sale
                        </a>
                    </nav>

                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            onClick={() => setIsDark((d) => !d)}
                            id="themeBtn"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg border transition",
                                isDark
                                    ? "border-[#1F2937] bg-[#111827] text-slate-400 hover:text-white hover:bg-[#1F2937]"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            )}
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="5" />
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                                </svg>
                            )}
                        </button>

                        <button className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            <span>Cart</span>
                            <span id="cartBadge" className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                                {cart}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6">
                {/* Breadcrumb */}
                <nav className="mb-6 flex items-center gap-1.5 text-xs fade-up">
                    <a href="#" className={cn("transition hover:text-violet-600", isDark ? "text-slate-400" : "text-slate-500")}>
                        Home
                    </a>
                    <span className="text-slate-300">/</span>
                    <a href="#" className={cn("transition hover:text-violet-600", isDark ? "text-slate-400" : "text-slate-500")}>
                        Shop
                    </a>
                    <span className="text-slate-300">/</span>
                    <a href="#" className={cn("transition hover:text-violet-600", isDark ? "text-slate-400" : "text-slate-500")}>
                        Bags &amp; Purses
                    </a>
                    <span className="text-slate-300">/</span>
                    <span id="breadTitle" className={cn("font-medium", isDark ? "text-slate-100" : "text-slate-800")}>
                        Quilted Chain Shoulder Bag
                    </span>
                </nav>

                {/* Product grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
                    {/* LEFT: Image */}
                    <div className="flex flex-col gap-3 fade-up">
                        <div
                            id="imgFrame"
                            className={cn(
                                "relative overflow-hidden rounded-2xl border aspect-square card",
                                isDark ? "border-slate-700/50 bg-slate-800/50" : "border-slate-200 bg-slate-50"
                            )}
                        >
                            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                                    ⚡ Flash Sale
                                </span>
                                <span className="inline-flex rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                                    SKU-082
                                </span>
                            </div>

                            <div
                                id="mainImg"
                                className="flex h-full w-full select-none items-center justify-center transition-transform duration-500 hover:scale-[1.03]"
                                style={{ fontSize: "8rem" }}
                            >
                                {thumbs[activeThumb] ?? "👜"}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {thumbs.map((em, idx) => {
                                const active = idx === activeThumb;
                                return (
                                    <button
                                        key={idx}
                                        data-thumb={idx}
                                        onClick={() => setActiveThumb(idx)}
                                        className={cn(
                                            "thumb flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                                            active ? "border-violet-500" : isDark ? "border-transparent hover:border-slate-600" : "border-transparent hover:border-slate-300"
                                        )}
                                        style={{
                                            fontSize: "2.5rem",
                                            width: 72,
                                            height: 72,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: isDark ? "#1e1735" : "#F8FAFC",
                                        }}
                                        aria-label={`Thumbnail ${idx + 1}`}
                                    >
                                        {em}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Product info */}
                    <div className="flex flex-col fade-up" style={{ animationDelay: "80ms" }}>
                        <p id="catLabel" className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
                            Bags &amp; Purses
                        </p>

                        <h1
                            id="prodTitle"
                            className={cn(
                                "font-display text-2xl font-normal leading-tight tracking-tight sm:text-3xl",
                                isDark ? "text-slate-50" : "text-slate-900"
                            )}
                        >
                            Quilted Chain Shoulder Bag
                        </h1>

                        <div className="mt-3 space-y-0.5">
                            <p className={cn("mt-2 text-sm leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
                                A luxurious quilted chain shoulder bag crafted from premium vegan leather. Perfect for both day and evening looks.
                            </p>
                            <ul className={cn("mt-3 space-y-1.5 pl-0 text-sm leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className={cn("font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>Material:</strong>{" "}
                                        Premium vegan leather
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className={cn("font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>Dimensions:</strong>{" "}
                                        28cm × 18cm × 8cm
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                                    <span>
                                        <strong className={cn("font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>Chain strap:</strong>{" "}
                                        Adjustable gold-tone
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                                    <span>Interior zip pocket + 2 slip pockets</span>
                                </li>
                            </ul>
                        </div>

                        <div id="divider" className={cn("my-5 border-t", isDark ? "border-slate-700/50" : "border-slate-100")} />

                        <div className="space-y-5">
                            {/* Presence */}
                            <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", "border-amber-200 bg-amber-50")}>
                                <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <p className="text-xs font-medium text-amber-700">7 people viewing this right now</p>
                                <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            </div>

                            {/* Price block */}
                            <div
                                id="priceBlock"
                                className={cn(
                                    "rounded-xl border p-4 card",
                                    isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-slate-50"
                                )}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-baseline gap-2.5">
                                            <span id="displayPrice" className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-900")}>
                                                ₦28,000
                                            </span>
                                            <span className="text-base font-medium text-slate-400 line-through">₦38,000</span>
                                            <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">-26%</span>
                                        </div>
                                        <p className="mt-0.5 text-xs font-medium text-green-600">You save ₦10,000 on this order</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Flash ends in</p>
                                        <div className="flex items-center gap-1">
                                            <span className="min-w-[30px] rounded bg-slate-900 px-2 py-1 text-center text-xs font-bold tabular-nums text-white">
                                                {pad2(th)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500">:</span>
                                            <span className="min-w-[30px] rounded bg-slate-900 px-2 py-1 text-center text-xs font-bold tabular-nums text-white">
                                                {pad2(tm)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500">:</span>
                                            <span className="min-w-[30px] rounded bg-slate-900 px-2 py-1 text-center text-xs font-bold tabular-nums text-white">
                                                {pad2(ts)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full w-[30%] rounded-full bg-amber-500 transition-all" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-amber-600">Only 3 left</p>
                                </div>
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>
                                    Color —{" "}
                                    <span id="selectedColor" className={cn("normal-case font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>
                                        {selectedColor}
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-2" id="colorBtns">
                                    {colorOptions.map((opt) => {
                                        const active = opt.value === selectedColor;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSelectedColor(opt.value)}
                                                data-val={opt.value}
                                                className={cn(variantBtnBase, active ? variantBtnActive : variantBtnInactive)}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Size */}
                            <div className="space-y-2">
                                <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>
                                    Size —{" "}
                                    <span id="selectedSize" className={cn("normal-case font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>
                                        {selectedSize}
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-2" id="sizeBtns">
                                    {sizeOptions.map((opt) => {
                                        const active = opt.value === selectedSize;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSelectedSize(opt.value)}
                                                data-val={opt.value}
                                                className={cn(variantBtnBase, active ? variantBtnActive : variantBtnInactive)}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>
                                    Quantity
                                </p>

                                <div className="flex items-center gap-4">
                                    <div
                                        id="qtyControl"
                                        className={cn(
                                            "flex items-center overflow-hidden rounded-lg border",
                                            isDark ? "border-slate-600" : "border-slate-200"
                                        )}
                                    >
                                        <button
                                            id="qtyMinus"
                                            onClick={() => changeQty(-1)}
                                            disabled={qty <= 1}
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center transition disabled:opacity-40",
                                                isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>

                                        <div
                                            id="qtyVal"
                                            className={cn(
                                                "flex h-10 min-w-[44px] items-center justify-center border-x px-2 text-sm font-semibold tabular-nums",
                                                isDark ? "border-slate-600 text-slate-50" : "border-slate-200 text-slate-900"
                                            )}
                                        >
                                            {qty}
                                        </div>

                                        <button
                                            id="qtyPlus"
                                            onClick={() => changeQty(1)}
                                            disabled={qty >= maxQty}
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center transition disabled:opacity-40",
                                                isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className={cn("flex flex-col text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                                        <span>3 in stock</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col gap-2.5 sm:flex-row">
                                <button
                                    onClick={addCart}
                                    id="ctaMain"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-600 bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <path d="M16 10a4 4 0 01-8 0" />
                                    </svg>
                                    Add to Cart
                                </button>

                                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md active:scale-[0.98]">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                    Buy Now
                                </button>
                            </div>

                            {/* WhatsApp CTA */}
                            <a
                                href="#"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#128C52] transition hover:bg-[#25D366]/20"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345zM12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.119 1.529 5.849L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                                </svg>
                                Ask on WhatsApp
                            </a>

                            {/* Trust badges */}
                            <div className="mt-1 grid grid-cols-3 gap-2">
                                {[
                                    { icon: "🚚", title: "Free delivery", sub: "Orders ₦15k+" },
                                    { icon: "✅", title: "Authentic", sub: "100% genuine" },
                                    { icon: "↩️", title: "Easy returns", sub: "7-day policy" },
                                ].map((b) => (
                                    <div
                                        key={b.title}
                                        className={cn(
                                            "card flex flex-col items-center gap-1 rounded-xl border p-3 text-center",
                                            isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-slate-50"
                                        )}
                                    >
                                        <span className="text-xl">{b.icon}</span>
                                        <p className={cn("text-[11px] font-semibold", isDark ? "text-slate-50" : "text-slate-800")}>
                                            {b.title}
                                        </p>
                                        <p className={cn("text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>{b.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Toast */}
            <div
                id="toast"
                className={cn(
                    "fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 pointer-events-none transition-all duration-300",
                    toast.open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                    "flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-xl",
                    isDark ? "bg-[#111827] border-[#1F2937] text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
            >
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </span>
                <span id="toastMsg">{toast.msg}</span>
            </div>
        </div>
    );
}