"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

function formatMoney(value: unknown) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
}

export default function MiniCart() {
  const { data, mutate } = useSWR("/api/cart", fetcher, {
    refreshInterval: 0,
  });
  const [open, setOpen] = useState(false);

  const cart = data?.cart ?? null;
  const count = cart?.itemCount ?? 0;

  return (
    <div className="relative">
      <button
        aria-label="Open cart"
        className="relative inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 transition hover:bg-slate-50"
        onClick={() => {
          setOpen((s) => !s);
          mutate();
        }}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3h2l.4 2M7 13h10l4-8H5.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1" fill="currentColor" />
          <circle cx="18" cy="20" r="1" fill="currentColor" />
        </svg>

        <span className="ml-2 text-sm font-medium">Cart</span>

        <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-sm text-slate-900">My cart</strong>
              <button
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => mutate()}
              >
                Refresh
              </button>
            </div>

            {!cart || count === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Your cart is empty
              </div>
            ) : (
              <>
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {cart.items.slice(0, 5).map((it: any) => (
                    <li
                      key={it.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                        {it.thumbnail ? (
                          <img
                            src={it.thumbnail}
                            alt={it.name_snapshot}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {it.name_snapshot ?? "Product"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Qty: {it.quantity} - {formatMoney(it.unit_price)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <div>Items</div>
                    <div>{count}</div>
                  </div>
                  <div className="mt-2 flex justify-between text-lg font-semibold text-slate-900">
                    <div>Total</div>
                    <div>{formatMoney(cart.subTotal)}</div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href="/cart"
                      className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View Cart
                    </Link>
                    <Link
                      href="/checkout"
                      className="flex-1 rounded-md bg-violet-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-violet-700"
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

