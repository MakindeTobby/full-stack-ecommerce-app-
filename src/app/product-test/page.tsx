"use client"
import React, { useEffect, useMemo, useRef, useState } from "react";

type Category = "all" | "sneakers" | "bags" | "fashion" | "watches" | "kitchen" | "appliances";
type SortMode = "featured" | "price-asc" | "price-desc" | "rating";

type Product = {
    id: number;
    name: string;
    cat: Exclude<Category, "all">;
    price: number;
    orig: number | null;
    badge: "New" | "Sale" | "Hot" | null;
    emoji: string;
    rating: number;
    reviews: number;
};

const PRODUCTS: Product[] = [
    { id: 1, name: "Air Force 1 Low", cat: "sneakers", price: 45000, orig: null, badge: "New", emoji: "👟", rating: 4.8, reviews: 124 },
    { id: 2, name: "Quilted Chain Shoulder Bag", cat: "bags", price: 28000, orig: 38000, badge: "Sale", emoji: "👜", rating: 4.6, reviews: 89 },
    { id: 3, name: "Floral Midi Gown — Rust", cat: "fashion", price: 22500, orig: null, badge: null, emoji: "👗", rating: 4.9, reviews: 203 },
    { id: 4, name: "Geneva Slim Quartz Watch", cat: "watches", price: 18000, orig: null, badge: "Hot", emoji: "⌚", rating: 4.7, reviews: 56 },
    { id: 5, name: "Oversized Linen Shirt", cat: "fashion", price: 12000, orig: null, badge: "New", emoji: "👔", rating: 4.5, reviews: 78 },
    { id: 6, name: "Portable Air Cooler Fan", cat: "appliances", price: 35000, orig: 42000, badge: "Sale", emoji: "🌀", rating: 4.4, reviews: 41 },
    { id: 7, name: "Leather Backpack — Choco", cat: "bags", price: 52000, orig: null, badge: "New", emoji: "🎒", rating: 4.9, reviews: 167 },
    { id: 8, name: "Granite Coated Pan Set", cat: "kitchen", price: 9500, orig: 13000, badge: "Sale", emoji: "🍳", rating: 4.6, reviews: 94 },
    { id: 9, name: "Block-Heel Mule Nude", cat: "sneakers", price: 15000, orig: 21000, badge: "Sale", emoji: "👠", rating: 4.3, reviews: 52 },
    { id: 10, name: "Digital Blender Pro", cat: "appliances", price: 28500, orig: null, badge: null, emoji: "🥤", rating: 4.7, reviews: 88 },
    { id: 11, name: "Kaftan Set — Emerald", cat: "fashion", price: 19000, orig: null, badge: "New", emoji: "👘", rating: 4.8, reviews: 145 },
    { id: 12, name: "Chronograph Steel Watch", cat: "watches", price: 65000, orig: 80000, badge: "Sale", emoji: "🕰️", rating: 4.9, reviews: 72 },
];

const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const CAT_LABEL: Record<Exclude<Category, "all">, string> = {
    sneakers: "Sneakers",
    bags: "Bags & Purses",
    fashion: "Fashion",
    watches: "Wristwatches",
    kitchen: "Kitchen",
    appliances: "Appliances",
};

const badgeColor: Record<string, string> = {
    Sale: "bg-red-500",
    New: "bg-violet-600",
    Hot: "bg-amber-500",
};

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

export default function ProductShopPage() {
    const totalCount = PRODUCTS.length;

    const [isDark, setIsDark] = useState(false);

    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState<Category>("all");
    const [minPrice, setMinPrice] = useState<number | "">("");
    const [maxPrice, setMaxPrice] = useState<number | "">("");
    const [sortMode, setSortMode] = useState<SortMode>("featured");

    const [cartCount, setCartCount] = useState(0);
    const [wishlist, setWishlist] = useState<Set<number>>(() => new Set());
    const [addedSet, setAddedSet] = useState<Set<number>>(() => new Set());

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const toastTimer = useRef<number | null>(null);
    const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "Added to cart" });

    // Inject fonts (keeps this page “self-contained” like the HTML)
    useEffect(() => {
        const ensureLink = (href: string) => {
            const exists = Array.from(document.querySelectorAll("link")).some((l) => l.getAttribute("href") === href);
            if (!exists) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = href;
                document.head.appendChild(link);
            }
        };

        const preconnect = "https://fonts.googleapis.com";
        if (!Array.from(document.querySelectorAll("link")).some((l) => l.getAttribute("href") === preconnect)) {
            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = preconnect;
            document.head.appendChild(link);
        }

        ensureLink("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Geist:wght@300;400;500;600;700&display=swap");
    }, []);

    // Toggle dark mode by applying class on <html> (Tailwind "darkMode: class")
    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    const catCounts = useMemo(() => {
        const base: Record<Category, number> = { all: totalCount, sneakers: 0, bags: 0, fashion: 0, watches: 0, kitchen: 0, appliances: 0 };
        for (const p of PRODUCTS) base[p.cat] += 1;
        return base;
    }, [totalCount]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const pMin = minPrice === "" ? 0 : Number(minPrice);
        const pMax = maxPrice === "" ? Infinity : Number(maxPrice);

        let list = PRODUCTS.filter((p) => {
            const catOk = activeCat === "all" || p.cat === activeCat;
            const priceOk = p.price >= pMin && p.price <= pMax;
            const qOk = !q || p.name.toLowerCase().includes(q);
            return catOk && priceOk && qOk;
        });

        if (sortMode === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
        if (sortMode === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
        if (sortMode === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

        return list;
    }, [search, activeCat, minPrice, maxPrice, sortMode]);

    const showingCount = filtered.length;

    const showToast = (msg: string) => {
        setToast({ open: true, msg });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2300);
    };

    const clearAllFilters = () => {
        setActiveCat("all");
        setMinPrice("");
        setMaxPrice("");
        // keep search (matches original behavior? original "clearAllFilters" did not clear search input)
        // If you want search cleared too: setSearch("");
    };

    const setPreset = (min: number, max: number) => {
        setMinPrice(min === 0 ? "" : min);
        setMaxPrice(max === Infinity ? "" : max);
    };

    const addToCart = (id: number) => {
        setCartCount((c) => c + 1);
        setAddedSet((prev) => new Set(prev).add(id));

        const name = PRODUCTS.find((p) => p.id === id)?.name ?? "Item";
        showToast(`${name} added to cart`);

        window.setTimeout(() => {
            setAddedSet((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 2000);
    };

    const toggleWish = (id: number) => {
        setWishlist((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div
            id="body"
            className={classNames(
                "min-h-screen text-slate-900",
                isDark ? "bg-[#0B0F19] text-slate-50" : "bg-[#FFFFFF] text-slate-900"
            )}
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
            {/* bg-[#F8FAFC] */}
            {/* Local page CSS replicated from HTML */}
            <style>{`
        .font-display { font-family: 'DM Serif Display', Georgia, serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .delay-1 { animation-delay:50ms } .delay-2 { animation-delay:100ms } .delay-3 { animation-delay:150ms }
        .delay-4 { animation-delay:200ms } .delay-5 { animation-delay:250ms } .delay-6 { animation-delay:300ms }
        .delay-7 { animation-delay:350ms } .delay-8 { animation-delay:400ms } .delay-9 { animation-delay:450ms }
        .delay-10{ animation-delay:500ms } .delay-11{ animation-delay:550ms } .delay-12{ animation-delay:600ms }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker { animation: ticker 30s linear infinite; width: max-content; }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .product-card { transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
        .sidebar-overlay { backdrop-filter: blur(4px); }
      `}</style>



            {/* BREADCRUMB */}
            <div className={classNames("border-b px-4 py-2.5 sm:px-6", isDark ? "border-[#1F2937] bg-[#0d1117]" : "border-slate-200 bg-white")} id="breadcrumb">
                <div className="mx-auto flex max-w-7xl items-center gap-1.5 text-xs">
                    <a href="#" className={classNames("transition hover:text-violet-600", isDark ? "text-slate-400" : "text-slate-500")}>
                        Home
                    </a>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-violet-600">Shop</span>
                </div>
            </div>

            {/* MAIN */}
            <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-8">
                {/* Page heading */}
                <div className="mb-6">
                    <h1 className={classNames("font-display text-2xl font-normal", isDark ? "text-slate-50" : "text-slate-900")} id="pageTitle">
                        Shop Everything
                    </h1>
                    <p className={classNames("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")} id="resultCount">
                        {showingCount} products
                    </p>
                </div>

                {/* Mobile filter + sort row */}
                <div className="mb-4 flex items-center gap-3 lg:hidden">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className={classNames(
                            "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
                            isDark ? "border-[#1F2937] bg-[#111827] text-slate-200 hover:bg-[#1F2937]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                            <line x1="11" y1="18" x2="13" y2="18" />
                        </svg>
                        Filters
                    </button>

                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        id="sortSelectMobile"
                        className={classNames(
                            "flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-violet-500",
                            isDark ? "border-[#1F2937] bg-[#111827] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                        )}
                    >
                        <option value="featured">Featured</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>

                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    {/* SIDEBAR (desktop) */}
                    <aside className="hidden lg:block" id="desktopSidebar">
                        <div
                            className={classNames(
                                "sticky top-28 overflow-hidden rounded-xl border",
                                isDark ? "border-[#1F2937] bg-[#111827]" : "border-slate-200 bg-white"
                            )}
                            id="sidebarPanel"
                        >
                            {/* Header */}
                            <div className={classNames("flex items-center justify-between border-b px-4 py-3.5", isDark ? "border-[#1F2937]" : "border-slate-100")}>
                                <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <line x1="4" y1="6" x2="20" y2="6" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                        <line x1="11" y1="18" x2="13" y2="18" />
                                    </svg>
                                    <span className={classNames("text-sm font-semibold", isDark ? "text-slate-50" : "text-slate-900")} id="filterLabel">
                                        Filters
                                    </span>
                                    <span
                                        className={classNames(
                                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                            isDark ? "bg-[#1F2937] text-slate-300" : "bg-slate-100 text-slate-500"
                                        )}
                                        id="filterCount"
                                    >
                                        {showingCount}
                                    </span>
                                </div>
                                <button onClick={clearAllFilters} className="text-xs font-medium text-violet-600 transition hover:text-violet-700 hover:underline">
                                    Clear all
                                </button>
                            </div>

                            <div className="px-4 pb-4">
                                {/* Category */}
                                <div>
                                    <div className="flex w-full items-center justify-between py-3 text-sm font-semibold">
                                        <span className={classNames(isDark ? "text-slate-100" : "text-slate-800")}>Category</span>
                                        <svg className="h-4 w-4 rotate-180 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col gap-0.5 pb-3" id="catButtons">
                                        <button
                                            onClick={() => setActiveCat("all")}
                                            data-cat="all"
                                            className={classNames(
                                                "cat-btn flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                                                activeCat === "all"
                                                    ? "bg-violet-600 font-medium text-white"
                                                    : isDark
                                                        ? "text-slate-300 hover:bg-[#1a2035] hover:text-white"
                                                        : "text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            <span>All Products</span>
                                            <span className={classNames("text-xs", activeCat === "all" ? "text-violet-200" : "text-slate-400")}>{catCounts.all}</span>
                                        </button>

                                        {(
                                            [
                                                ["sneakers", CAT_LABEL.sneakers],
                                                ["bags", CAT_LABEL.bags],
                                                ["fashion", CAT_LABEL.fashion],
                                                ["watches", CAT_LABEL.watches],
                                                ["kitchen", CAT_LABEL.kitchen],
                                                ["appliances", CAT_LABEL.appliances],
                                            ] as Array<[Exclude<Category, "all">, string]>
                                        ).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveCat(key)}
                                                data-cat={key}
                                                className={classNames(
                                                    "cat-btn flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                                                    activeCat === key
                                                        ? "bg-violet-600 font-medium text-white"
                                                        : isDark
                                                            ? "text-slate-300 hover:bg-[#1a2035] hover:text-white"
                                                            : "text-slate-700 hover:bg-slate-50"
                                                )}
                                            >
                                                <span>{label}</span>
                                                <span className={classNames("text-xs", activeCat === key ? "text-violet-200" : "text-slate-400")}>{catCounts[key]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={classNames("border-t", isDark ? "border-[#1F2937]" : "border-slate-100")} />

                                {/* Price Range */}
                                <div>
                                    <div className="flex w-full items-center justify-between py-3 text-sm font-semibold">
                                        <span className={classNames(isDark ? "text-slate-100" : "text-slate-800")}>Price Range</span>
                                        <svg className="h-4 w-4 rotate-180 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>

                                    <div className="space-y-3 pb-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="mb-1 block text-[10px] font-medium text-slate-400">Min</label>
                                                <input
                                                    type="number"
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder="₦0"
                                                    id="minPrice"
                                                    className={classNames(
                                                        "w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                                                        isDark
                                                            ? "border-[#1F2937] bg-[#0B0F19] text-slate-100 placeholder:text-slate-600"
                                                            : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[10px] font-medium text-slate-400">Max</label>
                                                <input
                                                    type="number"
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder="₦∞"
                                                    id="maxPrice"
                                                    className={classNames(
                                                        "w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                                                        isDark
                                                            ? "border-[#1F2937] bg-[#0B0F19] text-slate-100 placeholder:text-slate-600"
                                                            : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1" id="pricePresets">
                                            <button
                                                onClick={() => setPreset(0, 10000)}
                                                className={classNames(
                                                    "preset-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition",
                                                    isDark ? "text-slate-400 hover:bg-[#1a2035]" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                                                Under ₦10k
                                            </button>
                                            <button
                                                onClick={() => setPreset(10000, 30000)}
                                                className={classNames(
                                                    "preset-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition",
                                                    isDark ? "text-slate-400 hover:bg-[#1a2035]" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                                                ₦10k – 30k
                                            </button>
                                            <button
                                                onClick={() => setPreset(30000, 100000)}
                                                className={classNames(
                                                    "preset-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition",
                                                    isDark ? "text-slate-400 hover:bg-[#1a2035]" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                                                ₦30k – 100k
                                            </button>
                                            <button
                                                onClick={() => setPreset(100000, Infinity)}
                                                className={classNames(
                                                    "preset-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition",
                                                    isDark ? "text-slate-400 hover:bg-[#1a2035]" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                                                ₦100k+
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={classNames("border-t", isDark ? "border-[#1F2937]" : "border-slate-100")} />

                                {/* Availability (static like the original HTML; not wired to filtering) */}
                                <div className="py-3">
                                    <p className={classNames("mb-2.5 text-sm font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>Availability</p>
                                    <div className="flex flex-col gap-0.5">
                                        {["In Stock", "Flash Sale", "New Arrivals"].map((t) => (
                                            <label
                                                key={t}
                                                className={classNames(
                                                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition",
                                                    isDark ? "text-slate-300 hover:bg-[#1a2035]" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className={classNames("flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition", isDark ? "border-slate-600 bg-[#0B0F19]" : "border-slate-300 bg-white")} />
                                                {t}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* CONTENT AREA */}
                    <section>
                        {/* Toolbar (desktop) */}
                        <div className={classNames("mb-4 hidden items-center justify-between rounded-xl border px-4 py-3 lg:flex", isDark ? "border-[#1F2937] bg-[#111827]" : "border-slate-200 bg-white")}>
                            <p className={classNames("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                                Showing{" "}
                                <span className={classNames("font-semibold", isDark ? "text-slate-100" : "text-slate-800")} id="showingCount">
                                    {showingCount}
                                </span>{" "}
                                of <span className={classNames("font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>{totalCount}</span> products
                            </p>

                            <div className="flex items-center gap-2">
                                <label className={classNames("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Sort by:</label>
                                <select
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                                    id="sortSelect"
                                    className={classNames(
                                        "rounded-lg border px-3 py-1.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                                        isDark ? "border-[#1F2937] bg-[#0B0F19] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                                    )}
                                >
                                    <option value="featured">Featured</option>
                                    <option value="price-asc">Price: Low → High</option>
                                    <option value="price-desc">Price: High → Low</option>
                                    <option value="rating">Highest Rated</option>
                                </select>
                            </div>
                        </div>

                        {/* Product grid */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3" id="productGrid">
                            {filtered.length === 0 ? (
                                <div
                                    className={classNames(
                                        "col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border py-20 text-center",
                                        isDark ? "border-[#1F2937] bg-[#111827]" : "border-slate-200 bg-white"
                                    )}
                                >
                                    <div className={classNames("flex h-16 w-16 items-center justify-center rounded-full", isDark ? "bg-[#1F2937]" : "bg-slate-100")}>
                                        <svg className={classNames("h-8 w-8", isDark ? "text-slate-600" : "text-slate-400")} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="11" cy="11" r="7" />
                                            <line x1="16.5" y1="16.5" x2="22" y2="22" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className={classNames("font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>No products found</p>
                                        <p className={classNames("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Try adjusting your filters</p>
                                    </div>
                                    <button onClick={clearAllFilters} className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700">
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                filtered.map((p, i) => {
                                    const discount = p.orig ? Math.round(((p.orig - p.price) / p.orig) * 100) : null;
                                    const isWished = wishlist.has(p.id);
                                    const isAdded = addedSet.has(p.id);

                                    const delayCls =
                                        i === 0
                                            ? ""
                                            : i === 1
                                                ? "delay-1"
                                                : i === 2
                                                    ? "delay-2"
                                                    : i === 3
                                                        ? "delay-3"
                                                        : i === 4
                                                            ? "delay-4"
                                                            : i === 5
                                                                ? "delay-5"
                                                                : i === 6
                                                                    ? "delay-6"
                                                                    : i === 7
                                                                        ? "delay-7"
                                                                        : i === 8
                                                                            ? "delay-8"
                                                                            : i === 9
                                                                                ? "delay-9"
                                                                                : i === 10
                                                                                    ? "delay-10"
                                                                                    : i === 11
                                                                                        ? "delay-11"
                                                                                        : "delay-12";

                                    return (
                                        <article
                                            key={p.id}
                                            className={classNames(
                                                "product-card group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border fade-up",
                                                delayCls,
                                                isDark ? "bg-[#111827] border-[#1F2937] hover:border-violet-800/50" : "bg-white border-slate-200 hover:border-violet-300"
                                            )}
                                            onMouseEnter={(e) => {
                                                const el = e.currentTarget;
                                                el.style.transform = "translateY(-3px)";
                                                el.style.boxShadow = isDark ? "0 4px 24px rgba(139,92,246,0.14)" : "0 4px 24px rgba(124,58,237,0.10)";
                                            }}
                                            onMouseLeave={(e) => {
                                                const el = e.currentTarget;
                                                el.style.transform = "";
                                                el.style.boxShadow = "";
                                            }}
                                        >
                                            {/* Image */}
                                            <div className={classNames("relative aspect-square overflow-hidden", isDark ? "bg-[#1a2035]" : "bg-slate-50")}>
                                                {(discount || p.badge) && (
                                                    <div className="absolute left-2.5 top-2.5 z-10">
                                                        {discount ? (
                                                            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>
                                                        ) : p.badge ? (
                                                            <span className={classNames("rounded px-1.5 py-0.5 text-[10px] font-bold text-white", badgeColor[p.badge] ?? "bg-slate-600")}>
                                                                {p.badge}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        toggleWish(p.id);
                                                    }}
                                                    className={classNames(
                                                        "absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition",
                                                        isWished
                                                            ? "border-red-200 bg-red-50 text-red-500"
                                                            : isDark
                                                                ? "border-[#1F2937] bg-[#111827]/80 text-slate-500 hover:text-red-400"
                                                                : "border-slate-200 bg-white/90 text-slate-400 hover:text-red-500"
                                                    )}
                                                    aria-label="Wishlist"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill={isWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                                    </svg>
                                                </button>

                                                <div className="flex h-full w-full select-none items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110">
                                                    {p.emoji}
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="flex flex-1 flex-col gap-2 p-3.5">
                                                <span className={classNames("text-[10px] font-semibold uppercase tracking-widest", isDark ? "text-violet-400" : "text-violet-600")}>{p.cat}</span>
                                                <h3 className={classNames("line-clamp-2 text-sm font-semibold leading-snug", isDark ? "text-slate-100" : "text-slate-900")}>{p.name}</h3>

                                                <div className="flex items-center gap-1">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <svg
                                                                key={s}
                                                                className={classNames("h-3 w-3", s <= Math.round(p.rating) ? "text-amber-400" : isDark ? "text-slate-700" : "text-slate-200")}
                                                                fill="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500">
                                                        {p.rating} ({p.reviews})
                                                    </span>
                                                </div>

                                                <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                                                    <div>
                                                        <p className={classNames("text-base font-bold leading-none", isDark ? "text-slate-50" : "text-slate-900")}>{fmtNGN(p.price)}</p>
                                                        {p.orig ? (
                                                            <p className={classNames("mt-0.5 text-xs line-through", isDark ? "text-slate-600" : "text-slate-400")}>{fmtNGN(p.orig)}</p>
                                                        ) : null}
                                                    </div>

                                                    <button
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            addToCart(p.id);
                                                        }}
                                                        className={classNames(
                                                            "add-btn flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-95",
                                                            isAdded ? "bg-green-500 text-white" : "bg-violet-600 text-white shadow-sm hover:bg-violet-700 hover:shadow-md"
                                                        )}
                                                        aria-label="Add to cart"
                                                    >
                                                        {isAdded ? (
                                                            <>
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                                Added
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                                </svg>
                                                                Cart
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination (static replica) */}
                        <div className={classNames("mt-6 flex items-center justify-between rounded-xl border px-5 py-3.5", isDark ? "border-[#1F2937] bg-[#111827]" : "border-slate-200 bg-white")} id="pagination">
                            <p className={classNames("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                                Page <span className={classNames("font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>1</span> of{" "}
                                <span className={classNames("font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>3</span>
                            </p>
                            <div className="flex gap-2">
                                <button disabled className="cursor-not-allowed rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400">
                                    ← Prev
                                </button>
                                <button className="rounded-lg border border-violet-600 bg-violet-600 px-3.5 py-2 text-sm font-medium text-white">1</button>
                                <button className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-600">
                                    2
                                </button>
                                <button className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-600">
                                    3
                                </button>
                                <button className={classNames("rounded-lg border px-4 py-2 text-sm font-medium transition", isDark ? "border-[#1F2937] bg-[#0B0F19] text-slate-200 hover:bg-[#1F2937]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                                    Next →
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* MOBILE SIDEBAR OVERLAY */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-[60]" id="mobileSidebar">
                    <div className="absolute inset-0 bg-black/50 sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
                    <div className={classNames("absolute inset-y-0 left-0 w-80 overflow-y-auto p-4", isDark ? "bg-[#0B0F19]" : "bg-white")} id="mobileSidebarPanel">
                        <div className="mb-4 flex items-center justify-between">
                            <span className={classNames("font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>Filters</span>
                            <button onClick={() => setMobileSidebarOpen(false)} className={classNames("transition", isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Category</p>
                        <div className="mb-5 flex flex-col gap-1">
                            <button
                                onClick={() => {
                                    setActiveCat("all");
                                    setMobileSidebarOpen(false);
                                }}
                                data-cat="all"
                                className={classNames(
                                    "cat-btn-m flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                                    activeCat === "all"
                                        ? "bg-violet-600 font-medium text-white"
                                        : isDark
                                            ? "text-slate-300 hover:bg-[#1a2035] hover:text-white"
                                            : "text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                <span>All Products</span>
                            </button>

                            {(
                                [
                                    ["sneakers", CAT_LABEL.sneakers],
                                    ["bags", CAT_LABEL.bags],
                                    ["fashion", CAT_LABEL.fashion],
                                    ["watches", CAT_LABEL.watches],
                                    ["kitchen", CAT_LABEL.kitchen],
                                    ["appliances", CAT_LABEL.appliances],
                                ] as Array<[Exclude<Category, "all">, string]>
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setActiveCat(key);
                                        setMobileSidebarOpen(false);
                                    }}
                                    data-cat={key}
                                    className={classNames(
                                        "cat-btn-m flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                                        activeCat === key
                                            ? "bg-violet-600 font-medium text-white"
                                            : isDark
                                                ? "text-slate-300 hover:bg-[#1a2035] hover:text-white"
                                                : "text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <div className={classNames("mb-4 border-t", isDark ? "border-[#1F2937]" : "border-slate-100")} />

                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Price Range</p>
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-[10px] font-medium text-slate-400">Min</label>
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                    className={classNames(
                                        "w-full rounded-lg border px-2.5 py-2 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                                        isDark ? "border-[#1F2937] bg-[#111827] text-slate-100" : "border-slate-200 bg-white text-slate-800"
                                    )}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-medium text-slate-400">Max</label>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                    className={classNames(
                                        "w-full rounded-lg border px-2.5 py-2 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                                        isDark ? "border-[#1F2937] bg-[#111827] text-slate-100" : "border-slate-200 bg-white text-slate-800"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button onClick={() => setPreset(0, 10000)} className={classNames("rounded-lg px-3 py-2 text-left text-sm transition", isDark ? "text-slate-300 hover:bg-[#1a2035]" : "text-slate-700 hover:bg-slate-50")}>
                                Under ₦10k
                            </button>
                            <button onClick={() => setPreset(10000, 30000)} className={classNames("rounded-lg px-3 py-2 text-left text-sm transition", isDark ? "text-slate-300 hover:bg-[#1a2035]" : "text-slate-700 hover:bg-slate-50")}>
                                ₦10k – 30k
                            </button>
                            <button onClick={() => setPreset(30000, 100000)} className={classNames("rounded-lg px-3 py-2 text-left text-sm transition", isDark ? "text-slate-300 hover:bg-[#1a2035]" : "text-slate-700 hover:bg-slate-50")}>
                                ₦30k – 100k
                            </button>
                            <button onClick={() => setPreset(100000, Infinity)} className={classNames("rounded-lg px-3 py-2 text-left text-sm transition", isDark ? "text-slate-300 hover:bg-[#1a2035]" : "text-slate-700 hover:bg-slate-50")}>
                                ₦100k+
                            </button>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => {
                                    clearAllFilters();
                                    setMobileSidebarOpen(false);
                                }}
                                className={classNames(
                                    "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition",
                                    isDark ? "border-[#1F2937] bg-[#111827] text-slate-200 hover:bg-[#1F2937]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                Clear
                            </button>
                            <button onClick={() => setMobileSidebarOpen(false)} className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* TOAST */}
            <div
                id="toast"
                className={classNames(
                    "fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 pointer-events-none flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-xl transition-all duration-300 md:bottom-8",
                    toast.open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                    isDark ? "border-[#1F2937] bg-[#111827] text-slate-100" : "border-slate-200 bg-white text-slate-900"
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