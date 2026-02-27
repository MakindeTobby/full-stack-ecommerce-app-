"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { flashSectionClass } from "@/styles";

const FLASH_IMG =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80";

export default function FlashSaleBanner() {
  const [flashSecs, setFlashSecs] = useState(4 * 3600 + 23 * 60 + 47);

  useEffect(() => {
    const id = setInterval(() => {
      setFlashSecs((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hrs = Math.floor(flashSecs / 3600);
  const mins = Math.floor((flashSecs % 3600) / 60);
  const secs = flashSecs % 60;
  const pad2 = (n: number) => String(n).padStart(2, "0");

  return (
    <section className={flashSectionClass} id="flashSection">
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-10"
        id="flashBanner"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,white 1px,transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-red-500/20">
              <Image
                src={FLASH_IMG}
                alt="Flash sale item"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                Flash Sale - Today Only
              </p>
              <h3 className="font-display text-2xl font-normal text-white sm:text-3xl">
                Up to 40% off
              </h3>
              <p className="text-sm text-slate-400">
                Selected bags, fashion & appliances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-center">
              <div
                className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-center text-lg font-bold tabular-nums text-white"
                id="fh"
              >
                {pad2(hrs)}
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                hrs
              </p>
            </div>
            <span className="pb-5 text-lg font-bold text-slate-600">:</span>
            <div className="text-center">
              <div
                className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-center text-lg font-bold tabular-nums text-white"
                id="fm"
              >
                {pad2(mins)}
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                min
              </p>
            </div>
            <span className="pb-5 text-lg font-bold text-slate-600">:</span>
            <div className="text-center">
              <div
                className="min-w-[36px] rounded-lg bg-[#1e293b] px-2 py-1.5 text-center text-lg font-bold tabular-nums text-white"
                id="fs"
              >
                {pad2(secs)}
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                sec
              </p>
            </div>
          </div>

          <Link
            href="/products"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-[0.98]"
          >
            Shop Flash Sale
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
