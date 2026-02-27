'use client'
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function QueenBeulahHome() {
    // ── Products data (from HTML)
    const PRODUCTS = useMemo(
        () => [
            { emoji: "👟", cat: "Sneakers", name: "Air Force 1 Low — Triple White", price: 45000, badge: "New", discount: null, rating: 4.8, reviews: 124 },
            { emoji: "👜", cat: "Bags", name: "Quilted Chain Shoulder Bag", price: 28000, badge: null, discount: 26, rating: 4.6, reviews: 89 },
            { emoji: "👗", cat: "Fashion", name: "Floral Midi Gown — Rust", price: 22500, badge: "Hot", discount: null, rating: 4.9, reviews: 203 },
            { emoji: "🎒", cat: "Bags", name: "Leather Backpack — Chocolate", price: 52000, badge: null, discount: 19, rating: 4.9, reviews: 167 },
            { emoji: "⌚", cat: "Watches", name: "Geneva Classic Timepiece", price: 18000, badge: "New", discount: null, rating: 4.5, reviews: 58 },
            { emoji: "👔", cat: "Fashion", name: "Oversized Linen Shirt — Ivory", price: 12000, badge: null, discount: null, rating: 4.3, reviews: 44 },
            { emoji: "👝", cat: "Bags", name: "Mini Crossbody Bag — Nude", price: 15500, badge: "Hot", discount: null, rating: 4.7, reviews: 91 },
            { emoji: "👠", cat: "Fashion", name: "Block Heel Mule — Bone White", price: 19000, badge: null, discount: 15, rating: 4.4, reviews: 76 },
        ],
        []
    );

    // ── Reviews data (from HTML)
    const REVIEWS = useMemo(
        () => [
            { init: "A", color: "bg-violet-100 text-violet-700", name: "Adaeze O.", city: "Lagos", r: 5, body: "Got my bag in 2 days, packaged perfectly. Exactly what I ordered and the quality is top notch!" },
            { init: "K", color: "bg-green-100 text-green-700", name: "Kunle B.", city: "Abuja", r: 5, body: "The sneakers are 100% authentic. I was skeptical but Queen Beulah proved me wrong. Fast delivery!" },
            { init: "F", color: "bg-amber-100 text-amber-700", name: "Fatima M.", city: "Kano", r: 4, body: "The flash sale prices are insane! Got a ₦38k bag for ₦28k. WhatsApp support is super responsive." },
            { init: "C", color: "bg-pink-100 text-pink-700", name: "Chisom E.", city: "Port Harcourt", r: 5, body: "Ordered the leather backpack as a gift. Quality and stitching is premium. Highly recommended!" },
            { init: "N", color: "bg-teal-100 text-teal-700", name: "Ngozi A.", city: "Enugu", r: 5, body: "As a repeat customer, every purchase has been perfect. The midi gown fits beautifully." },
        ],
        []
    );

    // ── helpers (from HTML)
    const fmt = (n) => "₦" + Number(n).toLocaleString("en-NG");
    const stars = (r) => "★".repeat(Math.floor(r)) + "☆".repeat(5 - Math.floor(r));
    const pad2 = (n) => String(n).padStart(2, "0");

    // ── State (mirrors original JS)
    const [isDark, setIsDark] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [heroWished, setHeroWished] = useState(false);
    const [navWishActive, setNavWishActive] = useState(false);
    const [wishSet, setWishSet] = useState(() => new Set());
    const [justAdded, setJustAdded] = useState(() => new Map()); // productIndex -> boolean (temporary)
    const [toast, setToast] = useState({ open: false, msg: "Done" });

    // Flash countdown starts at 04:23:47 (from HTML)
    const [flashSecs, setFlashSecs] = useState(4 * 3600 + 23 * 60 + 47);

    // Newsletter
    const [nlLoading, setNlLoading] = useState(false);
    const [nlDone, setNlDone] = useState(false);
    const [nlNote, setNlNote] = useState("No spam. Unsubscribe anytime. We respect your inbox.");
    const [nlEmail, setNlEmail] = useState("");

    const toastTimerRef = useRef(null);

    const showToast = (msg) => {
        setToast({ open: true, msg });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
    };

    const toggleWish = (i) => {
        setWishSet((prev) => {
            const next = new Set(prev);
            const active = next.has(i);
            if (active) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    const addToCart = (i) => {
        setCartCount((c) => c + 1);

        // mimic temporary "Added!" state for product button
        setJustAdded((prev) => {
            const next = new Map(prev);
            next.set(i, true);
            return next;
        });

        showToast(`${PRODUCTS[i].name.split("—")[0].trim()} added!`);

        setTimeout(() => {
            setJustAdded((prev) => {
                const next = new Map(prev);
                next.delete(i);
                return next;
            });
        }, 1600);
    };

    const heroAddToCart = () => {
        setCartCount((c) => c + 1);
        showToast("Quilted Chain Bag added to cart!");
        // button visual is handled by local temp state below
        setHeroCartJustAdded(true);
        setTimeout(() => setHeroCartJustAdded(false), 1800);
    };

    const [heroCartJustAdded, setHeroCartJustAdded] = useState(false);

    const toggleHeroWish = () => {
        setHeroWished((w) => {
            const next = !w;
            showToast(next ? "Added to wishlist" : "Removed from wishlist");
            return next;
        });
    };

    const toggleTheme = () => setIsDark((d) => !d);

    // ── Flash countdown interval
    useEffect(() => {
        const id = setInterval(() => {
            setFlashSecs((s) => (s <= 0 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Scroll reveal (IntersectionObserver) – from HTML
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) e.target.classList.add("visible");
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
        );

        const els = document.querySelectorAll(".reveal");
        els.forEach((el) => observer.observe(el));

        // trigger reveals already in view (from HTML)
        const t = setTimeout(() => {
            document.querySelectorAll(".reveal").forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.92) el.classList.add("visible");
            });
        }, 100);

        return () => {
            clearTimeout(t);
            observer.disconnect();
        };
    }, []);

    // ── Inject fonts (same as HTML head)
    useEffect(() => {
        const preconnect = document.createElement("link");
        preconnect.rel = "preconnect";
        preconnect.href = "https://fonts.googleapis.com";
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap";
        document.head.appendChild(preconnect);
        document.head.appendChild(css);
        return () => {
            // keep fonts cached; no cleanup needed
        };
    }, []);

    const hrs = Math.floor(flashSecs / 3600);
    const mins = Math.floor((flashSecs % 3600) / 60);
    const secs = flashSecs % 60;

    // Theme-dependent classes (matches original setDarkElements() output)
    const bodyStyle = isDark ? { backgroundColor: "#0B0F19", color: "#F9FAFB" } : undefined;

    const heroSectionClass = `relative overflow-hidden border-b dot-bg ${isDark ? "border-slate-800" : "border-slate-100"}`;

    const heroTitleClass = `font-display text-5xl font-normal leading-[1.06] tracking-tight md:text-6xl lg:text-7xl fade-up d1 ${isDark ? "text-slate-50" : "text-slate-900"
        }`;

    const heroSubClass = `mt-5 max-w-sm text-base leading-relaxed fade-up d2 ${isDark ? "text-slate-400" : "text-slate-500"}`;

    const statNumClass = `font-display text-2xl font-normal count-up ${isDark ? "text-slate-100" : "text-slate-900"}`;
    const statLblClass = `text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`;
    const statDivClass = `h-8 w-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`;

    const heroCardClass = `relative overflow-hidden rounded-3xl border aspect-[4/5] shadow-xl ${isDark ? "border-slate-700/50 bg-slate-800/50" : "border-slate-200 bg-slate-50"
        }`;

    const heroStripClass = `absolute bottom-0 left-0 right-0 border-t px-4 py-3 backdrop-blur-sm ${isDark ? "border-slate-700/50 bg-[#111827]/95" : "border-slate-100 bg-white/95"
        }`;

    const stripPriceClass = `text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`;

    const floatCardClass = `w-28 rounded-2xl border p-2.5 shadow-lg ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-white"}`;

    const catSectionClass = `border-b py-16 ${isDark ? "border-slate-800" : "border-slate-100"}`;
    const catTitleClass = `font-display text-3xl font-normal ${isDark ? "text-slate-50" : "text-slate-900"}`;

    const flashSectionClass = `border-b py-10 ${isDark ? "border-slate-800" : "border-slate-100"}`;

    const trendSectionClass = `border-b py-16 ${isDark ? "border-slate-800" : "border-slate-100"}`;
    const trendTitleClass = `font-display text-3xl font-normal ${isDark ? "text-slate-50" : "text-slate-900"}`;

    const mobileViewAllClass = `flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition hover:shadow-sm ${isDark ? "border-slate-700 bg-[#111827] text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`;

    const editSectionClass = `border-b py-16 ${isDark ? "border-slate-800" : "border-slate-100"}`;
    const editCardClass = `group flex items-center gap-5 overflow-hidden rounded-2xl border p-6 transition hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-slate-50"
        }`;
    const editHClass = `font-display mt-0.5 text-xl font-normal ${isDark ? "text-slate-100" : "text-slate-900"}`;

    const trustSectionClass = `border-b py-16 ${isDark ? "border-slate-800 bg-[#0d1117]" : "border-slate-100 bg-slate-50"}`;
    const trustTitleClass = `font-display text-3xl font-normal ${isDark ? "text-slate-50" : "text-slate-900"}`;
    const trustCardClass = `flex flex-col items-center gap-3 rounded-2xl border p-6 text-center ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-white"
        }`;
    const trustHClass = `text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`;

    const reviewSectionClass = `border-b py-16 ${isDark ? "border-slate-800" : "border-slate-100"}`;
    const reviewTitleClass = `font-display text-3xl font-normal ${isDark ? "text-slate-50" : "text-slate-900"}`;
    const ratingNumClass = `font-display text-4xl font-normal ${isDark ? "text-slate-50" : "text-slate-900"}`;
    const reviewCountClass = `mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-400"}`;
    const reviewCardClass = `w-72 flex-shrink-0 rounded-2xl border p-5 ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-white"}`;
    const reviewBodyClass = `mt-3 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`;

    const newsCardClass = `overflow-hidden rounded-3xl border ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-white"}`;
    const newsTitleClass = `font-display mt-3 text-3xl font-normal leading-snug ${isDark ? "text-slate-50" : "text-slate-900"}`;
    const newsSubClass = `mt-3 text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`;
    const newsRightClass = `hidden items-center justify-center border-l p-12 md:flex ${isDark ? "border-slate-700/50 bg-[#0d1117]" : "border-slate-100 bg-slate-50"}`;
    const nlNoteClass = `mt-3 text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`;

    const bottomNavClass = `fixed bottom-0 left-0 right-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden backdrop-blur-md ${isDark ? "border-[#1F2937] bg-[#0B0F19]/95" : "border-slate-200 bg-white/95"
        }`;

    const themeBtnClass = `flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-[#1F2937] bg-[#111827] text-slate-400 hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`;

    const onNewsletterSubmit = (e) => {
        e.preventDefault();
        if (nlLoading || nlDone) return;

        setNlLoading(true);
        // mimic original "Subscribing..." then success
        setTimeout(() => {
            setNlLoading(false);
            setNlDone(true);
            setNlNote("🎉 Welcome! We'll be in touch with exclusive deals.");
            showToast("Subscribed successfully!");
        }, 1100);
    };

    return (
        <div id="body" style={bodyStyle} className="min-h-screen">
            {/* Inline styles copied from HTML head (animations, reveal, dot-bg, etc.) */}
            <style>{`
        * { font-family: 'Geist', system-ui, sans-serif; box-sizing: border-box; }
        .font-display { font-family: 'DM Serif Display', Georgia, serif; }

        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes countUp{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .float-a  { animation: float 4s ease-in-out infinite; }
        .float-b  { animation: float 4s ease-in-out infinite; animation-delay: .7s; }
        .float-c  { animation: float 4s ease-in-out infinite; animation-delay: 1.4s; }
        .float-d0 { animation: float 4s ease-in-out infinite; animation-delay: 0s; }
        .float-d1 { animation: float 4s ease-in-out infinite; animation-delay: .5s; }
        .float-d2 { animation: float 4s ease-in-out infinite; animation-delay: 1s; }
        .float-d3 { animation: float 4s ease-in-out infinite; animation-delay: 1.5s; }
        .pulse-dot { animation: pulse2 2s ease-in-out infinite; }
        .spin      { animation: spin .9s linear infinite; }
        .fade-up   { animation: fadeUp .55s ease both; }
        .ticker    { animation: ticker 36s linear infinite; width:max-content; }
        .count-up  { animation: countUp .6s ease both; }

        .d1{animation-delay:60ms} .d2{animation-delay:120ms}
        .d3{animation-delay:180ms} .d4{animation-delay:240ms}

        .reveal { opacity:0; transform:translateY(24px); transition: opacity .65s ease, transform .65s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }

        .dot-bg {
          background-image: radial-gradient(circle at 1px 1px, rgba(124,58,237,0.06) 1px, transparent 0);
          background-size: 28px 28px;
        }

        .cat-card, .prod-card { transition: transform .18s, box-shadow .18s, border-color .18s; }
        .cat-card:hover  { transform: translateY(-4px); }
        .prod-card:hover { transform: translateY(-3px); }

        body, header, footer { transition: background-color .22s, color .22s; }

        .hide-scroll { scrollbar-width:none; }
        .hide-scroll::-webkit-scrollbar { display:none; }

        .sec-label { display:inline-flex; align-items:center; gap:8px; font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#7C3AED; }
        .sec-label::before { content:''; display:block; width:24px; height:2px; background:#7C3AED; border-radius:1px; flex-shrink:0; }
      `}</style>





            {/* HERO */}
            <section className={heroSectionClass} id="heroSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid min-h-[80vh] grid-cols-1 gap-8 py-12 md:grid-cols-2 md:items-center md:py-0">
                        {/* Left copy */}
                        <div className="order-2 flex flex-col justify-center py-8 md:order-1">
                            <div className="sec-label mb-5 fade-up">New Season · 2025</div>
                            <h1 className={heroTitleClass} id="heroTitle">
                                Dress the life
                                <br />
                                <em style={{ fontStyle: "italic" }}>you deserve</em>
                            </h1>
                            <p className={heroSubClass} id="heroSub">
                                Curated fashion, sneakers, bags, watches and lifestyle essentials — delivered to your door across Nigeria.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3 fade-up d3">
                                <a
                                    href="#"
                                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md active:scale-[0.98]"
                                >
                                    Shop the Collection
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                                    id="newArrivalsBtn"
                                >
                                    New Arrivals
                                </a>
                            </div>

                            {/* Stats */}
                            <div className="mt-10 flex items-center gap-6 fade-up d4">
                                <div className="flex flex-col">
                                    <span className={statNumClass} id="stat1">
                                        4,800+
                                    </span>
                                    <span className={statLblClass} id="statLbl1">
                                        Happy customers
                                    </span>
                                </div>
                                <div className={statDivClass} id="div1" />
                                <div className="flex flex-col">
                                    <span className={statNumClass} id="stat2">
                                        100%
                                    </span>
                                    <span className={statLblClass} id="statLbl2">
                                        Authentic products
                                    </span>
                                </div>
                                <div className={statDivClass} id="div2" />
                                <div className="flex flex-col">
                                    <span className={statNumClass} id="stat3">
                                        36
                                    </span>
                                    <span className={statLblClass} id="statLbl3">
                                        States covered
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right visual */}
                        <div className="order-1 flex items-center justify-center pt-8 pb-4 md:order-2 md:py-12">
                            <div className="relative w-full max-w-sm mx-auto float-a">
                                <div className={heroCardClass} id="heroCard">
                                    <div className="absolute left-4 top-4 z-10">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                            ⚡ Flash Sale · 26% off
                                        </span>
                                    </div>

                                    <div className="absolute right-4 top-4 z-10">
                                        <button
                                            onClick={toggleHeroWish}
                                            id="heroWishBtn"
                                            className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow-sm transition hover:scale-110 ${heroWished ? "border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:text-red-500"
                                                }`}
                                            aria-label="Wishlist"
                                        >
                                            <svg className="h-3.5 w-3.5" fill={heroWished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex h-full items-center justify-center select-none" style={{ fontSize: "8rem" }}>
                                        👜
                                    </div>

                                    <div className={heroStripClass} id="heroStrip">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-slate-500">Quilted Chain Bag</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={stripPriceClass} id="stripPrice">
                                                        ₦28,000
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 line-through">₦38,000</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={heroAddToCart}
                                                id="heroCartBtn"
                                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition active:scale-95 ${heroCartJustAdded ? "bg-green-500" : "bg-violet-600 hover:bg-violet-700"
                                                    }`}
                                                aria-label="Add to cart"
                                            >
                                                {heroCartJustAdded ? (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Float card right */}
                                <div className="absolute -right-10 top-14 hidden md:block float-b">
                                    <div className={floatCardClass} id="floatR">
                                        <div className="mb-1.5 flex h-14 items-center justify-center rounded-xl bg-slate-50 text-3xl">👟</div>
                                        <p className="truncate text-[10px] font-semibold text-slate-700">Air Force 1</p>
                                        <p className="text-[10px] font-bold text-violet-600">₦45,000</p>
                                    </div>
                                </div>

                                {/* Float card left */}
                                <div className="absolute -left-10 bottom-32 hidden md:block float-c">
                                    <div className={floatCardClass} id="floatL">
                                        <div className="mb-1.5 flex h-14 items-center justify-center rounded-xl bg-slate-50 text-3xl">⌚</div>
                                        <p className="truncate text-[10px] font-semibold text-slate-700">Geneva Watch</p>
                                        <p className="text-[10px] font-bold text-violet-600">₦18,000</p>
                                    </div>
                                </div>

                                {/* Viewers badge */}
                                <div className="absolute -top-5 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm md:flex">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 pulse-dot" />
                                    <span className="text-[11px] font-semibold text-amber-700">12 people viewing now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className={catSectionClass} id="catSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-8 flex items-end justify-between reveal">
                        <div>
                            <div className="sec-label mb-2">Browse by Category</div>
                            <h2 className={catTitleClass} id="catTitle">
                                Shop your style
                            </h2>
                        </div>
                        <a href="#" className="hidden items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition sm:flex">
                            View all{" "}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 reveal">
                        {[
                            { id: "sneakers", emoji: "👟", bg: "bg-violet-50", label: "Sneakers", count: "12 items" },
                            { id: "bags", emoji: "👜", bg: "bg-pink-50", label: "Bags", count: "9 items" },
                            { id: "fashion", emoji: "👗", bg: "bg-amber-50", label: "Fashion", count: "14 items" },
                            { id: "watches", emoji: "⌚", bg: "bg-slate-100", label: "Watches", count: "7 items" },
                            { id: "kitchen", emoji: "🍳", bg: "bg-orange-50", label: "Kitchen", count: "6 items" },
                            { id: "appliances", emoji: "🌀", bg: "bg-blue-50", label: "Appliances", count: "6 items" },
                        ].map((c) => (
                            <a
                                key={c.id}
                                href="#"
                                id={`c-${c.id}`}
                                className={`cat-card group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition ${isDark ? "border-slate-700/50 bg-[#111827] hover:border-violet-700" : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-md"
                                    }`}
                            >
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} text-3xl transition group-hover:scale-110`}>
                                    {c.emoji}
                                </div>
                                <div>
                                    <p id={`cl-${c.id}`} className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                        {c.label}
                                    </p>
                                    <p className="text-xs text-slate-400">{c.count}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* FLASH SALE BANNER */}
            <section className={flashSectionClass} id="flashSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 reveal" id="flashBanner">
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "20px 20px" }}
                        />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-2xl">⚡</div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-red-400">Flash Sale — Today Only</p>
                                    <h3 className="font-display text-2xl font-normal text-white sm:text-3xl">Up to 40% off</h3>
                                    <p className="text-sm text-slate-400">Selected bags, fashion & appliances</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-center">
                                    <div className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-lg font-bold tabular-nums text-white text-center" id="fh">
                                        {pad2(hrs)}
                                    </div>
                                    <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">hrs</p>
                                </div>
                                <span className="pb-5 text-lg font-bold text-slate-600">:</span>
                                <div className="text-center">
                                    <div className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-lg font-bold tabular-nums text-white text-center" id="fm">
                                        {pad2(mins)}
                                    </div>
                                    <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">min</p>
                                </div>
                                <span className="pb-5 text-lg font-bold text-slate-600">:</span>
                                <div className="text-center">
                                    <div className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-lg font-bold tabular-nums text-white text-center" id="fs">
                                        {pad2(secs)}
                                    </div>
                                    <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">sec</p>
                                </div>
                            </div>

                            <a
                                href="#"
                                className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-[0.98]"
                            >
                                Shop Flash Sale
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRENDING PRODUCTS */}
            <section className={trendSectionClass} id="trendSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-8 flex items-end justify-between reveal">
                        <div>
                            <div className="sec-label mb-2">Editor's Picks</div>
                            <h2 className={trendTitleClass} id="trendTitle">
                                Trending right now
                            </h2>
                        </div>
                        <a href="#" className="hidden items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition sm:flex">
                            View all{" "}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 reveal" id="productGrid">
                        {PRODUCTS.map((p, i) => {
                            const wished = wishSet.has(i);
                            const added = justAdded.get(i) === true;
                            const cardClass = `prod-card group relative flex flex-col overflow-hidden rounded-xl border ${isDark ? "border-slate-700/50 bg-[#111827]" : "border-slate-200 bg-white"
                                }`;

                            return (
                                <article
                                    key={i}
                                    id={`pc-${i}`}
                                    className={cardClass}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,58,237,.10)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                                        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
                                            {p.discount ? <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{p.discount}%</span> : null}
                                            {p.badge ? <span className="rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{p.badge}</span> : null}
                                        </div>

                                        <button
                                            onClick={() => toggleWish(i)}
                                            id={`wbtn-${i}`}
                                            className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 transition ${wished ? "border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:text-red-500"
                                                }`}
                                            aria-label="Wishlist"
                                        >
                                            <svg className="h-3.5 w-3.5" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                            </svg>
                                        </button>

                                        <div className="flex h-full w-full items-center justify-center text-6xl select-none transition-transform duration-300 group-hover:scale-110">
                                            {p.emoji}
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">{p.cat}</span>
                                        <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                                            {p.name}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-amber-400">{stars(p.rating)}</span>
                                            <span className="text-[11px] text-slate-400">
                                                {p.rating} ({p.reviews})
                                            </span>
                                        </div>

                                        <div className="mt-auto flex items-end justify-between pt-1">
                                            <div>
                                                <p className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{fmt(p.price)}</p>
                                                {p.discount ? (
                                                    <p className="text-xs text-slate-400 line-through">{fmt(Math.round(p.price / (1 - p.discount / 100)))}</p>
                                                ) : null}
                                            </div>

                                            <button
                                                onClick={() => addToCart(i)}
                                                id={`cbtn-${i}`}
                                                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition active:scale-95 ${added ? "bg-green-500" : "bg-violet-600 hover:bg-violet-700"
                                                    }`}
                                            >
                                                {added ? (
                                                    <>
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        Added!
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
                        })}
                    </div>

                    <div className="mt-6 flex justify-center sm:hidden">
                        <a href="#" className={mobileViewAllClass} id="mobileViewAll">
                            View all products{" "}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* EDITORIAL BANNERS */}
            <section className={editSectionClass} id="editSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 reveal">
                        <a href="#" className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 p-8 transition hover:shadow-xl">
                            <div
                                className="absolute inset-0 opacity-[0.05]"
                                style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "22px 22px" }}
                            />
                            <div className="absolute right-6 top-6 text-7xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 select-none">👔</div>
                            <div className="relative z-10">
                                <span className="mb-2 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">New Arrivals</span>
                                <h3 className="font-display text-2xl font-normal leading-snug text-white">
                                    Fresh drops
                                    <br />
                                    this week
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">Oversized shirts, kaftans, midi gowns</p>
                                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white opacity-80 group-hover:opacity-100 transition">
                                    Shop now{" "}
                                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>
                            </div>
                        </a>

                        <div className="flex flex-col gap-4">
                            <a href="#" className={editCardClass} id="editWatch">
                                <div className="text-5xl transition-transform duration-300 group-hover:scale-110 select-none flex-shrink-0">⌚</div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Wristwatches</span>
                                    <h4 className={editHClass} id="editWatchH">
                                        Time is luxury
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">7 premium timepieces</p>
                                    <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition group-hover:text-violet-700">
                                        Explore{" "}
                                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
                                </div>
                            </a>

                            <a href="#" className={editCardClass} id="editApp">
                                <div className="text-5xl transition-transform duration-300 group-hover:scale-110 select-none flex-shrink-0">🌀</div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Appliances</span>
                                    <h4 className={editHClass} id="editAppH">
                                        Home essentials
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">Blenders, coolers, more</p>
                                    <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition group-hover:text-violet-700">
                                        Explore{" "}
                                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST BADGES */}
            <section className={trustSectionClass} id="trustSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-10 text-center reveal">
                        <div className="sec-label mb-2 justify-center">Why Queen Beulah</div>
                        <h2 className={trustTitleClass} id="trustTitle">
                            Built on trust
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 reveal">
                        {[
                            { n: 1, icon: "✅", title: "100% Authentic", body: "Every product verified before it reaches you. No fakes, ever.", bg: "bg-violet-50" },
                            { n: 2, icon: "🚚", title: "Free Delivery", body: "Orders above ₦15,000 ship free anywhere in Nigeria.", bg: "bg-green-50" },
                            { n: 3, icon: "↩️", title: "7-Day Returns", body: "Not happy? Return within 7 days, no questions asked.", bg: "bg-amber-50" },
                            { n: 4, icon: "💬", title: "WhatsApp Support", body: "Real humans, fast replies. We're always here for you.", bg: "bg-blue-50" },
                        ].map((t) => (
                            <div key={t.n} className={trustCardClass} id={`trust${t.n}`}>
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.bg} text-2xl`}>{t.icon}</div>
                                <div>
                                    <p className={trustHClass} id={`t${t.n}`}>
                                        {t.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* REVIEWS */}
            <section className={reviewSectionClass} id="reviewSection">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-8 flex items-end justify-between reveal">
                        <div>
                            <div className="sec-label mb-2">Social Proof</div>
                            <h2 className={reviewTitleClass} id="reviewTitle">
                                What customers say
                            </h2>
                        </div>

                        <div className="hidden flex-col items-end sm:flex">
                            <div className="flex items-baseline gap-2">
                                <span className={ratingNumClass} id="ratingNum">
                                    4.8
                                </span>
                                <span className="text-sm text-slate-500">/ 5</span>
                            </div>
                            <div className="flex text-amber-400 text-sm">★★★★★</div>
                            <p className={reviewCountClass} id="reviewCount">
                                Based on 2,300+ reviews
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 reveal" id="reviewList">
                        {REVIEWS.map((r, idx) => (
                            <div key={idx} className={reviewCardClass}>
                                <div className="flex text-amber-400 text-sm">
                                    {"★".repeat(r.r)}
                                    {"☆".repeat(5 - r.r)}
                                </div>
                                <p className={reviewBodyClass}>&quot;{r.body}&quot;</p>
                                <div className="mt-4 flex items-center gap-2.5">
                                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${r.color} text-sm font-bold`}>{r.init}</div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">{r.name}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {r.city} · Verified buyer
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEWSLETTER */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className={newsCardClass} id="newsCard">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-8 sm:p-12">
                                <div className="sec-label mb-3">Stay in the loop</div>
                                <h2 className={newsTitleClass} id="newsTitle">
                                    Get early access
                                    <br />
                                    to flash sales
                                </h2>
                                <p className={newsSubClass} id="newsSub">
                                    Subscribe and be the first to know about new drops, exclusive promo codes, and members-only flash deals.
                                </p>

                                <div id="newsFormWrap">
                                    {!nlDone ? (
                                        <form onSubmit={onNewsletterSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                                            <input
                                                id="nlEmail"
                                                type="email"
                                                placeholder="Your email address"
                                                required
                                                value={nlEmail}
                                                onChange={(e) => setNlEmail(e.target.value)}
                                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white"
                                            />
                                            <button
                                                type="submit"
                                                id="nlBtn"
                                                disabled={nlLoading}
                                                className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-80"
                                            >
                                                {nlLoading ? (
                                                    <>
                                                        <svg className="h-4 w-4 spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                        Subscribing…
                                                    </>
                                                ) : (
                                                    <>
                                                        Subscribe
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <line x1="5" y1="12" x2="19" y2="12" />
                                                            <polyline points="12 5 19 12 12 19" />
                                                        </svg>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
                                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-green-800">You're in! 🎉</p>
                                                <p className="text-xs text-green-700">Check your inbox for a special discount code.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className={nlNoteClass} id="nlNote">
                                    {nlNote}
                                </p>
                            </div>

                            <div className={newsRightClass} id="newsRight">
                                <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
                                    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm float-d0">
                                        <span className="text-3xl">👜</span>
                                        <span className="text-[10px] font-semibold text-violet-600">20% off</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm float-d1">
                                        <span className="text-3xl">👟</span>
                                        <span className="text-[10px] font-semibold text-violet-600">Early access</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm float-d2">
                                        <span className="text-3xl">⌚</span>
                                        <span className="text-[10px] font-semibold text-violet-600">Flash alerts</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm float-d3">
                                        <span className="text-3xl">👗</span>
                                        <span className="text-[10px] font-semibold text-violet-600">New drops</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                        <div className="col-span-2 sm:col-span-1">
                            <div className="flex flex-col leading-none mb-4">
                                <span className="font-display text-xl text-white">Queen Beulah</span>
                                <span className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-400">Collections</span>
                            </div>
                            <p className="text-xs leading-relaxed">Fashion, sneakers, bags, and lifestyle — curated and delivered across Nigeria.</p>
                            <div className="mt-4 flex gap-2">
                                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400 hover:border-violet-500 hover:text-violet-400 transition">
                                    ig
                                </a>
                                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400 hover:border-violet-500 hover:text-violet-400 transition">
                                    tw
                                </a>
                                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/40 text-[10px] text-[#25D366] hover:bg-[#25D366]/10 transition">
                                    wa
                                </a>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Shop</p>
                            <ul className="space-y-2 text-xs">
                                <li><a href="#" className="hover:text-white transition">All Products</a></li>
                                <li><a href="#" className="hover:text-white transition">Sneakers</a></li>
                                <li><a href="#" className="hover:text-white transition">Bags & Purses</a></li>
                                <li><a href="#" className="hover:text-white transition">Fashion</a></li>
                                <li><a href="#" className="hover:text-white transition">Flash Sales ⚡</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Help</p>
                            <ul className="space-y-2 text-xs">
                                <li><a href="#" className="hover:text-white transition">Track Order</a></li>
                                <li><a href="#" className="hover:text-white transition">Returns Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Shipping Info</a></li>
                                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Company</p>
                            <ul className="space-y-2 text-xs">
                                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Use</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
                        <p className="text-xs">© 2025 Queen Beulah Collections. All rights reserved.</p>
                        <p className="text-xs">Made with ❤️ in Nigeria</p>
                    </div>
                </div>
            </footer>

            {/* WhatsApp float */}


            {/* Mobile bottom nav */}
            <nav className={bottomNavClass} id="bottomNav">
                <a href="#" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-violet-600">
                    <span className="rounded-lg bg-violet-50 p-1">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </span>
                    Home
                </a>

                <a href="#" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Shop
                </a>

                <a href="#" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    Orders
                </a>

                <a href="#" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    Saved
                </a>

                <a href="#" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    Me
                </a>
            </nav>

            {/* Toast */}
            <div
                id="toast"
                className={`fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 pointer-events-none transition-all duration-300 flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xl md:bottom-8 ${toast.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                style={{ transform: toast.open ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(12px)" }}
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