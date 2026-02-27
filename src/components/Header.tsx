"use client"
import React, { useState } from 'react'
import { classNames } from '@/helpers'
import SearchBar from './search/SearchBar';
import HeaderCart from './HeaderCart';
import HeaderAuth from './HeaderAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HeaderPro = () => {
    const [isDark, setIsDark] = useState(false);
    const [search, setSearch] = useState("");
    const pathName = usePathname();
    return (
        <header
            className={classNames(
                "sticky top-0 z-50 border-b backdrop-blur-md",
                isDark ? "border-[#1F2937] bg-[#0B0F19]/95" : "border-slate-200 bg-white/95"
            )}
            id="navbar"
        >
            {/* Utility bar */}
            <div
                className={classNames(
                    "hidden border-b px-4 py-1.5 sm:block",
                    isDark ? "border-[#1F2937] bg-[#0d1117]" : "border-slate-100 bg-slate-50"
                )}
                id="utilityBar"
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <span className={classNames("text-[11px]", isDark ? "text-slate-400" : "text-slate-500")}>
                        🚚 Free delivery on orders above ₦15,000 · Pay on delivery available
                    </span>
                    <div className="flex gap-4">
                        <a href="#" className="text-[11px] text-slate-500 transition hover:text-violet-600">
                            Track Order
                        </a>
                        <a href="#" className="text-[11px] text-slate-500 transition hover:text-violet-600">
                            Help
                        </a>
                    </div>
                </div>
            </div>

            {/* Main bar */}
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex shrink-0 flex-col leading-none ">
                    <span className={classNames("font-display text-lg font-normal", isDark ? "text-slate-50" : "text-slate-900")} id="logoText">
                        Queen Beulah
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-600" id="logoSub">
                        Collections
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="ml-4 hidden items-center gap-0.5 md:flex">
                    <Link
                        href="/"
                        className={`rounded-md  px-3 py-1.5 text-sm transition 
                    ${pathName && pathName === "/"
                                ? ` text-violet-700 bg-violet-50`
                                : `text-slate-600 hover:bg-slate-100 font-medium hover:text-slate-900`
                            }
                    `}
                        id="nav-home"
                    >
                        Home
                    </Link>
                    <Link href="/products"
                        className={`rounded-md  px-3 py-1.5 text-sm transition 
                    ${pathName && pathName === "/products"
                                ? ` text-violet-700 bg-violet-50`
                                : `text-slate-600 hover:bg-slate-100 font-medium hover:text-slate-900`
                            }
                    `} id="nav-shop">
                        Shop
                    </Link>
                    <Link
                        href="/cart"

                        className={`rounded-md  px-3 py-1.5 text-sm transition 
                    ${pathName && pathName === "/cart"
                                ? ` text-violet-700 bg-violet-50`
                                : `text-slate-600 hover:bg-slate-100 font-medium hover:text-slate-900`
                            }
                    `}
                        id="nav-newin"
                    >
                        Cart
                    </Link>
                    <Link href="/orders" className={`rounded-md  px-3 py-1.5 text-sm transition 
                    ${pathName && pathName === "/orders"
                            ? ` text-violet-700 bg-violet-50`
                            : `text-slate-600 hover:bg-slate-100 font-medium hover:text-slate-900`
                        }
                    `} id="nav-sale">
                        Orders
                    </Link>
                    <Link
                        href="/about"
                        className={`rounded-md  px-3 py-1.5 text-sm transition 
                    ${pathName && pathName === "/about"
                                ? ` text-violet-700 bg-violet-50`
                                : `text-slate-600 hover:bg-slate-100 font-medium hover:text-slate-900`
                            }
                    `}
                        id="nav-about"
                    >
                        About
                    </Link>
                </nav>

                {/* Search bar (desktop) */}
                <SearchBar />

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-1.5">
                    <button
                        onClick={() => setIsDark((d) => !d)}
                        className={classNames(
                            "flex h-9 w-9 items-center justify-center rounded-lg border transition",
                            isDark
                                ? "border-[#1F2937] bg-[#111827] text-slate-400 hover:bg-[#1F2937] hover:text-white"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        )}
                        id="themeBtn"
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

                    <HeaderAuth />
                    <HeaderCart />

                </div>
            </div>

            {/* Mobile search */}
            <div className={classNames("border-t px-4 py-2.5 lg:hidden", isDark ? "border-[#1F2937]" : "border-slate-100")} id="mobileSearch">
                <div
                    className={classNames(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20",
                        isDark ? "border-[#1F2937] bg-[#111827]" : "border-slate-200 bg-white"
                    )}
                >
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.5" y1="16.5" x2="22" y2="22" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className={classNames(
                            "w-full bg-transparent text-sm outline-none",
                            isDark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                        )}
                    />
                </div>
            </div>
        </header>
    )
}

export default HeaderPro