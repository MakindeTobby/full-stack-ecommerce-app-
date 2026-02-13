"use client";
import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export default function MiniCart() {
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
        className="relative inline-flex items-center px-3 py-2 rounded hover:bg-gray-100"
        onClick={() => {
          setOpen((s) => !s);
          // optimistic refresh when opening
          mutate();
        }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
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

        <span className="ml-2 text-sm">Cart</span>

        <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs">
          {count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-40">
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
