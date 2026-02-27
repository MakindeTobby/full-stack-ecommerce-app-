"use client";
import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { classNames } from "@/helpers";

const fetcher = (url: string) =>
    fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export default function HeaderCart() {
    const { data, error, mutate } = useSWR("/api/cart", fetcher, {
        refreshInterval: 0,
    });
    const [open, setOpen] = useState(false);

    const cart = data?.cart ?? null;
    const count = cart?.itemCount ?? 0;

    return (
        <div className="relative">


            <button
                aria-label="Open cart"
                onClick={() => {
                    setOpen((s) => !s);
                    // optimistic refresh when opening
                    mutate();
                }}
                className={classNames(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
                    //   isDark ? "border-violet-900/40 bg-violet-900/20 text-violet-300 hover:bg-violet-900/30" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                )}
                id="cartBtn"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span className="hidden sm:inline">Cart</span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white" id="cartBadge">
                    {count}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-2xl shadow-lg z-40">
                    <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                            <strong>My cart</strong>
                            <button
                                className="text-sm text-gray-500"
                                onClick={() => mutate()}
                            >
                                Refresh
                            </button>
                        </div>

                        {!cart || count === 0 ? (
                            <div className="text-sm text-gray-500 py-8 text-center">
                                Your cart is empty
                            </div>
                        ) : (
                            <>
                                <ul className="space-y-2 max-h-64 overflow-y-auto">
                                    {cart.items.slice(0, 5).map((it: any) => (
                                        <li key={it.id} className="flex gap-3 items-start">
                                            <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                                                {it.thumbnail ? (
                                                    <img
                                                        src={it.thumbnail}
                                                        alt={it.name_snapshot}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                    {it.name_snapshot ?? "Product"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Qty: {it.quantity} • $
                                                    {String(Number(it.unit_price).toFixed(2))}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-3 border-t pt-3">
                                    <div className="flex justify-between text-sm">
                                        <div>Items</div>
                                        <div>{count}</div>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold mt-2">
                                        <div>Total</div>
                                        <div>${cart.subTotal}</div>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <Link
                                            href="/cart"
                                            className="flex-1 text-center px-3 py-2 border rounded"
                                        >
                                            View Cart
                                        </Link>
                                        <Link
                                            href="/checkout"
                                            className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded"
                                        >
                                            Checkout
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
