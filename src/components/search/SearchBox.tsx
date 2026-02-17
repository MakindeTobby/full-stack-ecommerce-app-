"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  slug: string;
  name_en: string;
  base_price: number | string | null;
  image_url?: string | null;
};

type SearchBoxProps = {
  initialQuery?: string;
  placeholder?: string;
  variant?: "header" | "page";
  showRecent?: boolean;
  className?: string;
};

const STORAGE_KEY = "qb.search.recent";
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function SearchBox({
  initialQuery = "",
  placeholder = "Search products...",
  variant = "page",
  showRecent = false,
  className,
}: SearchBoxProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const trimmed = query.trim();

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NGN",
      }),
    [],
  );

  useEffect(() => {
    if (!showRecent) return;
    setRecent(readRecent());
  }, [showRecent]);

  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?${new URLSearchParams({
            q: trimmed,
            page: "1",
            pageSize: "6",
          }).toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items?: Suggestion[] };
        if (active) setSuggestions(data.items ?? []);
      } catch {
        // ignore suggest errors
      } finally {
        if (active) setLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(handle);
    };
  }, [trimmed]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const persistRecent = (term: string) => {
    if (!showRecent) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(
      0,
      MAX_RECENT,
    );
    setRecent(next);
    writeRecent(next);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    persistRecent(trimmed);
    setOpen(false);
    router.push(`/search?${new URLSearchParams({ q: trimmed }).toString()}`);
  };

  const onClearRecent = () => {
    setRecent([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const surfaceRecent = showRecent && recent.length > 0 && trimmed.length === 0;
  const showDropdown =
    open && (trimmed.length > 0 || surfaceRecent || loading);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", variant === "header" && "max-w-md", className)}
    >
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 shadow-sm transition focus-within:border-black/30",
          variant === "page" && "rounded-2xl px-4 py-3",
        )}
      >
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent text-sm outline-none",
            variant === "page" && "text-base",
          )}
          aria-label="Search products"
        />
        <button
          type="submit"
          className={cn(
            "rounded-full border border-black/10 bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black/90",
            variant === "page" && "px-4 py-2 text-sm",
          )}
        >
          Search
        </button>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          {surfaceRecent ? (
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span>Recent searches</span>
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="rounded-full border border-black/10 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      persistRecent(term);
                      setOpen(false);
                      router.push(
                        `/search?${new URLSearchParams({ q: term }).toString()}`,
                      );
                    }}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {trimmed.length > 0 && (
            <div className="border-t border-black/5 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Suggestions
              </div>
              {loading && (
                <div className="py-2 text-sm text-gray-500">Searching...</div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="py-2 text-sm text-gray-500">
                  No suggestions yet.
                </div>
              )}
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-black/5 p-2 transition hover:bg-gray-50"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                      {item.image_url ? (
                        <Image
                          src={String(item.image_url)}
                          alt={item.name_en}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {item.name_en}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currency.format(Number(item.base_price ?? 0))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  persistRecent(trimmed);
                  setOpen(false);
                  router.push(
                    `/search?${new URLSearchParams({ q: trimmed }).toString()}`,
                  );
                }}
                className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Search for "{trimmed}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
